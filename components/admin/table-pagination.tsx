import Link from "next/link";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  query?: string;
  pageParam?: string;
};

export function TablePagination({ page, pageSize, total, basePath, query = "", pageParam = "page" }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const href = (target: number) => {
    const params = new URLSearchParams();
    params.set(pageParam, String(target));
    if (query) params.set("q", query);
    return `${basePath}?${params.toString()}`;
  };

  return (
    <nav aria-label="Table pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3 text-sm">
      <p className="text-[var(--muted)]">
        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link className="rounded-md border border-[var(--border)] px-3 py-1.5 hover:bg-[var(--brand-cream)]" href={href(page - 1)}>Previous</Link>
        ) : (
          <span aria-disabled="true" className="rounded-md border border-[var(--border)] px-3 py-1.5 text-[var(--muted)] opacity-50">Previous</span>
        )}
        <span className="px-1 text-[var(--muted)]">Page {page} of {pages}</span>
        {page < pages ? (
          <Link className="rounded-md border border-[var(--border)] px-3 py-1.5 hover:bg-[var(--brand-cream)]" href={href(page + 1)}>Next</Link>
        ) : (
          <span aria-disabled="true" className="rounded-md border border-[var(--border)] px-3 py-1.5 text-[var(--muted)] opacity-50">Next</span>
        )}
      </div>
    </nav>
  );
}
