import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Discounts | Admin" };

export default async function AdminDiscountsPage() {
  let discounts: { id: string; name: string; type: string; value: unknown; scope: string; isActive: boolean }[] = [];
  try {
    discounts = await prisma.discount.findMany({ orderBy: { createdAt: "desc" } });
  } catch { /* */ }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Discounts</h1>
        <Button asChild size="sm"><Link href="/admin/discounts/new">+ Add discount</Link></Button>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {discounts.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--muted)]">No discounts</td></tr>
            ) : (
              discounts.map((d) => (
                <tr key={d.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3">{d.scope}</td>
                  <td className="px-4 py-3">{d.type}</td>
                  <td className="px-4 py-3">{d.type === "PERCENTAGE" ? `${d.value}%` : `Rs. ${d.value}`}</td>
                  <td className="px-4 py-3">{d.isActive ? "Active" : "Inactive"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
