import { count, desc, eq } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { product, review } from "@/lib/db/drizzle/schema";
import { ReviewActions } from "@/components/admin/review-actions";
import { TablePagination } from "@/components/admin/table-pagination";

export const metadata = { title: "Reviews | Admin" };

const PAGE_SIZE = 25;

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  let total = 0;
  let reviews: {
    id: string;
    authorName: string;
    rating: number;
    title: string | null;
    body: string | null;
    status: string;
    product: { name: string } | null;
  }[] = [];
  try {
    const { db } = getDrizzleClient();
    const [totalRows, rows] = await Promise.all([
      db.select({ value: count() }).from(review),
      db.select({
      id: review.id,
      authorName: review.authorName,
      rating: review.rating,
      title: review.title,
      body: review.body,
      status: review.status,
      product: { name: product.name },
      }).from(review).leftJoin(product, eq(review.productId, product.id))
        .orderBy(desc(review.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    ]);
    total = totalRows[0]?.value ?? 0;
    reviews = rows;
  } catch { /* */ }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Reviews</h1>
      {reviews.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No reviews yet.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-white">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{r.authorName} · {"★".repeat(r.rating)}</p>
                  <p className="text-xs text-[var(--muted)]">{r.product?.name}</p>
                  {r.title && <p className="text-sm mt-1">{r.title}</p>}
                  {r.body && <p className="text-sm text-[var(--muted)]">{r.body}</p>}
                  <p className="text-xs mt-1">Status: {r.status}</p>
                </div>
                <ReviewActions id={r.id} status={r.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-white">
        <TablePagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/reviews" />
      </div>
    </div>
  );
}
