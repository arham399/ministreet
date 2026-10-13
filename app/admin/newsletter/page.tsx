import { notFound } from "next/navigation";
import { NewsletterCampaignForm } from "@/components/admin/newsletter-campaign-form";
import { NewsletterSubscriberStatus } from "@/components/admin/newsletter-subscriber-status";
import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import { count, desc, eq, ilike } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { newsletterSubscriber } from "@/lib/db/drizzle/schema";
import { TablePagination } from "@/components/admin/table-pagination";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Newsletter | Admin" };
const PAGE_SIZE = 25;

export default async function AdminNewsletterPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const filter = query ? ilike(newsletterSubscriber.email, `%${query}%`) : undefined;
  const session = await auth();
  if (!session?.user || !can(session.user.role, "newsletter:manage")) {
    notFound();
  }

  const { db } = getDrizzleClient();
  const [totalRows, activeRows, subscribers] = await Promise.all([
    db.select({ value: count() }).from(newsletterSubscriber).where(filter),
    db.select({ value: count() }).from(newsletterSubscriber).where(eq(newsletterSubscriber.isActive, true)),
    db.select({ id: newsletterSubscriber.id, email: newsletterSubscriber.email, isActive: newsletterSubscriber.isActive, createdAt: newsletterSubscriber.createdAt })
      .from(newsletterSubscriber).where(filter).orderBy(desc(newsletterSubscriber.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
  ]);
  const total = totalRows[0]?.value ?? 0;
  const activeCount = activeRows[0]?.value ?? 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Newsletter subscribers</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {activeCount} active subscribers · {total} matching this search
          </p>
        </div>
      </div>
      <section className="mb-8 rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 shadow-soft sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Send a newsletter</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Share new products, special offers, and store news with active subscribers. Each email is sent individually.
          </p>
        </div>
        <NewsletterCampaignForm activeCount={activeCount} />
      </section>
      <div className="admin-page-heading mb-3"><h2 className="text-sm font-semibold">Subscribers</h2></div>
      <form action="/admin/newsletter" className="admin-search-form mb-4 flex max-w-lg gap-2">
        <input name="q" defaultValue={query} placeholder="Search subscriber email" className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
        <Button type="submit" size="sm" variant="outline">Search</Button>
        {query && <Button asChild size="sm" variant="ghost"><Link href="/admin/newsletter">Clear</Link></Button>}
      </form>
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-white">
        <table className="admin-data-table w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status / action</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-[var(--muted)]">
                  No newsletter subscribers yet.
                </td>
              </tr>
            ) : (
              subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="border-b border-[var(--border)] last:border-0">
                  <td data-label="Email" className="px-4 py-3">{subscriber.email}</td>
                  <td data-label="Joined" className="px-4 py-3 text-[var(--muted)]">
                    {new Date(subscriber.createdAt).toLocaleDateString()}
                  </td>
                  <td data-label="Status & action" className="px-4 py-3">
                    <NewsletterSubscriberStatus
                      id={subscriber.id}
                      isActive={subscriber.isActive}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <TablePagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/newsletter" query={query} />
      </div>
    </div>
  );
}
