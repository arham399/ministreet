import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { offer } from "@/lib/db/drizzle/schema";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Offers | Admin" };

export default async function AdminOffersPage() {
  let offers: { id: string; title: string; isActive: boolean; startsAt: Date | null; endsAt: Date | null }[] = [];
  try {
    const { db } = getDrizzleClient();
    offers = await db.select().from(offer).orderBy(asc(offer.displayOrder));
  } catch { /* */ }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Offers</h1>
        <Button asChild size="sm"><Link href="/admin/offers/new">+ Add offer</Link></Button>
      </div>
      <ul className="space-y-3">
        {offers.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No offers yet.</p>
        ) : (
          offers.map((o) => (
            <li key={o.id} className="p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-white flex justify-between">
              <div>
                <p className="font-medium text-sm">{o.title}</p>
                <p className="text-xs text-[var(--muted)]">
                  {o.isActive ? "Active" : "Inactive"}
                  {o.endsAt ? ` · ends ${new Date(o.endsAt).toLocaleDateString()}` : ""}
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
