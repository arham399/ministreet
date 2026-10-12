import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { CouponActions } from "@/components/admin/coupon-actions";
import { CouponStatus, type CouponStatusValue } from "@/components/admin/coupon-status";

export const metadata = { title: "Coupons | Admin" };

export default async function AdminCouponsPage() {
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
  try {
    coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  } catch { /* */ }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Coupons</h1>
        <Button asChild size="sm">
          <Link href="/admin/coupons/new">+ Add coupon</Link>
        </Button>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto shadow-soft">
        <table className="w-full text-sm">
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
                  <td className="px-4 py-3 font-mono font-bold tracking-wide text-[var(--brand-pink)]">{c.code}</td>
                  <td className="px-4 py-3">{c.type}</td>
                  <td className="px-4 py-3">
                    {c.type === "PERCENTAGE" ? `${c.value}%` : `Rs. ${c.value}`}
                  </td>
                  <td className="px-4 py-3">
                    {c.usageCount}{c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--muted)]">
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
                  <td className="px-4 py-3">
                    <CouponStatus
                      isActive={c.isActive}
                      startsAt={c.startsAt?.toISOString() ?? null}
                      endsAt={c.endsAt?.toISOString() ?? null}
                      usageCount={c.usageCount}
                      usageLimit={c.usageLimit}
                      initialStatus={getCouponStatus(c)}
                    />
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {c.endsAt ? new Date(c.endsAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <CouponActions id={c.id} code={c.code} isActive={c.isActive} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
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
