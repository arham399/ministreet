import Link from "next/link";
import { asc, count, ilike } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { offer } from "@/lib/db/drizzle/schema";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/admin/table-pagination";

export const metadata = { title: "Offers | Admin" };
const PAGE_SIZE = 25;

export default async function AdminOffersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const filter = query ? ilike(offer.title, `%${query}%`) : undefined;
  let offers: { id: string; title: string; isActive: boolean; startsAt: Date | null; endsAt: Date | null }[] = [];
  let total = 0;
  try {
    const { db } = getDrizzleClient();
    const [totalRows, rows] = await Promise.all([
      db.select({ value: count() }).from(offer).where(filter),
      db.select().from(offer).where(filter).orderBy(asc(offer.displayOrder)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    ]);
    total = totalRows[0]?.value ?? 0;
    offers = rows;
  } catch { /* */ }

  return (
    <div>
      <div className="admin-page-heading mb-6">
        <div><p className="admin-eyebrow">Store merchandising</p><h1 className="text-xl font-semibold">Offers</h1></div>
        <Button asChild size="sm"><Link href="/admin/offers/new">+ Add offer</Link></Button>
      </div>
      <form action="/admin/offers" className="admin-search-form mb-4 flex max-w-lg gap-2">
        <input name="q" defaultValue={query} placeholder="Search offers" className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
        <Button type="submit" size="sm" variant="outline">Search</Button>
        {query && <Button asChild size="sm" variant="ghost"><Link href="/admin/offers">Clear</Link></Button>}
      </form>
      <ul className="space-y-3">
        {offers.length === 0 ? <li className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--muted)]">No offers found.</li> : offers.map((item) => (
          <li key={item.id} className="admin-card-row flex justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-soft">
            <div className="min-w-0"><p className="break-words text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.isActive ? "Active" : "Inactive"}{item.endsAt ? ` · ends ${new Date(item.endsAt).toLocaleDateString()}` : ""}</p></div>
            <span className={`h-fit rounded-full px-2.5 py-1 text-[11px] font-medium ${item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>{item.isActive ? "Live" : "Paused"}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white"><TablePagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/offers" query={query} /></div>
    </div>
  );
}
