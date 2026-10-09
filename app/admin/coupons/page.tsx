import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Coupons | Admin" };

export default async function AdminCouponsPage() {
  let coupons: {
    id: string;
    code: string;
    type: string;
    value: unknown;
    usageCount: number;
    usageLimit: number | null;
    isActive: boolean;
    endsAt: Date | null;
  }[] = [];
  try {
    coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  } catch { /* */ }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Coupons</h1>
        <Button asChild size="sm">
          <Link href="/admin/coupons/new">+ Add coupon</Link>
        </Button>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Expires</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">
                  No coupons yet. <Link href="/admin/coupons/new" className="text-[var(--brand-pink)]">Create one</Link>
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                  <td className="px-4 py-3">{c.type}</td>
                  <td className="px-4 py-3">
                    {c.type === "PERCENTAGE" ? `${c.value}%` : `Rs. ${c.value}`}
                  </td>
                  <td className="px-4 py-3">
                    {c.usageCount}{c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {c.endsAt ? new Date(c.endsAt).toLocaleDateString() : "—"}
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
