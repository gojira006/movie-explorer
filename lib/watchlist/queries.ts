import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type WatchlistStatus = "want_to_watch" | "watched";

export type WatchlistEntry = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  status: WatchlistStatus;
  isFavorite: boolean;
};

// Keyed by TMDB id so a grid of posters needs one lookup per card rather than
// one database query per card.
export type WatchlistMap = Map<number, WatchlistEntry>;

// The shape supabase-js hands back for our select() call. Spelled out here
// instead of relying on generated types, because there is only one table.
type WatchlistRow = {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  status: WatchlistStatus;
  is_favorite: boolean;
  created_at: string;
};

const SELECT_COLUMNS = "tmdb_id, title, poster_path, status, is_favorite, created_at";

// Returns null when nobody is signed in, so callers can skip the query entirely
// rather than filtering out an empty result afterwards.
async function getSessionClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? supabase : null;
}

export async function getWatchlistMap(): Promise<WatchlistMap> {
  const supabase = await getSessionClient();

  if (!supabase) {
    return new Map();
  }

  // RLS silently hides other users' rows, so this select is already scoped to
  // the signed-in user -- there is deliberately no user_id filter here.
  const { data, error } = await supabase
    .from("watchlist")
    .select(SELECT_COLUMNS);

  if (error) {
    throw new Error(`Could not load your watchlist: ${error.message}`);
  }

  const rows: WatchlistRow[] = data ?? [];

  return new Map(rows.map((row) => [row.tmdb_id, toEntry(row)]));
}

export async function getWatchlistEntries(): Promise<WatchlistEntry[]> {
  const supabase = await getSessionClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("watchlist")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load your watchlist: ${error.message}`);
  }

  const rows: WatchlistRow[] = data ?? [];
  return rows.map(toEntry);
}

function toEntry(row: WatchlistRow): WatchlistEntry {
  return {
    tmdbId: row.tmdb_id,
    title: row.title,
    posterPath: row.poster_path,
    status: row.status,
    isFavorite: row.is_favorite,
  };
}