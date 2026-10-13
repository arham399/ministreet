import Link from "next/link";
import { count, desc, eq, ilike, inArray } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { category, categoryToDiscount, discount, discountProduct, product } from "@/lib/db/drizzle/schema";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/admin/table-pagination";

export const metadata = { title: "Discounts | Admin" };
const PAGE_SIZE = 25;

type DiscountWithTargets = typeof discount.$inferSelect & {
  products: { product: { name: string } }[];
  categories: { name: string }[];
};

export default async function AdminDiscountsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const filter = query ? ilike(discount.name, `%${query}%`) : undefined;
  let discounts: DiscountWithTargets[] = [];
  let total = 0;
  try {
    const { db } = getDrizzleClient();
    const [totalRows, rows] = await Promise.all([
      db.select({ value: count() }).from(discount).where(filter),
      db.select().from(discount).where(filter).orderBy(desc(discount.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    ]);
    total = totalRows[0]?.value ?? 0;
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
      <div className="admin-page-heading mb-6">
        <div><p className="admin-eyebrow">Promotions</p><h1 className="text-xl font-semibold">Discounts</h1></div>
        <Button asChild size="sm"><Link href="/admin/discounts/new">+ Add discount</Link></Button>
      </div>
      <form action="/admin/discounts" className="admin-search-form mb-4 flex max-w-lg gap-2">
        <input name="q" defaultValue={query} placeholder="Search discount name" className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
        <Button type="submit" size="sm" variant="outline">Search</Button>
        {query && <Button asChild size="sm" variant="ghost"><Link href="/admin/discounts">Clear</Link></Button>}
      </form>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto">
        <table className="admin-data-table w-full text-sm">
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
                  <td data-label="Discount" className="px-4 py-3 font-medium">{d.name}</td>
                  <td data-label="Applies to" className="max-w-xs px-4 py-3">
                    <span className="block text-xs text-[var(--muted)]">
                      {d.scope === "STOREWIDE" ? "All products" : d.scope === "CATEGORY" ? "Categories" : "Selected products"}
                    </span>
                    {d.scope === "CATEGORY"
                      ? d.categories.map((category) => category.name).join(", ") || "No categories selected"
                      : d.scope === "PRODUCT"
                        ? d.products.map((entry) => entry.product.name).join(", ") || "No products selected"
                        : "Store-wide"}
                  </td>
                  <td data-label="Offer" className="px-4 py-3">
                    {d.type === "PERCENTAGE" ? `${d.value}%` : `Rs. ${d.value}`}
                  </td>
                  <td data-label="Uses" className="px-4 py-3">
                    {d.usageCount}{d.usageLimit != null ? ` / ${d.usageLimit}` : " / unlimited"}
                  </td>
                  <td data-label="Status" className="px-4 py-3">
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
        <TablePagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/discounts" query={query} />
      </div>
    </div>
  );
}
