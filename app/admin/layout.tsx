"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity, BarChart3, Boxes, FolderTree, LayoutDashboard, Mail,
  Menu, Package, Search, Settings, ShoppingBag, TicketPercent,
  Store, Truck, Users, WalletCards, X, Tags, Star, FileSpreadsheet,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { can } from "@/lib/auth/permissions";
import { LogoutButton } from "@/components/admin/logout-button";

const SIDEBAR = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { section: "Catalog" },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Inventory", href: "/admin/inventory", icon: Boxes },
  { section: "Sales" },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Discounts", href: "/admin/discounts", icon: Tags },
  { label: "Coupons", href: "/admin/coupons", icon: TicketPercent },
  { label: "Offers", href: "/admin/offers", icon: WalletCards },
  { section: "Engagement" },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { section: "Analytics & reports" },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Email log", href: "/admin/emails", icon: Activity },
  { label: "Invoices", href: "/admin/invoices", icon: FileSpreadsheet },
  { label: "Database exports", href: "/admin/exports", icon: FileSpreadsheet },
  { section: "System" },
  { label: "Staff & roles", href: "/admin/users", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { data: session } = useSession();
  const canManageNewsletter = can(session?.user?.role, "newsletter:manage");
  const canExportDatabase = can(session?.user?.role, "analytics:read");
  const visibleItem = (href: string) =>
    (href !== "/admin/newsletter" || canManageNewsletter) &&
    (href !== "/admin/exports" || canExportDatabase);

  if (pathname === "/admin/login") return <>{children}</>;

  const navigation = (mobile = false) => SIDEBAR.map((item, index) => {
    if ("section" in item) {
      return <p key={`section-${index}`} className="px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-[.18em] text-white/40">{item.section}</p>;
    }
    if (!visibleItem(item.href)) return null;
    const Icon = item.icon;
    const active = item.href === "/admin" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link key={item.href} href={item.href} onClick={mobile ? () => setMobileNavOpen(false) : undefined}
        aria-current={active ? "page" : undefined}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition ${active ? "bg-[#e91e8c] text-white shadow-[0_8px_24px_rgba(233,30,140,.24)]" : "text-white/70 hover:bg-white/8 hover:text-white"}`}>
        <Icon size={17} strokeWidth={1.8} className={active ? "text-white" : "text-white/50 group-hover:text-[#f5a5d2]"} />
        <span>{item.label}</span>
      </Link>
    );
  });

  return (
    <div className={`admin-shell min-h-screen bg-[#f8f5f7] lg:flex ${sidebarCollapsed ? "admin-sidebar-collapsed" : ""}`}>
      <aside className={`admin-desktop-sidebar fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/8 bg-[#211820] text-white transition-[width] duration-200 lg:flex ${sidebarCollapsed ? "w-[76px]" : "w-[252px]"}`}>
        <div className={`flex h-[76px] items-center border-b border-white/10 ${sidebarCollapsed ? "justify-center px-2" : "px-5"}`}>
          <Link href="/admin" aria-label="Mini Street admin home" className="inline-flex items-center gap-3">
            <Image src="/brand/logo.png" alt="Mini Street" width={46} height={46} className="h-10 w-10 rounded-full bg-white object-contain p-1" priority />
            {!sidebarCollapsed && <span><span className="block font-display text-[19px] font-semibold leading-5 text-white">Mini Street</span><span className="mt-1 block text-[9px] uppercase tracking-[.2em] text-[#f2a4ce]">Studio · Admin</span></span>}
          </Link>
        </div>
        <nav className={`admin-sidebar-nav flex-1 overflow-y-auto py-3 ${sidebarCollapsed ? "px-2" : "px-3"}`}>
          {sidebarCollapsed
            ? SIDEBAR.map((item, index) => {
                if ("section" in item || !visibleItem(item.href)) return null;
                const Icon = item.icon;
                const active = item.href === "/admin" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    title={item.label}
                    aria-current={active ? "page" : undefined}
                    className={`mb-1 grid size-11 place-items-center rounded-xl transition ${active ? "bg-[#e91e8c] text-white shadow-[0_8px_24px_rgba(233,30,140,.24)]" : "text-white/65 hover:bg-white/10 hover:text-white"}`}
                  >
                    <Icon size={18} strokeWidth={1.8} />
                  </Link>
                );
              })
            : navigation()}
        </nav>
        <div className={`border-t border-white/10 p-3 ${sidebarCollapsed ? "flex justify-center" : ""}`}>
          <LogoutButton compact={sidebarCollapsed} iconOnly={sidebarCollapsed} />
        </div>
      </aside>

      <div className={`min-w-0 flex-1 transition-[padding] duration-200 ${sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-[252px]"}`}>
        <header className="admin-topbar sticky top-0 z-30 flex min-h-[68px] items-center gap-3 border-b border-[#eee5eb] bg-white/95 px-3 backdrop-blur-xl sm:px-5 lg:px-8">
          <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[#342a32] hover:bg-[#f8edf3] lg:hidden" onClick={() => setMobileNavOpen((open) => !open)} aria-label={mobileNavOpen ? "Close admin menu" : "Open admin menu"} aria-expanded={mobileNavOpen}>
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link href="/admin" className="flex shrink-0 items-center gap-2 lg:hidden" aria-label="Mini Street admin home">
            <Image src="/brand/logo.png" alt="" width={34} height={34} className="h-8 w-8 object-contain" />
            <span className="hidden font-display text-lg font-semibold text-[#c2186b] xs:inline">Mini Street</span>
          </Link>
          <button
            type="button"
            className="admin-sidebar-toggle hidden size-10 shrink-0 place-items-center rounded-xl border border-[#eee5eb] text-[#6f5d69] transition hover:border-[#e9c6d8] hover:bg-[#fff7fb] hover:text-[#c2186b] lg:grid"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={sidebarCollapsed}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <form action="/admin/search" method="get" role="search" className="admin-global-search relative flex min-w-0 max-w-[560px] flex-1 items-center">
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 text-[#8b7e87]" />
            <input name="q" type="search" minLength={2} maxLength={100} placeholder="Search products, orders, customers…" aria-label="Search all admin records" className="h-10 w-full rounded-full border border-[#eee3e9] bg-[#fffafc] pl-10 pr-4 text-xs outline-none transition placeholder:text-[#9c9098] focus:border-[#e91e8c] focus:bg-white sm:text-sm" />
          </form>
          <div className="ml-auto hidden min-w-0 items-center gap-2 border-l border-[#eee5eb] pl-4 sm:flex">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fcecf3] text-xs font-semibold uppercase text-[#c2186b]">{session?.user?.name?.slice(0, 1) || "M"}</div>
            <div className="min-w-0"><p className="max-w-36 truncate text-xs font-semibold text-[#342a32]">{session?.user?.name || "Store team"}</p><p className="text-[10px] uppercase tracking-wider text-[#91858e]">{session?.user?.role?.replaceAll("_", " ") || "Admin"}</p></div>
          </div>
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="admin-storefront-link inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#eee3e9] bg-white px-3 text-xs font-medium text-[#6f5d69] transition hover:border-[#e9c6d8] hover:bg-[#fff7fb] hover:text-[#c2186b]"
            aria-label="Open storefront in a new tab"
            title="View storefront"
          >
            <Store size={16} />
            <span>Storefront</span>
          </Link>
          <div className="admin-mobile-logout sm:hidden"><LogoutButton compact /></div>
        </header>

        {mobileNavOpen && <>
          <button aria-label="Close menu" className="fixed inset-x-0 bottom-0 top-[68px] z-30 bg-[#211820]/50 backdrop-blur-[2px] max-[639px]:top-[112px] lg:hidden" onClick={() => setMobileNavOpen(false)} />
          <nav className="admin-sidebar-nav fixed inset-y-[68px] left-0 z-40 w-[min(19rem,88vw)] overflow-y-auto bg-[#211820] px-3 py-3 text-white shadow-2xl max-[639px]:top-[112px] lg:hidden">{navigation(true)}<div className="mt-3 border-t border-white/10 pt-3"><Link href="/" target="_blank" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-white/60"><Store size={16} />View storefront</Link><LogoutButton /></div></nav>
        </>}
        <main className="admin-main min-w-0 p-3 sm:p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
