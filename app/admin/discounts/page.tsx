import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Discounts | Admin" };

type DiscountWithTargets = Prisma.DiscountGetPayload<{
  include: {
    products: { include: { product: { select: { name: true } } } };
    categories: { select: { name: true } };
  };
}>;

export default async function AdminDiscountsPage() {
  let discounts: DiscountWithTargets[] = [];
  try {
    discounts = await prisma.discount.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        products: { include: { product: { select: { name: true } } } },
        categories: { select: { name: true } },
      },
    });
  } catch { /* */ }
  const now = new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Discounts</h1>
        <Button asChild size="sm"><Link href="/admin/discounts/new">+ Add discount</Link></Button>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Applies to</th>
              <th className="px-4 py-3">Offer</th>
              <th className="px-4 py-3">Uses</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {discounts.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--muted)]">No discounts</td></tr>
            ) : (
              discounts.map((d) => (
                <tr key={d.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="max-w-xs px-4 py-3">
                    <span className="block text-xs text-[var(--muted)]">
                      {d.scope === "STOREWIDE" ? "All products" : d.scope === "CATEGORY" ? "Categories" : "Selected products"}
                    </span>
                    {d.scope === "CATEGORY"
                      ? d.categories.map((category) => category.name).join(", ") || "No categories selected"
                      : d.scope === "PRODUCT"
                        ? d.products.map((entry) => entry.product.name).join(", ") || "No products selected"
                        : "Store-wide"}
                  </td>
                  <td className="px-4 py-3">
                    {d.type === "PERCENTAGE" ? `${d.value}%` : `Rs. ${d.value}`}
                  </td>
                  <td className="px-4 py-3">
                    {d.usageCount}{d.usageLimit != null ? ` / ${d.usageLimit}` : " / unlimited"}
                  </td>
                  <td className="px-4 py-3">
                    {!d.isActive
                      ? "Paused"
                      : d.startsAt && d.startsAt > now
                        ? "Scheduled"
                        : d.endsAt && d.endsAt < now
                          ? "Expired"
                          : d.usageLimit != null && d.usageCount >= d.usageLimit
                            ? "Limit reached"
                            : "Active"}
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
