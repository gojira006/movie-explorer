import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import WatchlistButtons from "@/components/WatchlistButtons";
import { posterUrl, type Movie } from "@/lib/tmdb";
import type { WatchlistEntry } from "@/lib/watchlist/queries";

export default function MovieCard({
  movie,
  entry,
  index = 0,
}: {
  movie: Movie;
  entry: WatchlistEntry | null;
  index?: number;
}) {
  const poster = posterUrl(movie.poster_path);
  const year = movie.release_date.slice(0, 4);

  return (
    <article className="poster-card" style={{ "--card-index": index } as React.CSSProperties}>
      {/* The buttons sit outside the Link on purpose: nesting a button inside an
          anchor is invalid HTML and makes the click target ambiguous. */}
      <Link href={`/movie/${movie.id}`} className="group block" transitionTypes={["nav-forward"]}>
        <ViewTransition name={`movie-poster-${movie.id}`} share="movie-poster" default="none">
        <div className="poster-card__image relative aspect-2/3 overflow-hidden rounded-xl bg-zinc-800 ring-1 ring-white/8">
          {poster ? (
            <Image
              src={poster}
              alt={movie.title}
              fill
              sizes="(min-width: 1280px) 200px, (min-width: 768px) 25vw, 45vw"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center p-3 text-center text-xs text-zinc-500">
              {movie.title}
            </span>
          )}
        </div>
        </ViewTransition>
        <div className="mt-3 flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-semibold tracking-[-0.02em] text-zinc-100 transition-colors group-hover:text-amber-200">{movie.title}</p>
          <span className="shrink-0 text-xs font-medium text-amber-200/90">{movie.vote_average.toFixed(1)}</span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">{year || "Release year unknown"}</p>
      </Link>

      <div className="mt-2.5">
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
