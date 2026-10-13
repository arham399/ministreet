import Link from "next/link";
import { and, count, desc, ilike, ne, or, sql } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { user } from "@/lib/db/drizzle/schema";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/admin/table-pagination";

export const metadata = { title: "Users & Roles | Admin" };
const PAGE_SIZE = 25;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const filter = and(ne(user.role, "CUSTOMER"), query ? or(ilike(user.email, `%${query}%`), ilike(user.name, `%${query}%`), sql`${user.role}::text ILIKE ${`%${query}%`}`) : undefined);
  let users: { id: string; name: string | null; email: string; role: string; isActive: boolean; createdAt: Date }[] = [];
  let total = 0;
  try {
    const { db } = getDrizzleClient();
    const [totalRows, rows] = await Promise.all([
      db.select({ value: count() }).from(user).where(filter),
      db.select({ id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt })
        .from(user).where(filter).orderBy(desc(user.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    ]);
    total = totalRows[0]?.value ?? 0;
    users = rows;
  } catch { /* */ }

  return (
    <div>
      <div className="admin-page-heading mb-5">
        <div><p className="admin-eyebrow">Access management</p><h1 className="text-xl font-semibold">Users &amp; Roles</h1></div>
        <Button asChild size="sm"><Link href="/admin/users/new">+ Add staff</Link></Button>
      </div>
      <p className="mb-4 text-xs text-[var(--muted)]">Roles: OWNER · ADMIN · ORDER_MANAGER · INVENTORY_MANAGER · SUPPORT</p>
      <form action="/admin/users" className="admin-search-form mb-4 flex max-w-lg gap-2">
        <input name="q" defaultValue={query} placeholder="Search staff name, email, or role" className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
        <Button type="submit" size="sm" variant="outline">Search</Button>
        {query && <Button asChild size="sm" variant="ghost"><Link href="/admin/users">Clear</Link></Button>}
      </form>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-soft">
        <table className="admin-data-table w-full min-w-[720px] text-sm">
          <thead><tr className="border-b border-[var(--border)] text-left text-[var(--muted)]"><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Joined</th></tr></thead>
          <tbody>{users.length ? users.map((item) => <tr key={item.id} className="border-b border-[var(--border)] last:border-0"><td data-label="Name" className="px-4 py-3 font-medium">{item.name || "—"}</td><td data-label="Email" className="px-4 py-3">{item.email}</td><td data-label="Role" className="px-4 py-3"><span className="rounded-full bg-[var(--brand-blush)] px-2 py-1 text-xs text-[var(--brand-pink-deep)]">{item.role}</span></td><td data-label="Status" className="px-4 py-3">{item.isActive ? "Active" : "Disabled"}</td><td data-label="Joined" className="px-4 py-3 text-[var(--muted)]">{new Date(item.createdAt).toLocaleDateString()}</td></tr>) : <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--muted)]">No staff accounts found.</td></tr>}</tbody>
        </table>
        <TablePagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/users" query={query} />
      </div>
    </div>
  );
}
