"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { can } from "@/lib/auth/permissions";

const SIDEBAR = [
  { label: "Dashboard", href: "/admin" },
  { section: "Catalog" },
  { label: "Products", href: "/admin/products" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Inventory", href: "/admin/inventory" },
  { section: "Sales" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Discounts", href: "/admin/discounts" },
  { label: "Coupons", href: "/admin/coupons" },
  { label: "Offers", href: "/admin/offers" },
  { section: "Engagement" },
  { label: "Reviews", href: "/admin/reviews" },
  { label: "Newsletter", href: "/admin/newsletter" },
  { section: "Analytics" },
  { label: "Analytics", href: "/admin/analytics" },
  { section: "Documents" },
  { label: "Invoices", href: "/admin/invoices" },
  { section: "System" },
  { label: "Settings", href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { data: session } = useSession();
  const canManageNewsletter = can(session?.user?.role, "newsletter:manage");
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-[#f7f5f6]">
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-[var(--border)] bg-white">
        <div className="p-4 border-b border-[var(--border)]">
          <Link href="/admin" className="font-display text-lg font-semibold text-[var(--brand-pink)]">
            Mini Street
          </Link>
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Admin</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {SIDEBAR.map((item, i) =>
            item.href === "/admin/newsletter" && !canManageNewsletter ? null : item.section ? (
              <p key={i} className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                {item.section}
              </p>
            ) : (
              <Link
                key={item.href}
                href={item.href!}
                className={`block px-3 py-2 text-sm rounded-[var(--radius-sm)] transition-colors ${
                  pathname === item.href
                    ? "bg-[var(--brand-blush)] text-[var(--brand-pink)] font-medium"
                    : "text-[var(--charcoal)] hover:bg-[var(--brand-blush)] hover:text-[var(--brand-pink)]"
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>
        <div className="p-3 border-t border-[var(--border)]">
          <Link href="/" className="text-xs text-[var(--muted)] hover:text-[var(--brand-pink)]">
            ← View storefront
          </Link>
        </div>
      </aside>
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-white px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-lg p-2 text-[var(--charcoal)] hover:bg-[var(--brand-blush)] lg:hidden" onClick={() => setMobileNavOpen((open) => !open)} aria-label={mobileNavOpen ? "Close admin menu" : "Open admin menu"} aria-expanded={mobileNavOpen}>
              {mobileNavOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
            <span className="lg:hidden font-display font-semibold text-[var(--brand-pink)]">Mini Street Admin</span>
          </div>
          <div className="ml-auto text-sm text-[var(--muted)]">Owner</div>
        </header>
        {mobileNavOpen && <>
          <button aria-label="Close menu" className="fixed inset-0 z-30 bg-black/25 lg:hidden" onClick={() => setMobileNavOpen(false)} />
          <nav className="fixed inset-y-14 left-0 z-40 w-[min(19rem,88vw)] overflow-y-auto border-r border-[var(--border)] bg-white px-3 py-3 shadow-soft-lg lg:hidden">
            {SIDEBAR.map((item, i) => item.href === "/admin/newsletter" && !canManageNewsletter ? null : item.section ? <p key={i} className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{item.section}</p> : <Link key={item.href} href={item.href!} onClick={() => setMobileNavOpen(false)} className={`block rounded-lg px-3 py-2.5 text-sm ${pathname === item.href ? "bg-[var(--brand-blush)] font-medium text-[var(--brand-pink)]" : "text-[var(--charcoal)] hover:bg-[var(--brand-blush)]"}`}>{item.label}</Link>)}
            <div className="mt-4 border-t border-[var(--border)] pt-3"><Link href="/" onClick={() => setMobileNavOpen(false)} className="block px-3 py-2 text-xs text-[var(--muted)]">← View storefront</Link></div>
          </nav>
        </>}
        <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 lg:overflow-auto lg:p-6">{children}</main>
      </div>
    </div>
  );
}
