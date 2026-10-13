import Link from "next/link";
import { and, asc, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { product } from "@/lib/db/drizzle/schema";
import { TablePagination } from "@/components/admin/table-pagination";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Inventory | Admin" };
const PAGE_SIZE = 25;

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const baseFilter = and(isNull(product.archivedAt), eq(product.trackInventory, true));
  const filter = and(baseFilter, query ? or(ilike(product.name, `%${query}%`), ilike(product.sku, `%${query}%`)) : undefined);
  let products: { id: string; name: string; sku: string; stockQuantity: number; reservedStock: number; lowStockThreshold: number }[] = [];
  let total = 0;
  let totalStock = 0;
  let low = 0;
  let out = 0;
  try {
    const { db } = getDrizzleClient();
    const [statsRows, totalRows, rows] = await Promise.all([
      db.select({
        totalStock: sql<number>`COALESCE(SUM(${product.stockQuantity}), 0)`,
        lowCount: sql<number>`COUNT(*) FILTER (WHERE ${product.stockQuantity} <= ${product.lowStockThreshold})`,
        outCount: sql<number>`COUNT(*) FILTER (WHERE ${product.stockQuantity} <= 0)`,
      }).from(product).where(baseFilter),
      db.select({ value: count() }).from(product).where(filter),
      db.select({ id: product.id, name: product.name, sku: product.sku, stockQuantity: product.stockQuantity, reservedStock: product.reservedStock, lowStockThreshold: product.lowStockThreshold })
        .from(product).where(filter).orderBy(asc(product.stockQuantity), asc(product.name)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    ]);
    totalStock = Number(statsRows[0]?.totalStock ?? 0);
    low = Number(statsRows[0]?.lowCount ?? 0);
    out = Number(statsRows[0]?.outCount ?? 0);
    total = totalRows[0]?.value ?? 0;
    products = rows;
  } catch { /* */ }

  return (
    <div>
      <div className="admin-page-heading mb-5"><div><p className="admin-eyebrow">Stock control</p><h1 className="text-xl font-semibold">Inventory</h1></div></div>
      <div className="admin-stat-grid mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[{ label: "Total units", value: totalStock }, { label: "Low stock", value: low }, { label: "Out of stock", value: out }].map((stat) => <div key={stat.label} className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-soft"><p className="text-xs text-[var(--muted)]">{stat.label}</p><p className="mt-1 text-xl font-semibold">{stat.value}</p></div>)}
      </div>
      <form action="/admin/inventory" className="admin-search-form mb-4 flex max-w-lg gap-2">
        <input name="q" defaultValue={query} placeholder="Search product name or SKU" className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
        <Button type="submit" size="sm" variant="outline">Search</Button>
        {query && <Button asChild size="sm" variant="ghost"><Link href="/admin/inventory">Clear</Link></Button>}
      </form>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-soft">
        <table className="admin-data-table w-full min-w-[700px] text-sm">
          <thead><tr className="border-b border-[var(--border)] text-left text-[var(--muted)]"><th className="px-4 py-3 font-medium">Product</th><th className="px-4 py-3 font-medium">SKU</th><th className="px-4 py-3 font-medium">Stock</th><th className="px-4 py-3 font-medium">Available</th><th className="px-4 py-3 font-medium">Status</th></tr></thead>
          <tbody>{products.length ? products.map((item) => {
            const available = item.stockQuantity - item.reservedStock;
            const status = item.stockQuantity <= 0 ? "Out" : item.stockQuantity <= item.lowStockThreshold ? "Low" : "OK";
            return <tr key={item.id} className="border-b border-[var(--border)] last:border-0"><td data-label="Product" className="px-4 py-3 font-medium">{item.name}</td><td data-label="SKU" className="px-4 py-3 text-[var(--muted)]">{item.sku}</td><td data-label="Stock" className="px-4 py-3">{item.stockQuantity}</td><td data-label="Available" className="px-4 py-3">{available}</td><td data-label="Status" className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${status === "Out" ? "bg-red-50 text-red-700" : status === "Low" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>{status}</span></td></tr>;
          }) : <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--muted)]">No inventory items found.</td></tr>}</tbody>
        </table>
        <TablePagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/inventory" query={query} />
      </div>
    </div>
  );
}
