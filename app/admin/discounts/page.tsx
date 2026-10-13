import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { category, categoryToDiscount, discount, discountProduct, product } from "@/lib/db/drizzle/schema";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Discounts | Admin" };

type DiscountWithTargets = typeof discount.$inferSelect & {
  products: { product: { name: string } }[];
  categories: { name: string }[];
};

export default async function AdminDiscountsPage() {
  let discounts: DiscountWithTargets[] = [];
  try {
    const { db } = getDrizzleClient();
    const rows = await db.select().from(discount).orderBy(desc(discount.createdAt));
    const ids = rows.map((row) => row.id);
    const [productRows, categoryRows] = ids.length ? await Promise.all([
      db.select({ discountId: discountProduct.discountId, name: product.name })
        .from(discountProduct).innerJoin(product, eq(discountProduct.productId, product.id))
        .where(inArray(discountProduct.discountId, ids)),
      db.select({ discountId: categoryToDiscount.b, name: category.name })
        .from(categoryToDiscount).innerJoin(category, eq(categoryToDiscount.a, category.id))
        .where(inArray(categoryToDiscount.b, ids)),
    ]) : [[], []];
    discounts = rows.map((row) => ({
      ...row,
      products: productRows.filter((entry) => entry.discountId === row.id)
        .map((entry) => ({ product: { name: entry.name } })),
      categories: categoryRows.filter((entry) => entry.discountId === row.id)
        .map((entry) => ({ name: entry.name })),
    }));
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
