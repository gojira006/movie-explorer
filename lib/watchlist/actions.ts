"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const movieSchema = z.object({
  tmdbId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, "A title is required."),
  posterPath: z.string().nullable(),
});

const idSchema = z.object({
  tmdbId: z.coerce.number().int().positive(),
});

const statusSchema = idSchema.extend({
  status: z.enum(["want_to_watch", "watched"]),
});

const favoriteSchema = idSchema.extend({
  isFavorite: z.boolean(),
});

// Every action re-checks the session on the server. The buttons are hidden from
// logged-out visitors, but the client is not a security boundary -- anyone can
// post to a Server Action endpoint directly.
async function requireUser() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return supabase;
}

function revalidate() {
  // The header, the grids and the watchlist page all read the watchlist, so
  // revalidating the root path is enough to repaint all of them.
  revalidatePath("/", "layout");
}

export async function addToWatchlist(input: unknown) {
  const parsed = movieSchema.safeParse(input);

  if (!parsed.success) {
    return;
  }

  const supabase = await requireUser();
  const { tmdbId, title, posterPath } = parsed.data;

  // ignoreDuplicates turns the unique (user_id, tmdb_id) constraint into a
  // no-op on the second click instead of an error.
  const { error } = await supabase
    .from("watchlist")
    .upsert(
      { tmdb_id: tmdbId, title, poster_path: posterPath },
      { onConflict: "user_id,tmdb_id", ignoreDuplicates: true },
    );

  if (error) {
    throw new Error(`Could not add to your watchlist: ${error.message}`);
  }

  revalidate();
}

export async function removeFromWatchlist(input: unknown) {
  const parsed = idSchema.safeParse(input);

  if (!parsed.success) {
    return;
  }

  const supabase = await requireUser();
  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("tmdb_id", parsed.data.tmdbId);

  if (error) {
    throw new Error(`Could not remove from your watchlist: ${error.message}`);
  }

  revalidate();
}

export async function setStatus(input: unknown) {
  const parsed = statusSchema.safeParse(input);

  if (!parsed.success) {
    return;
  }

  const supabase = await requireUser();
  const { tmdbId, status } = parsed.data;

  // No user_id filter: RLS decides which rows this update is allowed to touch,
  // so a crafted tmdb_id can only ever affect the caller's own row.
  const { error } = await supabase
    .from("watchlist")
    .update({ status })
    .eq("tmdb_id", tmdbId);

  if (error) {
    throw new Error(`Could not update that movie: ${error.message}`);
  }

  revalidate();
}

export async function setFavorite(input: unknown) {
  const parsed = favoriteSchema.safeParse(input);

  if (!parsed.success) {
    return;
  }

  const supabase = await requireUser();
  const { tmdbId, isFavorite } = parsed.data;

  const { error } = await supabase
    .from("watchlist")
    .update({ is_favorite: isFavorite })
    .eq("tmdb_id", tmdbId);

  if (error) {
    throw new Error(`Could not update that movie: ${error.message}`);
  }

  revalidate();
}