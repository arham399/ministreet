import Link from "next/link";
import { Facebook, Instagram } from "lucide-react";
import { CONTACT_PHONE_LINK, FACEBOOK_URL, INSTAGRAM_URL, SITE_NAME } from "@/lib/constants";
import type { StoreCategory } from "@/lib/db/drizzle/queries/categories";
import {
  NewsletterDescription,
  NewsletterSignup,
} from "@/components/layout/newsletter-signup";

export function SiteFooter({ categories }: { categories: StoreCategory[] }) {
  return (
    <footer className="bg-white border-t border-[var(--border)] mt-8">
      {/* Newsletter */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 12% 50%, rgba(244, 195, 218, 0.92), transparent 56%), radial-gradient(ellipse at 88% 50%, rgba(190, 232, 224, 0.95), transparent 56%), linear-gradient(105deg, #fff6f9 0%, #fff8fb 50%, #f1faf8 100%)",
          }}
        />
        <div className="relative py-14 px-4">
          <div className="mx-auto max-w-lg text-center">
            <p className="section-label mb-3">Stay close</p>
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--charcoal)] mb-2">
              Join the Mini Street Club
            </h3>
            <NewsletterDescription />
            <NewsletterSignup />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
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
              {categories.map((c) => (
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
            <a
              href={`https://wa.me/${CONTACT_PHONE_LINK.replace("tel:+", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--brand-pink)]"
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
                <path d="M20.52 3.48A11.82 11.82 0 0 0 12.1 0C5.56 0 .24 5.32.24 11.86c0 2.09.55 4.13 1.59 5.93L.14 24l6.37-1.67a11.86 11.86 0 0 0 5.58 1.42h.01c6.54 0 11.86-5.32 11.86-11.86 0-3.17-1.23-6.15-3.44-8.41ZM12.1 21.74h-.01a9.86 9.86 0 0 1-5.02-1.37l-.36-.21-3.78.99 1.01-3.69-.24-.38a9.82 9.82 0 0 1-1.51-5.22c0-5.47 4.45-9.92 9.92-9.92 2.65 0 5.14 1.03 7.01 2.91a9.86 9.86 0 0 1 2.9 7.01c0 5.47-4.45 9.92-9.92 9.92Zm5.45-7.43c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.27.5 1.7.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
              </svg>
              WhatsApp support
            </a>
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
            </ul>
            <h4 className="mt-6 mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--charcoal)]">
              Follow us
            </h4>
            <div className="flex items-center gap-3">
              <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid size-9 place-items-center rounded-full border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--brand-pink)] hover:text-[var(--brand-pink)]">
                <Facebook size={17} />
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid size-9 place-items-center rounded-full border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--brand-pink)] hover:text-[var(--brand-pink)]">
                <Instagram size={17} />
              </a>
            </div>
          </div>
        </div>

        <div className="divider-soft my-7 sm:my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--muted)] tracking-wide">
          <p>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-5">
            {[
              ["Privacy Policy", "/privacy-policy"],
              ["Terms & Conditions", "/terms"],
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
