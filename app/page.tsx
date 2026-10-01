import type { Metadata } from "next";
import Link from "next/link";
import MovieGrid from "@/components/MovieGrid";
import { getPopular, getTopRated, getTrendingThisWeek } from "@/lib/tmdb";
import { getWatchlistMap } from "@/lib/watchlist/queries";

export const metadata: Metadata = {
  title: "Home",
};

// This page reads the session so every card can show watchlist state, which
// means the HTML is different per visitor and cannot be served from a shared
// cache. The TMDB responses are still cached for an hour by the fetch cache,
// so this costs rendering, not API calls. Declared explicitly because Next would
// otherwise infer it from a cookies() call that only happens when Supabase is
// configured -- leaving the page's rendering mode to depend on an env var.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // The three sections are independent, so one Promise.all replaces three
  // sequential round trips to TMDB.
  const [trending, popular, topRated] = await Promise.all([
    getTrendingThisWeek(),
    getPopular(),
    getTopRated(),
  ]);

  // Reading the session opts this route into dynamic rendering, which is the
  // cost of showing watchlist state on every card. The TMDB responses above are
  // still served from the fetch cache, so this does not cost extra API calls.
  const watchlist = await getWatchlistMap();

  return (
    <div className="space-y-12">
      <section>
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">
          Trending this week
        </h1>
        <MovieGrid movies={trending.results} watchlist={watchlist} />
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">Popular</h2>
          <Link
            href="/browse?sort=popularity.desc"
            className="text-sm text-zinc-400 hover:text-zinc-100"
          >
            Browse all →
          </Link>
        </div>
        <MovieGrid movies={popular.results} watchlist={watchlist} />
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">Top Rated</h2>
          <Link
            href="/browse?sort=vote_average.desc"
            className="text-sm text-zinc-400 hover:text-zinc-100"
          >
            Browse all →
          </Link>
        </div>
        <MovieGrid movies={topRated.results} watchlist={watchlist} />
      </section>
    </div>
  );
}