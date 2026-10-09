"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  { section: "Analytics" },
  { label: "Analytics", href: "/admin/analytics" },
  { section: "Documents" },
  { label: "Invoices", href: "/admin/invoices" },
  { section: "System" },
  { label: "Settings", href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
            item.section ? (
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
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-[var(--border)] bg-white flex items-center justify-between px-4 lg:px-6">
          <span className="lg:hidden font-display font-semibold text-[var(--brand-pink)]">Mini Street Admin</span>
          <div className="ml-auto text-sm text-[var(--muted)]">Owner</div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
