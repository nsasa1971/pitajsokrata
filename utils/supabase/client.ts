import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gfsubnxdtnqxubqekfnw.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_1buonM8j4IFN0knOcbuLiQ_4wSgmlcC";

export const createClient = () =>
  createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);