import { formatPrice } from "@/lib/utils";
import {
  getDashboardStats,
  getTopProducts,
} from "@/lib/db/queries/analytics";
import { LazyAdminCharts } from "@/components/admin/lazy-admin-charts";
import { AlertTriangle, Clock3, Gem, ShoppingBag, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Admin Dashboard | Mini Street" };

const REVENUE_RANGES = {
  all: "All time",
  today: "Today",
  week: "Last 7 days",
  month: "Last 30 days",
} as const;

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const params = await searchParams;
  const range = params.range && params.range in REVENUE_RANGES
    ? params.range as keyof typeof REVENUE_RANGES
    : "all";
  const now = new Date();
  const from = range === "all" ? undefined : startOfKarachiDay(now, range === "today" ? 0 : range === "week" ? 6 : 29);
  let stats = {
    todayRevenue: 0,
    ordersToday: 0,
    pendingOrders: 0,
    productsSold: 0,
    lowStock: 0,
    periodRevenue: 0,
    periodOrders: 0,
  };
  let top: { product?: { name: string } | null; sold: number }[] = [];

  try {
    [stats, top] = await Promise.all([
      getDashboardStats(from, now),
      getTopProducts(5),
    ]);
  } catch { /* */ }

  const cards = [
    { label: `Revenue · ${REVENUE_RANGES[range]}`, value: formatPrice(stats.periodRevenue), icon: WalletCards, tint: "bg-[#fff0f7] text-[#c2186b]", gradient: "from-[#fff7fb] via-white to-[#fde8f2]" },
    { label: "Orders Today", value: String(stats.ordersToday), icon: ShoppingBag, tint: "bg-[#eef8f5] text-[#438f80]", gradient: "from-[#f3fbf8] via-white to-[#e7f4ef]" },
    { label: "Pending Orders", value: String(stats.pendingOrders), icon: Clock3, tint: "bg-[#fff7e8] text-[#a27b2d]", gradient: "from-[#fffaf0] via-white to-[#f9f0dc]" },
    { label: "Products Sold", value: String(stats.productsSold), icon: Gem, tint: "bg-[#f4effa] text-[#8565a4]", gradient: "from-[#faf7ff] via-white to-[#efe8f8]" },
    { label: "Low Stock", value: String(stats.lowStock), icon: AlertTriangle, tint: "bg-[#fff1ef] text-[#bc6154]", gradient: "from-[#fff8f6] via-white to-[#fceae6]" },
  ];

  return (
    <div>
      <div className="admin-page-heading mb-6"><div><p className="admin-eyebrow">Your store at a glance</p><h1 className="font-display text-3xl font-semibold tracking-tight text-[#342a32]">Dashboard</h1></div><span className="rounded-full border border-[#eddee6] bg-white px-3 py-1.5 text-[11px] font-medium text-[#82737d]">Mini Street · Admin</span></div>
      <form action="/admin" method="get" className="mb-4 flex flex-wrap items-center gap-2.5">
        <label htmlFor="revenue-range" className="text-sm font-medium text-[#6f5d69]">Revenue period</label>
        <select id="revenue-range" name="range" defaultValue={range} className="h-10 rounded-xl border border-[#eadde5] bg-white px-3 text-sm text-[#342a32] outline-none focus:border-[#e91e8c]">
          {Object.entries(REVENUE_RANGES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <Button type="submit" size="sm" variant="outline">Apply</Button>
      </form>
      <div className="admin-stat-grid mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {cards.map((s) => (
          <div key={s.label} className={`group rounded-[22px] border border-[#eee4ea] bg-gradient-to-br ${s.gradient} p-4 shadow-[0_10px_32px_rgba(72,40,59,.045)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(72,40,59,.09)] sm:p-5`}>
            <div className="mb-4 flex items-center justify-between gap-2"><p className="text-xs font-medium text-[#887b84]">{s.label}</p><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${s.tint}`}><s.icon size={17} strokeWidth={1.8} /></span></div>
            <p className="break-words text-xl font-semibold tracking-tight text-[#342a32] sm:text-2xl">{s.value}</p>
          </div>
        ))}
      </div>
      <LazyAdminCharts days={14} />
      <div className="mt-5 rounded-[22px] border border-[#eee4ea] bg-white p-5 shadow-[0_12px_40px_rgba(72,40,59,.055)]">
        <h2 className="font-semibold text-sm mb-3">Top products</h2>
        {top.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No sales yet</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {top.map((t, i) => (
              <li key={i} className="flex justify-between">
                <span>{t.product?.name || "Unknown"}</span>
                <span className="font-medium">{t.sold} sold</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function startOfKarachiDay(now: Date, daysBeforeToday: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: "year" | "month" | "day") => Number(parts.find((item) => item.type === type)?.value);
  return new Date(Date.UTC(part("year"), part("month") - 1, part("day") - daysBeforeToday, -5));
}
