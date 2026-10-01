import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import AuthNav from "@/components/AuthNav";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Movie Explorer",
    template: "%s · Movie Explorer",
  },
  description: "Browse and search movies, and keep track of what you want to watch.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
        <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
            <Link href="/" className="shrink-0 font-semibold tracking-tight">
              Movie Explorer
            </Link>

            <nav className="flex items-center gap-4 text-sm text-zinc-400">
              <Link href="/" className="hover:text-zinc-100">
                Home
              </Link>
              <Link href="/browse" className="hover:text-zinc-100">
                Browse
              </Link>
              <Link href="/watchlist" className="hover:text-zinc-100">
                Watchlist
              </Link>
            </nav>

            {/* A plain GET form: the browser navigates to /search?q=... and the
                page reads the term from the URL, so results stay shareable. It
                drops to its own full-width row on narrow screens so the logo
                and account controls keep their space. */}
            <form
              action="/search"
              className="order-last w-full sm:order-none sm:ml-auto sm:w-auto sm:max-w-xs sm:flex-1"
            >
              <input
                type="search"
                name="q"
                placeholder="Search movies…"
                aria-label="Search movies"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
              />
            </form>

            <AuthNav />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8">
          {children}
        </main>

        <footer className="mt-12 border-t border-white/5 px-4 py-6">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 text-center text-xs text-zinc-500">
            <p>
              This product uses the TMDB API but is not endorsed or certified by
              TMDB.
            </p>

            {/* TODO (you): drop the official TMDB logo in here when you have it.
                Put the file in /public and uncomment the line below. Serving it
                from your own folder means no next.config change is needed. */}
            {/* <Image src="/tmdb-logo.svg" alt="The Movie Database" width={124} height={20} /> */}
          </div>
        </footer>
      </body>
    </html>
  );
}