import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import WatchlistButtons from "@/components/WatchlistButtons";
import { posterUrl } from "@/lib/tmdb";
import { getWatchlistEntries } from "@/lib/watchlist/queries";

export const metadata: Metadata = {
  title: "Watchlist",
};

const TABS = [
  { id: "want_to_watch", label: "Want to watch" },
  { id: "watched", label: "Watched" },
  { id: "favorites", label: "Favorites" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const EMPTY_MESSAGES: Record<TabId, string> = {
  want_to_watch: "Nothing queued up yet. Add a movie from any poster grid.",
  watched: "Nothing marked as watched yet.",
  favorites: "No favorites yet. Tap the star on a saved movie.",
};

export default async function WatchlistPage({
  searchParams,
}: PageProps<"/watchlist">) {
  const params = await searchParams;
  const requested = typeof params.tab === "string" ? params.tab : "";

  // The tab comes from the URL, so it is checked against the known list before
  // it is used to filter anything.
  const activeTab: TabId = TABS.some((tab) => tab.id === requested)
    ? (requested as TabId)
    : "want_to_watch";

  const entries = await getWatchlistEntries();

  const visible = entries.filter((entry) => {
    if (activeTab === "favorites") {
      return entry.isFavorite;
    }

    return entry.status === activeTab;
  });

  const counts: Record<TabId, number> = {
    want_to_watch: entries.filter((entry) => entry.status === "want_to_watch").length,
    watched: entries.filter((entry) => entry.status === "watched").length,
    favorites: entries.filter((entry) => entry.isFavorite).length,
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Your watchlist</h1>

      {/* Tabs are plain links rather than client-side state, so a tab is a
          shareable URL and works before any JavaScript loads. */}
      <nav className="mb-8 flex flex-wrap gap-2 border-b border-white/5 pb-3">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <Link
              key={tab.id}
              href={`/watchlist?tab=${tab.id}`}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-zinc-900"
                  : "rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
              }
            >
              {tab.label}
              <span className={isActive ? "ml-1.5 text-zinc-500" : "ml-1.5 text-zinc-500"}>
                {counts[tab.id]}
              </span>
            </Link>
          );
        })}
      </nav>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-16 text-center">
          <p className="text-sm text-zinc-400">{EMPTY_MESSAGES[activeTab]}</p>
          <Link
            href="/browse"
            className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
          >
            Browse movies
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((entry) => {
            const poster = posterUrl(entry.posterPath, "w185");

            return (
              <li
                key={entry.tmdbId}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <div className="relative h-27 w-18 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                  {poster ? (
                    <Image
                      src={poster}
                      alt={entry.title}
                      fill
                      sizes="72px"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-32 flex-1">
                  <Link
                    href={`/movie/${entry.tmdbId}`}
                    className="block truncate font-medium text-zinc-100 hover:text-white"
                  >
                    {entry.title}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {entry.status === "watched" ? "Watched" : "Want to watch"}
                  </p>
                </div>

                <WatchlistButtons
                  tmdbId={entry.tmdbId}
                  title={entry.title}
                  posterPath={entry.posterPath}
                  entry={entry}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}