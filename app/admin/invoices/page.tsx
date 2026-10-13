import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { invoice, order } from "@/lib/db/drizzle/schema";
import { formatPrice } from "@/lib/utils";
import { TablePagination } from "@/components/admin/table-pagination";

export const metadata = { title: "Invoices | Admin" };

const PAGE_SIZE = 25;

export default async function AdminInvoicesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  let total = 0;
  let invoices: {
    id: string;
    invoiceNumber: string;
    issuedAt: Date;
    order: { id: string; orderNumber: string; customerName: string; total: unknown };
  }[] = [];
  try {
    const { db } = getDrizzleClient();
    const [totalRows, rows] = await Promise.all([
      db.select({ value: count() }).from(invoice),
      db.select({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      order: { id: order.id, orderNumber: order.orderNumber, customerName: order.customerName, total: order.total },
      }).from(invoice).innerJoin(order, eq(invoice.orderId, order.id))
        .orderBy(desc(invoice.issuedAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    ]);
    total = totalRows[0]?.value ?? 0;
    invoices = rows;
  } catch { /* */ }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Invoices</h1>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto">
        <table className="admin-data-table w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">No invoices yet</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-[var(--border)] last:border-0">
                  <td data-label="Invoice" className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                  <td data-label="Order" className="px-4 py-3">{inv.order.orderNumber}</td>
                  <td data-label="Customer" className="px-4 py-3">{inv.order.customerName}</td>
                  <td data-label="Total" className="px-4 py-3">{formatPrice(Number(inv.order.total))}</td>
                  <td data-label="Date" className="px-4 py-3 text-[var(--muted)]">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                  <td data-label="Actions" className="px-4 py-3 space-x-2">
                    <Link href={`/api/invoices/${inv.order.id}`} className="text-[var(--brand-pink)] text-xs hover:underline" target="_blank">
                      View
                    </Link>
                    <Link href={`/api/invoices/${inv.order.id}?format=pdf`} className="text-[var(--brand-pink)] text-xs hover:underline">
                      PDF
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <TablePagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/invoices" />
      </div>
    </div>
  );
}
