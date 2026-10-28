import Link from "next/link";

export function Pagination({
  page,
  hasMore,
  href,
  prevLabel = "Previous",
  nextLabel = "Next",
}: {
  page: number;
  hasMore: boolean;
  href: (page: number) => string;
  prevLabel?: string;
  nextLabel?: string;
}) {
  if (page <= 1 && !hasMore) return null;
  return (
    <nav className="mt-8 flex items-center justify-between border-t border-rule pt-4 text-sm" aria-label="Pages">
      {page > 1 ? (
        <Link className="btn btn-quiet" href={href(page - 1)}>
          {prevLabel}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted">Page {page}</span>
      {hasMore ? (
        <Link className="btn btn-quiet" href={href(page + 1)}>
          {nextLabel}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function pageParam(v: string | string[] | undefined) {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n > 0 ? Math.min(n, 1000) : 1;
}
