import Link from "next/link";
import { count, desc, ilike } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { offer } from "@/lib/db/drizzle/schema";
import { Button } from "@/components/ui/button";
import { OfferActions } from "@/components/admin/offer-actions";
import { TablePagination } from "@/components/admin/table-pagination";

export const metadata = { title: "Offers | Admin" };
const PAGE_SIZE = 25;

export default async function AdminOffersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const filter = query ? ilike(offer.title, `%${query}%`) : undefined;
  let offers: (typeof offer.$inferSelect)[] = [];
  let total = 0;
  try {
    const { db } = getDrizzleClient();
    const [totalRows, rows] = await Promise.all([
      db.select({ value: count() }).from(offer).where(filter),
      db.select().from(offer).where(filter).orderBy(desc(offer.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    ]);
    total = totalRows[0]?.value ?? 0;
    offers = rows;
  } catch (error) {
    console.error("[admin/offers] Failed to load offers.", error);
  }

  const now = new Date();
  return (
    <div>
      <div className="admin-page-heading mb-6">
        <div><p className="admin-eyebrow">Store merchandising</p><h1 className="text-xl font-semibold">Offers</h1><p className="mt-1 text-sm text-[var(--muted)]">Manage promotions displayed on your storefront.</p></div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline"><Link href="/offers" target="_blank">View storefront</Link></Button>
          <Button asChild size="sm"><Link href="/admin/offers/new">+ Add offer</Link></Button>
        </div>
      </div>
      <form action="/admin/offers" className="admin-search-form mb-4 flex max-w-lg gap-2">
        <input name="q" defaultValue={query} placeholder="Search offers" className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
        <Button type="submit" size="sm" variant="outline">Search</Button>
        {query && <Button asChild size="sm" variant="ghost"><Link href="/admin/offers">Clear</Link></Button>}
      </form>
      <ul className="space-y-3">
        {offers.length === 0 ? <li className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--muted)]">{query ? "No offers match your search." : "No offers yet. Create an offer to feature it on your storefront."}</li> : offers.map((item) => {
          const status = getOfferStatus(item, now);
          return (
            <li key={item.id} className="admin-card-row flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-words text-sm font-semibold">{item.title}</p>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClass(status)}`}>{status}</span>
                </div>
                {item.description && <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{item.description}</p>}
                <p className="mt-1.5 text-xs text-[var(--muted)]">{formatSchedule(item.startsAt, item.endsAt)}</p>
              </div>
              <OfferActions id={item.id} title={item.title} isActive={item.isActive} />
            </li>
          );
        })}
      </ul>
      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white"><TablePagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/offers" query={query} /></div>
    </div>
  );
}

type OfferStatus = "Live" | "Scheduled" | "Expired" | "Paused";

function getOfferStatus(item: { isActive: boolean; startsAt: Date | null; endsAt: Date | null }, now: Date): OfferStatus {
  if (!item.isActive) return "Paused";
  if (item.endsAt && item.endsAt <= now) return "Expired";
  if (item.startsAt && item.startsAt > now) return "Scheduled";
  return "Live";
}

function statusClass(status: OfferStatus) {
  switch (status) {
    case "Live": return "bg-emerald-50 text-emerald-700";
    case "Scheduled": return "bg-blue-50 text-blue-700";
    case "Expired": return "bg-stone-100 text-stone-600";
    case "Paused": return "bg-amber-50 text-amber-800";
  }
}

function formatSchedule(startsAt: Date | null, endsAt: Date | null) {
  const format = (value: Date) => new Intl.DateTimeFormat("en-PK", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi",
  }).format(value);
  if (startsAt && endsAt) return `${format(startsAt)} – ${format(endsAt)}`;
  if (startsAt) return `Starts ${format(startsAt)}`;
  if (endsAt) return `Ends ${format(endsAt)}`;
  return "No start or end date";
}
