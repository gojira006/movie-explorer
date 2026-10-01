import "server-only";

// Every import of this file lives in a Server Component or Server Action, and
// the "server-only" import at the top makes the build fail loudly if a Client
// Component ever imports it. That is what guarantees TMDB_READ_TOKEN cannot
// reach the browser.

const BASE_URL = "https://api.themoviedb.org/3";

// Catalogue data barely changes, so an hour of caching is plenty and keeps us
// well inside TMDB's rate limit.
const REVALIDATE_SECONDS = 3600;

export class TmdbError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "TmdbError";
  }
}

export type Paged<T> = {
  page: number;
  total_pages: number;
  total_results: number;
  results: T[];
};

export type Genre = {
  id: number;
  name: string;
};

export type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
};

type Video = {
  key: string;
  site: string;
  type: string;
  official: boolean;
};

export type MovieDetail = Movie & {
  runtime: number | null;
  genres: Genre[];
  credits: { cast: CastMember[] };
  videos: { results: Video[] };
  similar: Paged<Movie>;
};

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  // process.env is read here, inside server code, so the value is never inlined
  // into a client bundle. NEXT_PUBLIC_ vars would be — that prefix is why the
  // TMDB token must not have it.
  const token = process.env.TMDB_READ_TOKEN;

  if (!token) {
    throw new Error(
      "TMDB_READ_TOKEN is not set. Add it to .env.local and restart the dev server.",
    );
  }

  const url = new URL(`${BASE_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: {
      // A v4 Read Access Token goes in the Authorization header as a Bearer
      // token. The older v3 api_key query parameter does not work with it.
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    // TMDB explains the failure in a JSON "status_message". Surfacing it turns
    // a blank page into an obvious "wrong key" or "wrong parameter" mistake.
    const detail = (await response.text()).slice(0, 200);
    throw new TmdbError(
      response.status,
      `TMDB responded ${response.status} for ${path}: ${detail}`,
    );
  }

  return (await response.json()) as T;
}

export function getTrendingThisWeek() {
  return tmdbFetch<Paged<Movie>>("/trending/movie/week");
}

export function getPopular() {
  return tmdbFetch<Paged<Movie>>("/movie/popular");
}

export function getTopRated() {
  return tmdbFetch<Paged<Movie>>("/movie/top_rated");
}

export function searchMovies(query: string, page: number) {
  return tmdbFetch<Paged<Movie>>("/search/movie", {
    query,
    page,
    include_adult: "false",
  });
}

export function getGenres() {
  return tmdbFetch<{ genres: Genre[] }>("/genre/movie/list");
}

export type DiscoverOptions = {
  genre?: number;
  year?: number;
  sort: string;
  page: number;
};

export function discoverMovies({ genre, year, sort, page }: DiscoverOptions) {
  return tmdbFetch<Paged<Movie>>("/discover/movie", {
    with_genres: genre,
    primary_release_year: year,
    sort_by: sort,
    page,
    include_adult: "false",
  });
}

export function getMovieDetails(id: number) {
  // One request instead of four: TMDB can attach related collections to the
  // same response with append_to_response.
  return tmdbFetch<MovieDetail>(`/movie/${id}`, {
    append_to_response: "credits,videos,similar",
  });
}

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most popular" },
  { value: "vote_average.desc", label: "Highest rated" },
  { value: "primary_release_date.desc", label: "Newest first" },
  { value: "primary_release_date.asc", label: "Oldest first" },
  { value: "revenue.desc", label: "Highest revenue" },
];

export { SORT_OPTIONS };

// Anything in the URL is treated as untrusted, so the sort key is checked
// against this list before it reaches the TMDB query string.
export function isValidSort(value: string | undefined): value is string {
  return SORT_OPTIONS.some((option) => option.value === value);
}

const CURRENT_YEAR = new Date().getFullYear();

export const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - 1959 },
  (_, index) => CURRENT_YEAR - index,
);

const IMAGE_BASE = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null, size = "w342") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function backdropUrl(path: string | null, size = "w1280") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function profileUrl(path: string | null, size = "w185") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function findTrailerKey(videos: Video[]): string | null {
  const onYouTube = videos.filter((video) => video.site === "YouTube");
  // Older titles sometimes only have a teaser, so fall back rather than showing
  // an empty video section.
  const trailer =
    onYouTube.find((video) => video.type === "Trailer" && video.official) ??
    onYouTube.find((video) => video.type === "Trailer") ??
    onYouTube[0];

  return trailer?.key ?? null;
}