export default function MovieLoading() {
  return (
    <div className="space-y-12" aria-busy="true" aria-label="Loading movie">
      <div className="flex flex-col gap-6 rounded-2xl p-4 sm:flex-row sm:p-8">
        <div className="w-40 shrink-0 animate-pulse rounded-xl bg-zinc-800/60 sm:w-56" />
        <div className="flex-1 space-y-3">
          <div className="h-10 w-2/3 animate-pulse rounded bg-zinc-800/60" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-800/40" />
          <div className="h-24 w-full animate-pulse rounded bg-zinc-800/40" />
        </div>
      </div>
      <div className="aspect-video w-full animate-pulse rounded-xl bg-zinc-800/40" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="h-16 w-12 shrink-0 animate-pulse rounded-lg bg-zinc-800/60" />
            <div className="h-8 flex-1 animate-pulse rounded bg-zinc-800/40" />
          </div>
        ))}
      </div>
    </div>
  );
}