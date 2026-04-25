import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const URL = "https://gfsubnxdtnqxubqekfnw.supabase.co";
const KEY = "sb_publishable_1buonM8j4IFN0knOcbuLiQ_4wSgmlcC";

export const updateSession = async (request: NextRequest) => {
  let res = NextResponse.next({ request });
  const supabase = createServerClient(URL, KEY, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        res = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options)
        );
      },
    },
  });
  await supabase.auth.getUser();
  return res;
};