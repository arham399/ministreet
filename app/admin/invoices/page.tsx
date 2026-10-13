import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { invoice, order } from "@/lib/db/drizzle/schema";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Invoices | Admin" };

export default async function AdminInvoicesPage() {
  let invoices: {
    id: string;
    invoiceNumber: string;
    issuedAt: Date;
    order: { id: string; orderNumber: string; customerName: string; total: unknown };
  }[] = [];
  try {
    const { db } = getDrizzleClient();
    invoices = await db.select({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      order: { id: order.id, orderNumber: order.orderNumber, customerName: order.customerName, total: order.total },
    }).from(invoice).innerJoin(order, eq(invoice.orderId, order.id))
      .orderBy(desc(invoice.issuedAt)).limit(50);
  } catch { /* */ }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Invoices</h1>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto">
        <table className="w-full text-sm">
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
                  <td className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">{inv.order.orderNumber}</td>
                  <td className="px-4 py-3">{inv.order.customerName}</td>
                  <td className="px-4 py-3">{formatPrice(Number(inv.order.total))}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 space-x-2">
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
      </div>
    </div>
  );
}
