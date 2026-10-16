import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, count, eq, gt, isNull, lte, or } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { offer } from "@/lib/db/drizzle/schema";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Offers | Mini Street",
  description: "Explore current promotions and special offers from Mini Street.",
};

export const revalidate = 60;
const PAGE_SIZE = 12;

export default async function OffersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  let offers: (typeof offer.$inferSelect)[] = [];
  let total = 0;
  let failedToLoad = false;
  try {
    const { db } = getDrizzleClient();
    const now = new Date();
    const activeFilter = and(
      eq(offer.isActive, true),
      or(isNull(offer.startsAt), lte(offer.startsAt, now)),
      or(isNull(offer.endsAt), gt(offer.endsAt, now)),
    );
    const [countRows, offerRows] = await Promise.all([
      db.select({ value: count() }).from(offer).where(activeFilter),
      db.select().from(offer).where(activeFilter)
        .orderBy(asc(offer.displayOrder), asc(offer.createdAt))
        .limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    ]);
    total = countRows[0]?.value ?? 0;
    offers = offerRows;
  } catch (error) {
    failedToLoad = true;
    console.error("[offers page] Failed to load current offers.", error);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (!failedToLoad && page > totalPages) redirect(pageHref(totalPages));
  const firstOffer = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastOffer = Math.min(page * PAGE_SIZE, total);

  return (
    <main className="min-h-[50vh] bg-[var(--background)]">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className={`mx-auto max-w-2xl text-center ${offers.length === 0 || failedToLoad ? "mb-5 sm:mb-6" : "mb-10 sm:mb-12"}`}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">A little something special</p>
          <h1 className="font-display text-4xl font-medium tracking-tight text-[var(--foreground)] sm:text-5xl">Current offers</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">Discover the latest ways to find something lovely at Mini Street.</p>
        </div>

        {failedToLoad ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-[var(--border)] bg-white p-8 text-center shadow-soft">
            <h2 className="font-display text-2xl text-[var(--foreground)]">Offers are unavailable right now</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Please try again in a little while, or browse the full collection.</p>
            <Button asChild className="mt-6"><Link href="/shop">Shop the collection</Link></Button>
          </div>
        ) : offers.length === 0 ? (
          <div className="mx-auto max-w-xl py-4 text-center sm:py-6">
            <h2 className="font-display text-2xl text-[var(--foreground)]">A new offer is on its way</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">There are no active promotions at the moment. Explore our collection and find your next favorite.</p>
            <Button asChild className="mt-6"><Link href="/shop">Shop the collection</Link></Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {offers.map((item) => {
              const imageUrl = safeOfferUrl(item.imageUrl);
              const linkUrl = safeOfferUrl(item.linkUrl) ?? "/shop";
              const external = linkUrl.startsWith("https://");
              return (
                <article key={item.id} className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-soft transition-shadow hover:shadow-md">
                  {imageUrl && (
                    <div className="relative aspect-[16/7] overflow-hidden bg-pink-50">
                      <Image src={imageUrl} alt={item.title} fill loading="lazy" sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px" className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" unoptimized />
                    </div>
                  )}
                  <div className="p-5 sm:p-6">
                    <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">{item.title}</h2>
                    {item.description && <p className="mt-1.5 whitespace-pre-line text-sm leading-5 text-[var(--muted)]">{item.description}</p>}
                    <div className="pt-4">
                      {external ? (
                        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90">Explore offer <span className="ml-2" aria-hidden="true">↗</span></a>
                      ) : (
                        <Button asChild className="rounded-full"><Link href={linkUrl}>Explore offer <span className="ml-2" aria-hidden="true">→</span></Link></Button>
                      )}
                    </div>
                  </div>
                </article>
              );
              })}
            </div>
            {totalPages > 1 && (
            <nav aria-label="Offer pages" className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
              <p className="text-sm text-[var(--muted)]">Showing {firstOffer}–{lastOffer} of {total} {total === 1 ? "offer" : "offers"}</p>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link href={pageHref(page - 1)} className="inline-flex h-10 items-center rounded-[var(--radius-sm)] border border-[var(--border)] px-4 text-sm font-medium hover:border-[var(--brand-pink)] hover:text-[var(--brand-pink)]">Previous</Link>
                ) : <span className="inline-flex h-10 items-center rounded-[var(--radius-sm)] border border-[var(--border)] px-4 text-sm text-[var(--muted)] opacity-50">Previous</span>}
                <span className="px-2 text-sm text-[var(--muted)]">Page {page} of {totalPages}</span>
                {page < totalPages ? (
                  <Link href={pageHref(page + 1)} className="inline-flex h-10 items-center rounded-[var(--radius-sm)] border border-[var(--border)] px-4 text-sm font-medium hover:border-[var(--brand-pink)] hover:text-[var(--brand-pink)]">Next</Link>
                ) : <span className="inline-flex h-10 items-center rounded-[var(--radius-sm)] border border-[var(--border)] px-4 text-sm text-[var(--muted)] opacity-50">Next</span>}
              </div>
            </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function pageHref(page: number) {
  return page <= 1 ? "/offers" : `/offers?page=${page}`;
}

function safeOfferUrl(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
