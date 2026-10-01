import Image from "next/image";
import Link from "next/link";
import WatchlistButtons from "@/components/WatchlistButtons";
import { posterUrl, type Movie } from "@/lib/tmdb";
import type { WatchlistEntry } from "@/lib/watchlist/queries";

export default function MovieCard({
  movie,
  entry,
}: {
  movie: Movie;
  entry: WatchlistEntry | null;
}) {
  const poster = posterUrl(movie.poster_path);
  const year = movie.release_date.slice(0, 4);

  return (
    <article>
      {/* The buttons sit outside the Link on purpose: nesting a button inside an
          anchor is invalid HTML and makes the click target ambiguous. */}
      <Link href={`/movie/${movie.id}`} className="group block">
        <div className="relative aspect-2/3 overflow-hidden rounded-xl bg-zinc-800 ring-1 ring-white/5">
          {poster ? (
            <Image
              src={poster}
              alt={movie.title}
              fill
              sizes="(min-width: 1280px) 200px, (min-width: 768px) 25vw, 45vw"
              className="object-cover transition group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full items-center justify-center p-3 text-center text-xs text-zinc-500">
              {movie.title}
            </span>
          )}
        </div>
        <p className="mt-2 truncate text-sm font-medium text-zinc-100 group-hover:text-white">
          {movie.title}
        </p>
        <p className="text-xs text-zinc-500">
          {year || "—"} · ★ {movie.vote_average.toFixed(1)}
        </p>
      </Link>

      <div className="mt-2">
        <WatchlistButtons
          tmdbId={movie.id}
          title={movie.title}
          posterPath={movie.poster_path}
          entry={entry}
        />
      </div>
    </article>
  );
}