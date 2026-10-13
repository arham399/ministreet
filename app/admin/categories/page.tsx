import { asc, count, eq, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { category, product } from "@/lib/db/drizzle/schema";
import { CategoryDeleteButton } from "@/components/admin/category-delete-button";
import { TablePagination } from "@/components/admin/table-pagination";
import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Categories | Admin" };
const PAGE_SIZE = 25;

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const filter = query ? or(ilike(category.name, `%${query}%`), ilike(category.slug, `%${query}%`)) : undefined;
  const session = await auth();
  const mayDelete = can(session?.user?.role, "products:write");
  let categories: { id: string; name: string; slug: string; displayOrder: number; productCount: number }[] = [];
  let total = 0;
  try {
    const { db } = getDrizzleClient();
    const [totalRows, rows] = await Promise.all([
      db.select({ value: count() }).from(category).where(filter),
      db.select({ id: category.id, name: category.name, slug: category.slug, displayOrder: category.displayOrder, productCount: count(product.id) })
        .from(category).leftJoin(product, eq(product.categoryId, category.id)).where(filter)
        .groupBy(category.id).orderBy(asc(category.displayOrder), asc(category.name)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    ]);
    total = totalRows[0]?.value ?? 0;
    categories = rows;
  } catch { /* Keep the admin page renderable if the database is unavailable. */ }

  return (
    <div>
      <div className="admin-page-heading mb-2"><div><p className="admin-eyebrow">Catalog management</p><h1 className="text-xl font-semibold">Categories</h1></div></div>
      <p className="mb-5 text-sm text-[var(--muted)]">Deleting a category leaves its products intact and removes their category assignment.</p>
      <form action="/admin/categories" className="admin-search-form mb-4 flex max-w-lg gap-2">
        <input name="q" defaultValue={query} placeholder="Search category name or slug" className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
        <Button type="submit" size="sm" variant="outline">Search</Button>
        {query && <Button asChild size="sm" variant="ghost"><Link href="/admin/categories">Clear</Link></Button>}
      </form>
      {categories.length === 0 ? <div className="rounded-2xl border border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--muted)]">No categories found.</div> : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-soft">
          <table className="admin-data-table w-full min-w-[700px] text-sm">
            <thead><tr className="border-b border-[var(--border)] text-left text-[var(--muted)]"><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Slug</th><th className="px-4 py-3 font-medium">Products</th><th className="px-4 py-3 font-medium">Order</th>{mayDelete && <th className="px-4 py-3 font-medium">Actions</th>}</tr></thead>
            <tbody>{categories.map((item) => <tr key={item.id} className="border-b border-[var(--border)] last:border-0"><td data-label="Category" className="px-4 py-3 font-medium">{item.name}</td><td data-label="Slug" className="px-4 py-3 text-[var(--muted)]">{item.slug}</td><td data-label="Products" className="px-4 py-3">{item.productCount}</td><td data-label="Display order" className="px-4 py-3">{item.displayOrder}</td>{mayDelete && <td data-label="Actions" className="px-4 py-3"><CategoryDeleteButton id={item.id} name={item.name} productCount={item.productCount} /></td>}</tr>)}</tbody>
          </table>
          <TablePagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/categories" query={query} />
        </div>
      )}
    </div>
  );
}
