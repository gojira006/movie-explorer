"use client";

// error.tsx must be a Client Component: Next.js gives it the reset callback that
// re-renders the segment on the client.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm text-zinc-400">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      {error.digest ? (
        <p className="text-xs text-zinc-600">Reference: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
      >
        Try again
      </button>
    </div>
  );
}