import { NextResponse } from "next/server";
import { openai, SOKRAT_SYSTEM_PROMPT, OPENAI_MODEL } from "@/utils/openai";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/chat`);
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}