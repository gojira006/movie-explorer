import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export function isAdminConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

// This key bypasses RLS entirely, so it is confined to this one module and is
// only ever called from Server Actions. Two things need it and nothing else
// does: resolving a username to an account at login, and checking that a
// username is free at signup. Both are questions about other people's rows,
// which the anon key is correctly forbidden from answering.
export function createAdminClient(): SupabaseClient {
  if (!isAdminConfigured()) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local.",
    );
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        // This client never represents a visitor's session. It must not read
        // cookies, write session cookies, or refresh a token of its own --
        // there is nobody here to authenticate.
        persistSession: false,
        autoRefreshToken: false,
        skipAutoInitialize: true,
      },
    },
  );
}
