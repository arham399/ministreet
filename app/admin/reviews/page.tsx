import { prisma } from "@/lib/db/prisma";
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
    reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { product: { select: { name: true } } },
    });
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
