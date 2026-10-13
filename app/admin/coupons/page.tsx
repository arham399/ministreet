import Link from "next/link";
import { count, desc, ilike } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { coupon } from "@/lib/db/drizzle/schema";
import { Button } from "@/components/ui/button";
import { CouponActions } from "@/components/admin/coupon-actions";
import { CouponStatus, type CouponStatusValue } from "@/components/admin/coupon-status";
import { TablePagination } from "@/components/admin/table-pagination";

export const metadata = { title: "Coupons | Admin" };
const PAGE_SIZE = 25;

export default async function AdminCouponsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const filter = query ? ilike(coupon.code, `%${query}%`) : undefined;
  let coupons: {
    id: string;
    code: string;
    type: string;
    value: unknown;
    usageCount: number;
    usageLimit: number | null;
    perCustomerLimit: number | null;
    eligibleProductIds: unknown;
    eligibleCategoryIds: unknown;
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
  }[] = [];
  let total = 0;
  try {
    const { db } = getDrizzleClient();
    const [totalRows, rows] = await Promise.all([
      db.select({ value: count() }).from(coupon).where(filter),
      db.select().from(coupon).where(filter).orderBy(desc(coupon.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    ]);
    total = totalRows[0]?.value ?? 0;
    coupons = rows;
  } catch { /* */ }

  return (
    <div>
      <div className="admin-page-heading mb-6">
        <div><p className="admin-eyebrow">Promotions</p><h1 className="text-xl font-semibold">Coupons</h1></div>
        <Button asChild size="sm">
          <Link href="/admin/coupons/new">+ Add coupon</Link>
        </Button>
      </div>
      <form action="/admin/coupons" className="admin-search-form mb-4 flex max-w-lg gap-2">
        <input name="q" defaultValue={query} placeholder="Search coupon code" className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
        <Button type="submit" size="sm" variant="outline">Search</Button>
        {query && <Button asChild size="sm" variant="ghost"><Link href="/admin/coupons">Clear</Link></Button>}
      </form>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto shadow-soft">
        <table className="admin-data-table w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Restrictions</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--muted)]">
                  No coupons yet. <Link href="/admin/coupons/new" className="text-[var(--brand-pink)]">Create one</Link>
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
                  <td data-label="Code" className="px-4 py-3 font-mono font-bold tracking-wide text-[var(--brand-pink)]">{c.code}</td>
                  <td data-label="Type" className="px-4 py-3">{c.type}</td>
                  <td data-label="Value" className="px-4 py-3">
                    {c.type === "PERCENTAGE"
                      ? `${formatCouponValue(c.value)}%`
                      : `Rs. ${formatCouponValue(c.value)}`}
                  </td>
                  <td data-label="Usage" className="px-4 py-3">
                    {c.usageCount}{c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td data-label="Restrictions" className="px-4 py-3 text-xs text-[var(--muted)]">
                    {[
                      c.perCustomerLimit != null ? `${c.perCustomerLimit} per customer` : null,
                      Array.isArray(c.eligibleProductIds) && c.eligibleProductIds.length
                        ? `${c.eligibleProductIds.length} product${c.eligibleProductIds.length === 1 ? "" : "s"}`
                        : null,
                      Array.isArray(c.eligibleCategoryIds) && c.eligibleCategoryIds.length
                        ? `${c.eligibleCategoryIds.length} categor${c.eligibleCategoryIds.length === 1 ? "y" : "ies"}`
                        : null,
                    ].filter(Boolean).join(" · ") || "All products"}
                  </td>
                  <td data-label="Status" className="px-4 py-3">
                    <CouponStatus
                      isActive={c.isActive}
                      startsAt={c.startsAt?.toISOString() ?? null}
                      endsAt={c.endsAt?.toISOString() ?? null}
                      usageCount={c.usageCount}
                      usageLimit={c.usageLimit}
                      initialStatus={getCouponStatus(c)}
                    />
                  </td>
                  <td data-label="Expires" className="px-4 py-3 text-[var(--muted)]">
                    {c.endsAt ? new Date(c.endsAt).toLocaleDateString() : "—"}
                  </td>
                  <td data-label="Actions" className="px-4 py-3">
                    <CouponActions id={c.id} code={c.code} isActive={c.isActive} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <TablePagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/coupons" query={query} />
      </div>
    </div>
  );
}

function formatCouponValue(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return amount.toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  });
}

function getCouponStatus(coupon: {
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  usageCount: number;
  usageLimit: number | null;
}): CouponStatusValue {
  if (!coupon.isActive) return "Inactive";
  const now = new Date();
  if (coupon.endsAt && coupon.endsAt < now) return "Expired";
  if (coupon.startsAt && coupon.startsAt > now) return "Scheduled";
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) return "Limit reached";
  return "Active";
}
