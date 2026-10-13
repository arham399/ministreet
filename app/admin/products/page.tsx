import Link from "next/link";
import { count, desc, ilike, or } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { product } from "@/lib/db/drizzle/schema";
import { ProductArchiveButton } from "@/components/admin/product-archive-button";
import { ProductPermanentDeleteButton } from "@/components/admin/product-permanent-delete-button";
import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import { TablePagination } from "@/components/admin/table-pagination";

export const metadata = { title: "Products | Admin" };

const PAGE_SIZE = 25;

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const filter = query ? or(ilike(product.name, `%${query}%`), ilike(product.sku, `%${query}%`)) : undefined;
  const session = await auth();
  const mayExport = can(session?.user?.role, "analytics:read");
  const mayManage = can(session?.user?.role, "products:write");
  let products: (typeof product.$inferSelect)[] = [];
  let total = 0;
  try {
    const { db } = getDrizzleClient();
    const [totalRows, rows] = await Promise.all([
      db.select({ value: count() }).from(product).where(filter),
      db.select().from(product).where(filter)
      .orderBy(desc(product.createdAt))
      .limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    ]);
    total = totalRows[0]?.value ?? 0;
    products = rows;
  } catch { /* */ }

  return (
    <div>
      <div className="mb-6 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-xl font-semibold">Products</h1>
        <div className="admin-product-toolbar grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          {mayManage && <Button asChild size="sm" className="col-span-2 order-first sm:order-last"><Link href="/admin/products/new">+ Add Product</Link></Button>}
          {mayExport && <>
            <Button asChild size="sm" variant="outline" className="min-w-0"><a href="/api/admin/exports?dataset=products&format=xls">Export XLS</a></Button>
            <Button asChild size="sm" variant="outline" className="min-w-0"><a href="/api/admin/exports?dataset=products&format=pdf">Export PDF</a></Button>
          </>}
        </div>
      </div>
      <form action="/admin/products" className="admin-search-form mb-4 flex w-full max-w-lg flex-col gap-2 sm:flex-row">
        <input name="q" defaultValue={query} placeholder="Search product name or SKU" className="h-10 min-w-0 w-full flex-1 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm" />
        <Button type="submit" size="sm" variant="outline">Search</Button>
        {query && <Button asChild size="sm" variant="ghost"><Link href="/admin/products">Clear</Link></Button>}
      </form>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto shadow-soft">
        <table className="admin-data-table admin-products-table w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">
                  No products. <Link href="/admin/products/new" className="text-[var(--brand-pink)]">Add one</Link>
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--brand-cream)]">
                  <td data-label="Product" className="px-4 py-3 font-medium">{p.name}</td>
                  <td data-label="SKU" className="px-4 py-3 text-[var(--muted)]">{p.sku}</td>
                  <td data-label="Price" className="px-4 py-3">
                    {formatPrice(Number(p.salePrice ?? p.price))}
                    {p.salePrice != null && (
                      <span className="text-xs text-[var(--muted)] line-through ml-1">
                        {formatPrice(Number(p.price))}
                      </span>
                    )}
                  </td>
                  <td data-label="Stock" className="px-4 py-3">{p.stockQuantity}</td>
                  <td data-label="Status" className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${p.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {p.archivedAt ? "Archived" : p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td data-label="Actions" className="min-w-[230px] px-4 py-3">
                    <div className="admin-row-actions flex flex-wrap items-center gap-2">
                    <Link href={`/admin/products/${p.id}`} className="text-[var(--brand-pink)] hover:underline text-xs">
                      Edit
                    </Link>
                    {mayManage && !p.archivedAt && <ProductArchiveButton id={p.id} name={p.name} />}
                    {mayManage && <ProductPermanentDeleteButton id={p.id} name={p.name} />}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <TablePagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/products" query={query} />
      </div>
    </div>
  );
}
