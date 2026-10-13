import { desc, eq } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { product, review } from "@/lib/db/drizzle/schema";
import { ReviewActions } from "@/components/admin/review-actions";

export const metadata = { title: "Reviews | Admin" };

export default async function AdminReviewsPage() {
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
    reviews = await db.select({
      id: review.id,
      authorName: review.authorName,
      rating: review.rating,
      title: review.title,
      body: review.body,
      status: review.status,
      product: { name: product.name },
    }).from(review).leftJoin(product, eq(review.productId, product.id))
      .orderBy(desc(review.createdAt)).limit(50);
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
    </div>
  );
}
