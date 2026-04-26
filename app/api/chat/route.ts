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
        // Nova sesija - kreiraj placeholder
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
        // Postojeća sesija - dohvati turn
        const { data: sessionData } = await supabase
          .from("chat_sessions")
          .select("turn_number")
          .eq("session_group", currentSessionId)
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

    // Parsiraj odgovor - izvuci cist tekst
    let messageText = aiResponse;
    let turnNumber = turnsInSession + 1;
    let isFinal = false;
    let insights: string[] = [];

    try {
      const parsed = JSON.parse(aiResponse);
      
      if (parsed.message) {
        // Proveri da li message sadrzi ugnjezdeni JSON
        if (typeof parsed.message === "string" && parsed.message.includes('"message"')) {
          try {
            const inner = JSON.parse(parsed.message);
            messageText = inner.message || parsed.message;
            turnNumber = inner.turn_number || parsed.turn_number || turnNumber;
            isFinal = inner.is_final !== undefined ? inner.is_final : false;
            insights = inner.insights || [];
          } catch {
            messageText = parsed.message;
          }
        } else {
          messageText = parsed.message;
        }
        
        turnNumber = parsed.turn_number || turnNumber;
        isFinal = parsed.is_final !== undefined ? parsed.is_final : turnNumber >= 10;
        insights = parsed.insights || [];
      }
    } catch {
      // Nije JSON, koristi ceo tekst
      messageText = aiResponse;
      isFinal = turnNumber >= 10;
    }

    // Sačuvaj u bazu za registrovane
    if (userId && userId !== "anonymous" && currentSessionId) {
      // Obriši placeholder (praznu prvu poruku)
      await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", currentSessionId)
        .is("message_sokrat", "");

      // Dodaj novu poruku
      await supabase.from("chat_sessions").insert({
        user_id: userId,
        session_group: currentSessionId,
        message_user: messages[messages.length - 1].content,
        message_sokrat: messageText,
        turn_number: turnNumber,
        insights: isFinal ? insights : null,
        is_final: isFinal,
      });
    }

    return NextResponse.json({
      message: messageText,
      turn_number: turnNumber,
      is_final: isFinal,
      insights: insights,
      sessionId: currentSessionId,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Interna greška";
    console.error("Chat API error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}