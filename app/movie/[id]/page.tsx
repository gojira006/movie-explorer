import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import MovieGrid from "@/components/MovieGrid";
import WatchlistButtons from "@/components/WatchlistButtons";
import { getWatchlistMap } from "@/lib/watchlist/queries";
import {
  TmdbError,
  backdropUrl,
  findTrailerKey,
  getMovieDetails,
  posterUrl,
  profileUrl,
} from "@/lib/tmdb";

export const metadata: Metadata = {
  title: "Movie",
};

// The page shows this movie's watchlist state. See the note in app/page.tsx for
// why this is declared rather than inferred.
export const dynamic = "force-dynamic";

function formatDate(value: string) {
  if (!value) {
    return "Release date unknown";
  }

  // timeZone: "UTC" keeps the day from shifting when the server and the browser
  // are in different timezones.
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function MoviePage({ params }: PageProps<"/movie/[id]">) {
  const { id } = await params;
  const movieId = Number(Array.isArray(id) ? id[0] : id);

  if (!Number.isInteger(movieId) || movieId <= 0) {
    notFound();
  }

  let movie: Awaited<ReturnType<typeof getMovieDetails>>;

  try {
    movie = await getMovieDetails(movieId);
  } catch (error) {
    // A 404 from TMDB means the movie does not exist, which is a routing-level
    // "not found" rather than a crash. Any other error stays an error.
    if (error instanceof TmdbError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  const poster = posterUrl(movie.poster_path, "w500");
  const backdrop = backdropUrl(movie.backdrop_path);
  const trailerKey = findTrailerKey(movie.videos.results);
  const cast = movie.credits.cast.slice(0, 10);
  const watchlist = await getWatchlistMap();

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl">
        {backdrop ? (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            sizes="(min-width: 1280px) 1280px, 100vw"
            className="object-cover opacity-30"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />

        <div className="relative flex flex-col gap-6 p-4 sm:flex-row sm:p-8">
          <div className="w-40 shrink-0 sm:w-56">
            <div className="relative aspect-2/3 overflow-hidden rounded-xl bg-zinc-800">
              {poster ? (
                <Image
                  src={poster}
                  alt={movie.title}
                  fill
                  priority
                  sizes="(min-width: 640px) 224px, 160px"
                  className="object-cover"
                />
              ) : null}
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {movie.title}
            </h1>

            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
              <span>{formatDate(movie.release_date)}</span>
              {movie.runtime ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{movie.runtime} min</span>
                </>
              ) : null}
              <span aria-hidden="true">·</span>
              <span className="text-amber-300">
                ★ {movie.vote_average.toFixed(1)}
                <span className="text-zinc-500">
                  {" "}
                  ({movie.vote_count.toLocaleString()} votes)
                </span>
              </span>
            </p>

            {movie.genres.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <li
                    key={genre.id}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300"
                  >
                    {genre.name}
                  </li>
                ))}
              </ul>
            ) : null}

            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-zinc-300">
              {movie.overview || "No overview available for this movie."}
            </p>

            <WatchlistButtons
              tmdbId={movie.id}
              title={movie.title}
              posterPath={movie.poster_path}
              entry={watchlist.get(movie.id) ?? null}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Trailer</h2>
        {trailerKey ? (
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}`}
              title={`${movie.title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-zinc-400">
            No trailer is available for this movie.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Cast</h2>
        {cast.length === 0 ? (
          <p className="text-sm text-zinc-400">No cast information available.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {cast.map((member) => {
              const profile = profileUrl(member.profile_path);

              return (
                <li key={member.id} className="flex items-center gap-3">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                    {profile ? (
                      <Image
                        src={profile}
                        alt={member.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {member.name}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {member.character}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {movie.similar.results.length > 0 ? (
        <section>
          <h2 className="mb-4 text-xl font-semibold tracking-tight">
            Similar movies
          </h2>
          <MovieGrid movies={movie.similar.results} watchlist={watchlist} />
        </section>
      ) : null}
    </div>
  );
}