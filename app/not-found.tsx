import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="max-w-md text-sm text-zinc-400">
        This page does not exist, or the movie you were looking for is no longer
        available.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
      >
        Back to home
      </Link>
    </div>
  );
}