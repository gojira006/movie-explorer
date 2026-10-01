import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  // Every query string except `page`, so filters and search terms survive paging.
  query: Record<string, string>;
};

function pageHref(page: number, query: Record<string, string>) {
  const params = new URLSearchParams({ ...query, page: String(page) });
  return `?${params.toString()}`;
}

const buttonClass =
  "rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-amber-300/40 hover:bg-amber-300/10 hover:text-amber-100";

export default function Pagination({ page, totalPages, query }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-4">
      {page > 1 ? (
        <Link href={pageHref(page - 1, query)} className={buttonClass}>
          Previous
        </Link>
      ) : null}

      <span className="text-sm text-zinc-400">
        Page {page} of {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={pageHref(page + 1, query)} className={buttonClass}>
          Next
        </Link>
      ) : null}
    </nav>
  );
}
