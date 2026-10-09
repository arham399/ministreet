import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Orders | Admin" };

export default async function AdminOrdersPage() {
  let orders: {
    id: string;
    orderNumber: string;
    customerName: string;
    total: unknown;
    status: string;
    createdAt: Date;
  }[] = [];
  try {
    orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch { /* */ }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Orders</h1>
      {orders.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-8 text-center shadow-soft">
          <p className="text-[var(--muted)] text-sm">No orders yet.</p>
        </div>
      ) : (
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto shadow-soft">
          <table className="w-full text-sm">
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
                  <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                  <td className="px-4 py-3">{o.customerName}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{formatPrice(Number(o.total))}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-[var(--brand-blush)] text-[var(--brand-pink-deep)]">
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="text-[var(--brand-pink)] hover:underline text-xs">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
