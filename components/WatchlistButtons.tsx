"use client";

import { useTransition } from "react";
import type { WatchlistEntry } from "@/lib/watchlist/queries";
import {
  addToWatchlist,
  removeFromWatchlist,
  setFavorite,
  setStatus,
} from "@/lib/watchlist/actions";

type WatchlistButtonsProps = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  entry: WatchlistEntry | null;
};

const idleClass =
  "rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-300 transition hover:bg-white/10 hover:text-white";

const activeClass =
  "rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300";

export default function WatchlistButtons({
  tmdbId,
  title,
  posterPath,
  entry,
}: WatchlistButtonsProps) {
  // useTransition keeps the buttons disabled for the whole round trip: these are
  // Server Actions, so there is no local promise to await.
  const [isPending, startTransition] = useTransition();

  const isSaved = entry !== null;
  const isWatched = entry?.status === "watched";
  const isFavorite = entry?.isFavorite ?? false;

  const buttonClass = (active: boolean) => (active ? activeClass : idleClass);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {isSaved ? (
        <>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                void setStatus({
                  tmdbId,
                  status: isWatched ? "want_to_watch" : "watched",
                });
              })
            }
            className={buttonClass(isWatched)}
          >
            {isWatched ? "✓ Watched" : "Mark watched"}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                void setFavorite({ tmdbId, isFavorite: !isFavorite });
              })
            }
            className={buttonClass(isFavorite)}
          >
            {isFavorite ? "★" : "☆"}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                void removeFromWatchlist({ tmdbId });
              })
            }
            className={idleClass}
          >
            Remove
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              void addToWatchlist({ tmdbId, title, posterPath });
            })
          }
          className={idleClass}
        >
          + Watchlist
        </button>
      )}
    </div>
  );
}