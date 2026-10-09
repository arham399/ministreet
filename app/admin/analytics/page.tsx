import { formatPrice } from "@/lib/utils";
import {
  getDashboardStats,
  getOrdersByStatus,
  getTopProducts,
  getRevenueTimeSeries,
  getSalesByCategory,
} from "@/lib/db/queries/analytics";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { StatusChart } from "@/components/charts/status-chart";

export const metadata = { title: "Analytics | Admin" };

export default async function AnalyticsPage() {
  let stats = { periodRevenue: 0, periodOrders: 0, productsSold: 0, todayRevenue: 0, ordersToday: 0, pendingOrders: 0, lowStock: 0 };
  let statusDist: { status: string; count: number }[] = [];
  let top: { product?: { name: string } | null; sold: number }[] = [];
  let series: { date: string; revenue: number }[] = [];
  let byCat: { name: string; value: number }[] = [];

  try {
    [stats, statusDist, top, series, byCat] = await Promise.all([
      getDashboardStats(),
      getOrdersByStatus(),
      getTopProducts(10),
      getRevenueTimeSeries(30),
      getSalesByCategory(),
    ]);
  } catch { /* */ }

  const aov = stats.periodOrders > 0 ? stats.periodRevenue / stats.periodOrders : 0;

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Sales Analytics</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 shadow-soft">
          <h2 className="font-semibold text-sm mb-4">Revenue (30 days)</h2>
          <RevenueChart data={series} />
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 shadow-soft">
          <h2 className="font-semibold text-sm mb-4">Order status</h2>
          <StatusChart data={statusDist} />
        </div>
      </div>

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
