import type { Metadata } from "next";
import Link from "next/link";
import MovieGrid from "@/components/MovieGrid";
import Pagination from "@/components/Pagination";
import {
  SORT_OPTIONS,
  YEAR_OPTIONS,
  discoverMovies,
  getGenres,
  isValidSort,
} from "@/lib/tmdb";
import { getWatchlistMap } from "@/lib/watchlist/queries";

export const metadata: Metadata = {
  title: "Browse",
};

// Cards show watchlist state, so results are rendered per visitor. See the note
// in app/page.tsx for why this is declared rather than inferred.
export const dynamic = "force-dynamic";

const selectClass =
  "rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-white/30 focus:outline-none";

export default async function BrowsePage({ searchParams }: PageProps<"/browse">) {
  const params = await searchParams;

  // Filter values arrive from the URL, so each one is validated before it is
  // handed to TMDB.
  const genreParam = typeof params.genre === "string" ? params.genre : "";
  const yearParam = typeof params.year === "string" ? params.year : "";
  const sortParam = typeof params.sort === "string" ? params.sort : undefined;

  const { genres } = await getGenres();

  const genreIds = new Set(genres.map((entry) => entry.id));
  const genre = Number(genreParam);
  const year = Number(yearParam);
  const sort = isValidSort(sortParam) ? sortParam : SORT_OPTIONS[0].value;
  const page = Math.max(1, Number(params.page) || 1);

  const [results, watchlist] = await Promise.all([
    discoverMovies({
      genre: genreIds.has(genre) ? genre : undefined,
      year: YEAR_OPTIONS.includes(year) ? year : undefined,
      sort,
      page,
    }),
    getWatchlistMap(),
  ]);

  // Only the filters that are actually set are carried into pagination links.
  const activeQuery: Record<string, string> = { sort };
  if (genreIds.has(genre)) activeQuery.genre = genreParam;
  if (YEAR_OPTIONS.includes(year)) activeQuery.year = yearParam;

  const hasFilters = Boolean(activeQuery.genre || activeQuery.year);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Browse movies</h1>

      <form
        action="/browse"
        className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
      >
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Genre
          <select name="genre" defaultValue={activeQuery.genre ?? ""} className={selectClass}>
            <option value="">Any genre</option>
            {genres.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Release year
          <select name="year" defaultValue={activeQuery.year ?? ""} className={selectClass}>
            <option value="">Any year</option>
            {YEAR_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Sort by
          <select name="sort" defaultValue={sort} className={selectClass}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
        >
          Apply
        </button>

        {hasFilters ? (
          <Link
            href={`/browse?sort=${sort}`}
            className="px-1 py-2 text-sm text-zinc-400 hover:text-zinc-100"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <p className="mb-6 text-sm text-zinc-400">
        {results.total_results.toLocaleString()} title
        {results.total_results === 1 ? "" : "s"} found
      </p>

      {results.results.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-zinc-400">
          No movies match those filters. Try widening them.
        </p>
      ) : (
        <>
          <MovieGrid movies={results.results} watchlist={watchlist} />
          <Pagination
            page={results.page}
            totalPages={results.total_pages}
            query={activeQuery}
          />
        </>
      )}
    </div>
  );
}