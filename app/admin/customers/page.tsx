import Link from "next/link";
import { count, desc, eq, isNull, sql, sum } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { order, user } from "@/lib/db/drizzle/schema";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Customers | Admin" };

export default async function AdminCustomersPage() {
  type Row = {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    role: string;
    createdAt: Date;
    _count: { orders: number };
  };
  let customers: Row[] = [];
  let guestSpend: { email: string; name: string; orders: number; total: number }[] = [];

  try {
    const { db } = getDrizzleClient();
    const customerRows = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      orderCount: count(order.id),
    }).from(user).leftJoin(order, eq(user.id, order.userId))
      .where(eq(user.role, "CUSTOMER"))
      .groupBy(user.id)
      .orderBy(desc(user.createdAt))
      .limit(100);
    customers = customerRows.map(({ orderCount, ...customer }) => ({
      ...customer,
      _count: { orders: orderCount },
    }));

    // Guest customers from orders without userId
    const guests = await db.select({
      email: order.customerEmail,
      name: order.customerName,
      orders: count(),
      total: sum(order.total),
    }).from(order).where(isNull(order.userId))
      .groupBy(order.customerEmail, order.customerName)
      .orderBy(sql`count(${order.customerEmail}) desc`)
      .limit(50);
    guestSpend = guests.map((g) => ({
      email: g.email,
      name: g.name,
      orders: g.orders,
      total: Number(g.total ?? 0),
    }));
  } catch { /* */ }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Customers</h1>

      <h2 className="text-sm font-semibold mb-3">Registered accounts</h2>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-[var(--muted)]">No registered customers</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 font-medium">{c.name || "—"}</td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{c.phone || "—"}</td>
                  <td className="px-4 py-3">{c._count.orders}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-sm font-semibold mb-3">Guest checkout customers</h2>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total spent</th>
            </tr>
          </thead>
          <tbody>
            {guestSpend.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-[var(--muted)]">No guest orders yet</td></tr>
            ) : (
              guestSpend.map((g) => (
                <tr key={g.email} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 font-medium">{g.name}</td>
                  <td className="px-4 py-3">{g.email}</td>
                  <td className="px-4 py-3">{g.orders}</td>
                  <td className="px-4 py-3">{formatPrice(g.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
