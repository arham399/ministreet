import Link from "next/link";
import { and, eq, ilike, ne, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import {
  category,
  coupon,
  discount,
  emailLog,
  inventoryMovement,
  invoice,
  newsletterSubscriber,
  offer,
  order,
  product,
  review,
  user,
} from "@/lib/db/drizzle/schema";

export const metadata = { title: "Admin search | Mini Street" };

type SearchResult = { section: string; title: string; detail: string; href: string };

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const pattern = `%${query}%`;
  let results: SearchResult[] = [];
  let searchFailed = false;

  if (query.length >= 2) {
    try {
      const { db } = getDrizzleClient();
      const searches: Promise<SearchResult[]>[] = [];

      if (can(session.user.role, "products:read")) {
        searches.push(db.select({ id: product.id, name: product.name, sku: product.sku })
          .from(product).where(or(ilike(product.name, pattern), ilike(product.sku, pattern))).limit(8)
          .then((rows) => rows.map((row) => ({ section: "Products", title: row.name, detail: `SKU ${row.sku}`, href: `/admin/products?q=${encodeURIComponent(row.sku)}` }))));
        searches.push(db.select({ id: category.id, name: category.name, slug: category.slug })
          .from(category).where(or(ilike(category.name, pattern), ilike(category.slug, pattern))).limit(8)
          .then((rows) => rows.map((row) => ({ section: "Categories", title: row.name, detail: row.slug, href: "/admin/categories" }))));
        searches.push(db.select({ id: inventoryMovement.id, name: product.name, sku: product.sku, reason: inventoryMovement.reason })
          .from(inventoryMovement).innerJoin(product, eq(inventoryMovement.productId, product.id))
          .where(or(ilike(product.name, pattern), ilike(product.sku, pattern), ilike(inventoryMovement.reason, pattern))).limit(8)
          .then((rows) => rows.map((row) => ({ section: "Inventory", title: row.name, detail: [row.sku, row.reason].filter(Boolean).join(" · "), href: "/admin/inventory" }))));
      }

      if (can(session.user.role, "orders:read")) {
        searches.push(db.select({ id: order.id, orderNumber: order.orderNumber, customerName: order.customerName, customerEmail: order.customerEmail, status: order.status })
          .from(order).where(or(ilike(order.orderNumber, pattern), ilike(order.customerName, pattern), ilike(order.customerEmail, pattern), ilike(order.customerPhone, pattern))).limit(8)
          .then((rows) => rows.map((row) => ({ section: "Orders", title: row.orderNumber, detail: `${row.customerName} · ${row.customerEmail} · ${row.status}`, href: `/admin/orders/${row.id}` }))));
        searches.push(db.select({ id: invoice.id, invoiceNumber: invoice.invoiceNumber, orderNumber: order.orderNumber, customerName: order.customerName })
          .from(invoice).innerJoin(order, eq(invoice.orderId, order.id))
          .where(or(ilike(invoice.invoiceNumber, pattern), ilike(order.orderNumber, pattern), ilike(order.customerName, pattern))).limit(8)
          .then((rows) => rows.map((row) => ({ section: "Invoices", title: row.invoiceNumber, detail: `Order ${row.orderNumber} · ${row.customerName}`, href: "/admin/invoices" }))));
      }

      if (can(session.user.role, "customers:read")) {
        searches.push(db.select({ id: user.id, name: user.name, email: user.email, phone: user.phone })
          .from(user).where(and(eq(user.role, "CUSTOMER"), or(ilike(user.name, pattern), ilike(user.email, pattern), ilike(user.phone, pattern)))).limit(8)
          .then((rows) => rows.map((row) => ({ section: "Customers", title: row.name || row.email, detail: [row.email, row.phone].filter(Boolean).join(" · "), href: "/admin/customers" }))));
      }

      if (can(session.user.role, "discounts:write")) {
        searches.push(db.select({ id: coupon.id, code: coupon.code, campaignId: coupon.campaignId })
          .from(coupon).where(or(ilike(coupon.code, pattern), ilike(coupon.campaignId, pattern))).limit(8)
          .then((rows) => rows.map((row) => ({ section: "Coupons", title: row.code, detail: `Campaign ${row.campaignId}`, href: "/admin/coupons" }))));
        searches.push(db.select({ id: discount.id, name: discount.name })
          .from(discount).where(ilike(discount.name, pattern)).limit(8)
          .then((rows) => rows.map((row) => ({ section: "Discounts", title: row.name, detail: "Store discount", href: "/admin/discounts" }))));
        searches.push(db.select({ id: offer.id, title: offer.title })
          .from(offer).where(ilike(offer.title, pattern)).limit(8)
          .then((rows) => rows.map((row) => ({ section: "Offers", title: row.title, detail: "Store offer", href: "/admin/offers" }))));
      }

      if (can(session.user.role, "reviews:moderate")) {
        searches.push(db.select({ id: review.id, authorName: review.authorName, title: review.title, body: review.body })
          .from(review).where(or(ilike(review.authorName, pattern), ilike(review.title, pattern), ilike(review.body, pattern))).limit(8)
          .then((rows) => rows.map((row) => ({ section: "Reviews", title: row.title || `Review by ${row.authorName}`, detail: row.body || row.authorName, href: "/admin/reviews" }))));
      }

      if (can(session.user.role, "newsletter:manage")) {
        searches.push(db.select({ id: newsletterSubscriber.id, email: newsletterSubscriber.email, isActive: newsletterSubscriber.isActive })
          .from(newsletterSubscriber).where(ilike(newsletterSubscriber.email, pattern)).limit(8)
          .then((rows) => rows.map((row) => ({ section: "Newsletter", title: row.email, detail: row.isActive ? "Active subscriber" : "Unsubscribed", href: "/admin/newsletter" }))));
      }

      if (can(session.user.role, "analytics:read")) {
        searches.push(db.select({ id: emailLog.id, to: emailLog.to, subject: emailLog.subject, status: emailLog.status })
          .from(emailLog).where(or(ilike(emailLog.to, pattern), ilike(emailLog.subject, pattern))).limit(8)
          .then((rows) => rows.map((row) => ({ section: "Email log", title: row.subject, detail: `${row.to} · ${row.status}`, href: "/admin/emails" }))));
      }

      if (can(session.user.role, "users:write")) {
        searches.push(db.select({ id: user.id, name: user.name, email: user.email, role: user.role })
          .from(user).where(and(ne(user.role, "CUSTOMER"), or(ilike(user.name, pattern), ilike(user.email, pattern)))).limit(8)
          .then((rows) => rows.map((row) => ({ section: "Staff & roles", title: row.name || row.email, detail: `${row.email} · ${row.role}`, href: "/admin/users" }))));
      }

      results = (await Promise.all(searches)).flat();
    } catch (error) {
      console.error("[admin-search] Search query failed", error);
      searchFailed = true;
    }
  }

  const sections = [...new Set(results.map((result) => result.section))];
  return (
    <div className="mx-auto max-w-5xl">
      <p className="section-label">Mini Street · Admin</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">Search</h1>
      {query.length < 2 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">Enter at least two characters in the admin search bar to find products, orders, customers, and more.</p>
      ) : searchFailed ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-white p-5 text-sm text-red-700">Search is temporarily unavailable. Please try again.</p>
      ) : results.length === 0 ? (
        <p className="mt-4 rounded-xl border border-[var(--border)] bg-white p-5 text-sm text-[var(--muted)]">No matching admin records found for “{query}”.</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-[var(--muted)]">Showing matches for “{query}” across {sections.length} {sections.length === 1 ? "section" : "sections"}.</p>
          <div className="mt-6 space-y-6">
            {sections.map((section) => (
              <section key={section}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{section}</h2>
                <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-white shadow-soft">
                  {results.filter((result) => result.section === section).map((result, index) => (
                    <li key={`${result.title}-${index}`}>
                      <Link href={result.href} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--brand-cream)]">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[var(--charcoal)]">{result.title}</span>
                          <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{result.detail}</span>
                        </span>
                        <span className="shrink-0 text-xs font-medium text-[var(--brand-pink)]">Open {section.toLowerCase()} →</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
