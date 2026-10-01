import MovieCard from "./MovieCard";
import type { Movie } from "@/lib/tmdb";
import type { WatchlistMap } from "@/lib/watchlist/queries";

export default function MovieGrid({
  movies,
  watchlist,
}: {
  movies: Movie[];
  watchlist: WatchlistMap;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          entry={watchlist.get(movie.id) ?? null}
        />
      ))}
    </div>
  );
}