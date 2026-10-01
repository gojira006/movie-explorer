import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Next 16 renamed the middleware file convention to proxy. It must sit at the
// project root, and it runs on the nodejs runtime rather than edge.
export default async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // With placeholder keys there is no session to refresh, so let requests
  // through untouched instead of failing every page.
  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let refreshed: { name: string; value: string; options: CookieOptions }[] = [];
  let noCacheHeaders: Record<string, string> = {};

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        // Update the request cookies as well as the response ones. Anything
        // rendered further down this same request reads the request cookies, so
        // leaving them stale would show the pre-refresh session.
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        refreshed = cookiesToSet;
        noCacheHeaders = headers;
      },
    },
  });

  // getUser() asks Supabase whether the token is still valid and hands back
  // freshly written cookies when it is close to expiring. getSession() would
  // only trust whatever the cookie claims, which is not a security check.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const response = (!user && request.nextUrl.pathname.startsWith("/watchlist")
    ? buildRedirect(request)
    : NextResponse.next({ request }));

  for (const cookie of refreshed) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  // Supabase sends no-cache headers alongside the first cookie write. Applying
  // them stops Vercel's CDN from serving one signed-in user's HTML to another.
  for (const [name, value] of Object.entries(noCacheHeaders)) {
    response.headers.set(name, value);
  }

  return response;
}

function buildRedirect(request: NextRequest) {
  const target = request.nextUrl.clone();
  target.pathname = "/login";
  target.search = "";
  target.searchParams.set("next", request.nextUrl.pathname);

  return NextResponse.redirect(target);
}

export const config = {
  matcher: [
    // Static assets never need a session refresh, and running the proxy over
    // them would only add latency to every image.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
