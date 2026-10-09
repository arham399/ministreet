import Link from "next/link";
import { CATEGORIES, INSTAGRAM_URL, SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="bg-white border-t border-[var(--border)] mt-8">
      {/* Newsletter */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-blush)] via-[var(--brand-pink-soft)]/50 to-[var(--brand-teal-soft)]/40" />
        <div className="relative py-14 px-4">
          <div className="mx-auto max-w-lg text-center">
            <p className="section-label mb-3">Stay close</p>
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--charcoal)] mb-2">
              Join the Mini Street Club
            </h3>
            <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
              Be first to know about new arrivals, special offers and little surprises.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto"
              action="/api/newsletter"
              method="post"
            >
              <input
                type="email"
                name="email"
                placeholder="Your email"
                required
                className="flex-1 h-12 rounded-[var(--radius-md)] border border-[var(--border)] bg-white/90 px-4 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-transparent"
                aria-label="Email for newsletter"
              />
              <button
                type="submit"
                className="h-12 px-7 rounded-[var(--radius-md)] bg-[var(--brand-pink)] text-white text-sm font-medium hover:bg-[var(--brand-pink-deep)] transition-colors shadow-soft"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--charcoal)] mb-5">
              Shop
            </h4>
            <ul className="space-y-2.5 text-sm text-[var(--muted)]">
              {[
                ["All Products", "/shop"],
                ["New Arrivals", "/new-arrivals"],
                ["Best Sellers", "/best-sellers"],
                ["Offers", "/offers"],
                ["Combo Sets", "/shop/combo-sets"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-[var(--brand-pink)] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--charcoal)] mb-5">
              Categories
            </h4>
            <ul className="space-y-2.5 text-sm text-[var(--muted)]">
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link href={`/shop/${c.slug}`} className="hover:text-[var(--brand-pink)] transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--charcoal)] mb-5">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-sm text-[var(--muted)]">
              {[
                ["Track Order", "/track-order"],
                ["Shipping", "/shipping-policy"],
                ["Returns & Exchanges", "/return-policy"],
                ["FAQs", "/faq"],
                ["Contact", "/contact"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-[var(--brand-pink)] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--charcoal)] mb-5">
              About
            </h4>
            <ul className="space-y-2.5 text-sm text-[var(--muted)]">
              <li>
                <Link href="/about" className="hover:text-[var(--brand-pink)] transition-colors">
                  Our Story
                </Link>
              </li>
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--brand-pink)] transition-colors"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="divider-soft my-10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--muted)] tracking-wide">
          <p>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-5">
            {[
              ["Privacy Policy", "/privacy-policy"],
              ["Terms", "/terms"],
              ["Shipping", "/shipping-policy"],
              ["Returns", "/return-policy"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="hover:text-[var(--brand-pink)] transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
