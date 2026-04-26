import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { openai, SOKRAT_SYSTEM_PROMPT, OPENAI_MODEL } from "@/utils/openai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, userId, sessionId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Poruke su obavezne." }, { status: 400 });
    }

    const supabase = await createClient();

    let currentSessionId = sessionId;
    let turnsInSession = 0;

    // Za registrovane korisnike
    if (userId && userId !== "anonymous") {
      if (!currentSessionId) {
        const { data: newSession } = await supabase
          .from("chat_sessions")
          .insert({
            user_id: userId,
            message_user: messages[messages.length - 1].content,
            message_sokrat: "",
            turn_number: 0,
            is_final: false,
          })
          .select("id")
          .single();

        if (newSession) currentSessionId = newSession.id;
      } else {
        const { data: sessionData } = await supabase
          .from("chat_sessions")
          .select("turn_number")
          .eq("id", currentSessionId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        turnsInSession = sessionData?.turn_number || 0;
      }
    }

    // Pozovi OpenAI
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SOKRAT_SYSTEM_PROMPT },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      temperature: 0.9,
      max_tokens: 800,
    });

    const aiResponse = completion.choices[0].message.content;
    if (!aiResponse) throw new Error("Nema odgovora od OpenAI-ja");

    // Parsiraj odgovor
    let parsed: { message: string; turn_number: number; is_final: boolean; insights: string[] };
    
    try {
      parsed = JSON.parse(aiResponse);

      // Ako message sadrži ugnježdeni JSON - izvuci ga
      if (parsed.message && parsed.message.includes('"message"')) {
        try {
          const inner = JSON.parse(parsed.message);
          if (inner.message) {
            parsed.message = inner.message;
            parsed.turn_number = inner.turn_number || parsed.turn_number;
            parsed.is_final = inner.is_final !== undefined ? inner.is_final : parsed.is_final;
            parsed.insights = inner.insights || parsed.insights;
          }
        } catch {
          // Ako ne može da parsira, ostavi kako jeste
        }
      }

      if (!parsed.turn_number) parsed.turn_number = turnsInSession + 1;
      if (parsed.is_final === undefined) parsed.is_final = parsed.turn_number >= 10;
      if (!parsed.insights) parsed.insights = [];
    } catch {
      // Ako ceo odgovor nije JSON, koristi ga kao tekst
      let cleanMessage = aiResponse;
      
      // Pokušaj da izvučeš čist tekst iz bilo kakvog JSON-a u stringu
      try {
        const obj = JSON.parse(aiResponse);
        if (obj.message) cleanMessage = obj.message;
      } catch {
        // Nije JSON, koristi ceo tekst
      }

      const t = turnsInSession + 1;
      parsed = {
        message: cleanMessage,
        turn_number: t,
        is_final: t >= 10,
        insights: t >= 10 ? ["Sesija završena."] : [],
      };
    }

    // Sačuvaj u bazu za registrovane
    if (userId && userId !== "anonymous" && currentSessionId) {
      const { data: firstMsg } = await supabase
        .from("chat_sessions")
        .select("id, message_sokrat")
        .eq("id", currentSessionId)
        .single();

      if (firstMsg && !firstMsg.message_sokrat) {
        // Prvi odgovor - ažuriraj postojeći red
        await supabase
          .from("chat_sessions")
          .update({
            message_sokrat: parsed.message,
            turn_number: parsed.turn_number,
            insights: parsed.is_final ? parsed.insights : null,
            is_final: parsed.is_final,
            session_group: currentSessionId,
          })
          .eq("id", currentSessionId);
      } else {
        // Novi red
        await supabase.from("chat_sessions").insert({
          user_id: userId,
          session_group: currentSessionId,
          message_user: messages[messages.length - 1].content,
          message_sokrat: parsed.message,
          turn_number: parsed.turn_number,
          insights: parsed.is_final ? parsed.insights : null,
          is_final: parsed.is_final,
        });
      }
    }

    return NextResponse.json({
      message: parsed.message,
      turn_number: parsed.turn_number,
      is_final: parsed.is_final,
      insights: parsed.insights || [],
      sessionId: currentSessionId,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Interna greška";
    console.error("Chat API error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}