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

    if (userId && userId !== "anonymous") {
      if (currentSessionId) {
        const { data } = await supabase
          .from("chat_sessions")
          .select("turn_number")
          .eq("id", currentSessionId)
          .single();
        turnsInSession = data?.turn_number || 0;
      }
    }

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
    if (!aiResponse) throw new Error("Nema odgovora");

    // Parsiraj
    let msg = aiResponse;
    let turn = turnsInSession + 1;
    let fin = turn >= 10;
    let ins: string[] = [];

    try {
      const p = JSON.parse(aiResponse);
      if (p.message) msg = p.message;
      if (p.turn_number) turn = p.turn_number;
      if (p.is_final !== undefined) fin = p.is_final;
      if (p.insights) ins = p.insights;
    } catch {}

    // Čuvaj u bazi
    if (userId && userId !== "anonymous") {
      if (currentSessionId) {
        // Ažuriraj postojeću sesiju - samo poslednja poruka
        await supabase
          .from("chat_sessions")
          .update({
            message_sokrat: msg,
            turn_number: turn,
            is_final: fin,
            insights: fin ? ins : null,
          })
          .eq("id", currentSessionId);
      } else {
        // Nova sesija - sačuvaj odmah
        const { data: newS } = await supabase
          .from("chat_sessions")
          .insert({
            user_id: userId,
            message_user: messages[messages.length - 1].content,
            message_sokrat: msg,
            turn_number: turn,
            is_final: fin,
            insights: fin ? ins : null,
          })
          .select("id")
          .single();
        if (newS) currentSessionId = newS.id;
      }
    }

    return NextResponse.json({
      message: msg,
      turn_number: turn,
      is_final: fin,
      insights: ins,
      sessionId: currentSessionId,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Interna greška";
    console.error("Chat API error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}