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

    // Za registrovane korisnike - kreiraj novu sesiju ako nema
    if (userId && userId !== "anonymous") {
      if (!currentSessionId) {
        // Nova sesija
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

        if (newSession) {
          currentSessionId = newSession.id;
        }
      } else {
        // Dobavi trenutni turn
        const { data: lastMsg } = await supabase
          .from("chat_sessions")
          .select("turn_number")
          .eq("session_group", currentSessionId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        turnsInSession = lastMsg?.turn_number || 0;
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

    // Parsiraj
    let parsed: { message: string; turn_number: number; is_final: boolean; insights: string[] };
    try {
      parsed = JSON.parse(aiResponse);
      if (!parsed.turn_number) parsed.turn_number = turnsInSession + 1;
      if (parsed.is_final === undefined) parsed.is_final = parsed.turn_number >= 10;
      if (!parsed.insights) parsed.insights = [];
    } catch {
      const t = turnsInSession + 1;
      parsed = {
        message: aiResponse,
        turn_number: t,
        is_final: t >= 10,
        insights: t >= 10 ? ["Sesija završena."] : [],
      };
    }

    // Sačuvaj u bazu za registrovane
    if (userId && userId !== "anonymous" && currentSessionId) {
      // Prva poruka u sesiji - ažuriraj postojeći red
      const { data: firstRow } = await supabase
        .from("chat_sessions")
        .select("id, message_sokrat")
        .eq("id", currentSessionId)
        .single();

      if (firstRow && !firstRow.message_sokrat) {
        // Ovo je prvi odgovor - ažuriraj
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
        // Dodaj novi red
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