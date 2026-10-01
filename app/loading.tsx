function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }, (_, index) => (
        <div key={index}>
          <div className="aspect-2/3 animate-pulse rounded-xl bg-zinc-800/60" />
          <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-zinc-800/60" />
          <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-zinc-800/40" />
        </div>
      ))}
    </div>
  );
}

export default function HomeLoading() {
  return (
    <div className="space-y-12" aria-busy="true" aria-label="Loading movies">
      <section>
        <div className="mb-4 h-8 w-64 animate-pulse rounded bg-zinc-800/60" />
        <SkeletonGrid />
      </section>
      <section>
        <div className="mb-4 h-6 w-32 animate-pulse rounded bg-zinc-800/60" />
        <SkeletonGrid />
      </section>
    </div>
  );
}