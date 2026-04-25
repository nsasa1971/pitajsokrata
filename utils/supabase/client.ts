import { createBrowserClient } from "@supabase/ssr";

const URL = "https://gfsubnxdtnqxubqekfnw.supabase.co";
const KEY = "sb_publishable_1buonM8j4IFN0knOcbuLiQ_4wSgmlcC";

export const createClient = () => createBrowserClient(URL, KEY);