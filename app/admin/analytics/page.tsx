import { formatPrice } from "@/lib/utils";
import {
  getDashboardStats,
  getTopProducts,
  getSalesByCategory,
} from "@/lib/db/queries/analytics";
import { LazyAdminCharts } from "@/components/admin/lazy-admin-charts";

export const metadata = { title: "Analytics | Admin" };

export default async function AnalyticsPage() {
  let stats = { periodRevenue: 0, periodOrders: 0, productsSold: 0, todayRevenue: 0, ordersToday: 0, pendingOrders: 0, lowStock: 0 };
  let top: { product?: { name: string } | null; sold: number }[] = [];
  let byCat: { name: string; value: number }[] = [];

  try {
    [stats, top, byCat] = await Promise.all([
      getDashboardStats(),
      getTopProducts(10),
      getSalesByCategory(),
    ]);
  } catch { /* */ }

  const aov = stats.periodOrders > 0 ? stats.periodRevenue / stats.periodOrders : 0;

  return (
    <div>
      <div className="admin-page-heading mb-6"><div><p className="admin-eyebrow">Insights &amp; performance</p><h1 className="font-display text-3xl font-semibold tracking-tight text-[#342a32]">Sales analytics</h1></div></div>
      <div className="admin-stat-grid mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4 shadow-soft">
          <p className="text-xs text-[var(--muted)]">Revenue</p>
          <p className="text-xl font-semibold">{formatPrice(stats.periodRevenue)}</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4 shadow-soft">
          <p className="text-xs text-[var(--muted)]">Orders</p>
          <p className="text-xl font-semibold">{stats.periodOrders}</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4 shadow-soft">
          <p className="text-xs text-[var(--muted)]">AOV</p>
          <p className="text-xl font-semibold">{formatPrice(aov)}</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4 shadow-soft">
          <p className="text-xs text-[var(--muted)]">Units sold</p>
          <p className="text-xl font-semibold">{stats.productsSold}</p>
        </div>
      </div>

      <div className="mb-6"><LazyAdminCharts days={30} /></div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 shadow-soft">
          <h2 className="font-semibold text-sm mb-4">Sales by category</h2>
          {byCat.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No data</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {byCat.map((c) => (
                <li key={c.name} className="flex justify-between">
                  <span>{c.name}</span>
                  <span className="font-medium">{formatPrice(c.value)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 shadow-soft">
          <h2 className="font-semibold text-sm mb-4">Top products</h2>
          {top.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No data</p>
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
    </div>
  );
}
