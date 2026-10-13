import { notFound } from "next/navigation";
import { NewsletterCampaignForm } from "@/components/admin/newsletter-campaign-form";
import { NewsletterSubscriberStatus } from "@/components/admin/newsletter-subscriber-status";
import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import { desc } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { newsletterSubscriber } from "@/lib/db/drizzle/schema";

export const metadata = { title: "Newsletter | Admin" };

export default async function AdminNewsletterPage() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "newsletter:manage")) {
    notFound();
  }

  const { db } = getDrizzleClient();
  const subscribers = await db.select({
    id: newsletterSubscriber.id,
    email: newsletterSubscriber.email,
    isActive: newsletterSubscriber.isActive,
    createdAt: newsletterSubscriber.createdAt,
  }).from(newsletterSubscriber).orderBy(desc(newsletterSubscriber.createdAt));
  const activeCount = subscribers.filter((subscriber) => subscriber.isActive).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Newsletter subscribers</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {activeCount} active of {subscribers.length} total
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
      <h2 className="mb-3 text-sm font-semibold">Subscribers</h2>
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-white">
        <table className="w-full text-sm">
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
                  <td className="px-4 py-3">{subscriber.email}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {new Date(subscriber.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
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
      </div>
    </div>
  );
}
