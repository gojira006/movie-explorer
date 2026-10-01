import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // The second `headers` argument is deliberately dropped: it only matters
        // for responses a CDN might cache, and the one that needs those headers
        // is the redirect built in proxy.ts.
        setAll(cookiesToSet) {
          // Cookies may only be written from a Server Action or Route Handler.
          // This throws inside a Server Component, which is safe to swallow:
          // proxy.ts already owns session refreshes on every navigation.
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Read-only cookie context.
          }
        },
      },
    },
  );
}
