"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import { useCartStore } from "@/lib/cart/store";
import { useWishlistStore } from "@/lib/cart/wishlist-store";

const NAV = [
  { label: "Shop", href: "/shop" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Best Sellers", href: "/best-sellers" },
  { label: "Offers", href: "/offers" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const count = useCartStore((s) => s.getCount());
  const wishlistCount = useWishlistStore((s) => s.items.length);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-[var(--border)] shadow-soft"
          : "bg-white/95 backdrop-blur-md border-b border-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "flex items-center justify-between gap-0 transition-all duration-300 sm:gap-4",
            scrolled ? "h-14" : "h-16"
          )}
        >
          <div className="flex shrink-0 items-center">
            <button
              className="lg:hidden p-2 pr-0 -ml-2 rounded-[var(--radius-sm)] hover:bg-[var(--brand-blush)] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/" className="flex items-center">
              <span className="font-serif text-[22px] font-black leading-none tracking-[-0.055em] text-[var(--brand-pink)] transition-all duration-300 sm:text-2xl">
                MINI STREET
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-7">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[13px] font-medium tracking-wide text-[var(--charcoal)] hover:text-[var(--brand-pink)] transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
            <div className="relative group">
              <button className="text-[13px] font-medium tracking-wide text-[var(--charcoal)] hover:text-[var(--brand-pink)] transition-colors">
                Categories
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 bg-white rounded-[var(--radius-lg)] shadow-soft-lg border border-[var(--border)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-250 py-2 z-50">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/shop/${cat.slug}`}
                    className="block px-4 py-2.5 text-[13px] text-[var(--charcoal)] hover:bg-[var(--brand-blush)] hover:text-[var(--brand-pink)] transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1">
            {[{ href: "/search", icon: Search, label: "Search" }].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="p-2.5 rounded-full hover:bg-[var(--brand-blush)] transition-colors duration-200"
                aria-label={label}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </Link>
            ))}
            <Link
              href="/wishlist"
              className="relative rounded-full p-2.5 transition-colors duration-200 hover:bg-[var(--brand-blush)]"
              aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} saved` : "Wishlist"}
            >
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {mounted && wishlistCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-pink)] px-1 text-[9px] font-bold text-white shadow-soft">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className="relative p-2.5 rounded-full hover:bg-[var(--brand-blush)] transition-colors duration-200"
              aria-label="Cart"
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {mounted && count > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-pink)] px-1 text-[9px] font-bold text-white shadow-soft">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-[var(--border)] bg-white/98 backdrop-blur-xl">
          <nav className="px-4 py-5 space-y-0.5 max-h-[70vh] overflow-y-auto">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-3 text-sm font-medium text-[var(--charcoal)] border-b border-[var(--border)]/50"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <p className="pt-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
              Categories
            </p>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop/${cat.slug}`}
                className="block py-2.5 text-sm text-[var(--charcoal)]"
                onClick={() => setMobileOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
