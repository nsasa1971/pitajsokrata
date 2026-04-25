import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const URL = "https://gfsubnxdtnqxubqekfnw.supabase.co";
const KEY = "sb_publishable_1buonM8j4IFN0knOcbuLiQ_4wSgmlcC";

export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(URL, KEY, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });
};