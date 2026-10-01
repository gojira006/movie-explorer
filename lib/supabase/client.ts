import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Import this only from a Client Component. The browser authenticates with the
// anon key, which is safe to expose precisely because RLS decides what it can
// read — there is no privileged key anywhere in this app.
let cached: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (cached) {
    return cached;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local.",
    );
  }

  cached = createBrowserClient(url, anonKey);
  return cached;
}
