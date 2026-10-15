import Link from "next/link";
import { count, desc, ilike, or } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { order } from "@/lib/db/drizzle/schema";
import { formatPrice } from "@/lib/utils";
import { TablePagination } from "@/components/admin/table-pagination";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 25;

export const metadata = { title: "Orders | Admin" };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const filter = query ? or(
    ilike(order.orderNumber, `%${query}%`),
    ilike(order.customerName, `%${query}%`),
    ilike(order.customerEmail, `%${query}%`),
  ) : undefined;
  let total = 0;
  let orders: {
    id: string;
    orderNumber: string;
    customerName: string;
    total: unknown;
    status: string;
    createdAt: Date;
  }[] = [];
  try {
    const { db } = getDrizzleClient();
    const [totalRows, rows] = await Promise.all([
      db.select({ value: count() }).from(order).where(filter),
      db.select({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      })
      .from(order).where(filter)
      .orderBy(desc(order.createdAt))
      .limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    ]);
    total = totalRows[0]?.value ?? 0;
    orders = rows;
  } catch { /* */ }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Orders</h1>
      <form action="/admin/orders" className="admin-search-form mb-4 flex max-w-lg gap-2">
        <input name="q" defaultValue={query} placeholder="Search order, customer, or email" className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm" />
        <Button type="submit" size="sm" variant="outline">Search</Button>
        {query && <Button asChild size="sm" variant="ghost"><Link href="/admin/orders">Clear</Link></Button>}
      </form>
      {orders.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-8 text-center shadow-soft">
          <p className="text-[var(--muted)] text-sm">No orders yet.</p>
        </div>
      ) : (
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto shadow-soft">
          <table className="admin-data-table admin-orders-table w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--brand-cream)]">
                  <td data-label="Order" className="px-4 py-3 font-medium">{o.orderNumber}</td>
                  <td data-label="Customer" className="px-4 py-3">{o.customerName}</td>
                  <td data-label="Date" className="px-4 py-3 text-[var(--muted)]">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td data-label="Total" className="px-4 py-3">{formatPrice(Number(o.total))}</td>
                  <td data-label="Status" className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-[var(--brand-blush)] text-[var(--brand-pink-deep)]">
                      {o.status}
                    </span>
                  </td>
                  <td data-label="Actions" className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="text-[var(--brand-pink)] hover:underline text-xs">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <TablePagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/orders" query={query} />
        </div>
      )}
    </div>
  );
}
