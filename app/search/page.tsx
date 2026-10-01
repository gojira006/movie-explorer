import type { Metadata } from "next";
import MovieGrid from "@/components/MovieGrid";
import Pagination from "@/components/Pagination";
import { searchMovies } from "@/lib/tmdb";
import { getWatchlistMap } from "@/lib/watchlist/queries";

export const metadata: Metadata = {
  title: "Search",
};

// Cards show watchlist state, so results are rendered per visitor. See the note
// in app/page.tsx for why this is declared rather than inferred.
export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  // searchParams is a Promise in Next.js 15+. Reading the term and the page from
  // the URL (instead of client state) is what makes a search result link
  // shareable and the back button work.
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const page = Math.max(1, Number(params.page) || 1);

  if (!query) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-2xl font-semibold">Search movies</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Type a title in the search box above to get started.
        </p>
      </div>
    );
  }

  const [results, watchlist] = await Promise.all([
    searchMovies(query, page),
    getWatchlistMap(),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">
        Results for “{query}”
      </h1>
      <p className="mb-6 text-sm text-zinc-400">
        {results.total_results.toLocaleString()} title
        {results.total_results === 1 ? "" : "s"} found
      </p>

      {results.results.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-zinc-400">
          Nothing matched that search. Try a different title.
        </p>
      ) : (
        <>
          <MovieGrid movies={results.results} watchlist={watchlist} />
          <Pagination
            page={results.page}
            totalPages={results.total_pages}
            query={{ q: query }}
          />
        </>
      )}
    </div>
  );
}