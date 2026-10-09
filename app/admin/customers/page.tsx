import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
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
    customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { _count: { select: { orders: true } } },
    });

    // Guest customers from orders without userId
    const guests = await prisma.order.groupBy({
      by: ["customerEmail", "customerName"],
      where: { userId: null },
      _count: true,
      _sum: { total: true },
      orderBy: { _count: { customerEmail: "desc" } },
      take: 50,
    });
    guestSpend = guests.map((g) => ({
      email: g.customerEmail,
      name: g.customerName,
      orders: g._count,
      total: Number(g._sum.total ?? 0),
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
