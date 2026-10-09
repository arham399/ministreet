import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Users & Roles | Admin" };

export default async function AdminUsersPage() {
  let users: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
  }[] = [];
  try {
    users = await prisma.user.findMany({
      where: { role: { not: "CUSTOMER" } },
      orderBy: { createdAt: "desc" },
    });
  } catch { /* */ }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Users & Roles</h1>
        <Button asChild size="sm"><Link href="/admin/users/new">+ Add staff</Link></Button>
      </div>
      <p className="text-xs text-[var(--muted)] mb-4">
        Roles: OWNER (full) · ADMIN · ORDER_MANAGER · INVENTORY_MANAGER · SUPPORT
      </p>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 font-medium">{u.name || "—"}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--brand-blush)] text-[var(--brand-pink-deep)]">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">{u.isActive ? "Active" : "Disabled"}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
