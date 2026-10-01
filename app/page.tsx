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
    <div className="space-y-16 sm:space-y-20">
      <section className="grid gap-6 border-b border-white/8 pb-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:pb-10">
        <div>
          <p className="eyebrow mb-3">Now showing</p>
          <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.06em] text-zinc-50 sm:text-5xl">Your next great watch starts here.</h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-400 sm:text-base">Handpicked by what film lovers are watching, talking about, and saving this week.</p>
        </div>
        <Link href="/browse" className="w-fit rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-200">Explore the catalogue</Link>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">The pulse</p>
            <h2 className="section-heading">Trending this week</h2>
          </div>
          <span className="hidden text-sm text-zinc-500 sm:block">Fresh momentum, one frame at a time</span>
        </div>
        <MovieGrid movies={trending.results} watchlist={watchlist} />
      </section>

      <section>
        <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-white/8 pb-4">
          <h2 className="section-heading">Popular</h2>
          <Link
            href="/browse?sort=popularity.desc"
            className="text-sm font-medium text-amber-200 transition-colors hover:text-amber-100"
          >
            Browse all →
          </Link>
        </div>
        <MovieGrid movies={popular.results} watchlist={watchlist} />
      </section>

      <section>
        <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-white/8 pb-4">
          <h2 className="section-heading">Top Rated</h2>
          <Link
            href="/browse?sort=vote_average.desc"
            className="text-sm font-medium text-amber-200 transition-colors hover:text-amber-100"
          >
            Browse all →
          </Link>
        </div>
        <MovieGrid movies={topRated.results} watchlist={watchlist} />
      </section>
    </div>
  );
}
