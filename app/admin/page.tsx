import { formatPrice } from "@/lib/utils";
import {
  getDashboardStats,
  getOrdersByStatus,
  getTopProducts,
  getRevenueTimeSeries,
} from "@/lib/db/queries/analytics";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { StatusChart } from "@/components/charts/status-chart";

export const metadata = { title: "Admin Dashboard | Mini Street" };

export default async function AdminDashboard() {
  let stats = {
    todayRevenue: 0,
    ordersToday: 0,
    pendingOrders: 0,
    productsSold: 0,
    lowStock: 0,
    periodRevenue: 0,
    periodOrders: 0,
  };
  let statusDist: { status: string; count: number }[] = [];
  let top: { product?: { name: string } | null; sold: number }[] = [];
  let series: { date: string; revenue: number }[] = [];

  try {
    [stats, statusDist, top, series] = await Promise.all([
      getDashboardStats(),
      getOrdersByStatus(),
      getTopProducts(5),
      getRevenueTimeSeries(14),
    ]);
  } catch { /* */ }

  const cards = [
    { label: "Today's Revenue", value: formatPrice(stats.todayRevenue) },
    { label: "Orders Today", value: String(stats.ordersToday) },
    { label: "Pending Orders", value: String(stats.pendingOrders) },
    { label: "Products Sold", value: String(stats.productsSold) },
    { label: "Low Stock", value: String(stats.lowStock) },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((s) => (
          <div key={s.label} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4 shadow-soft">
            <p className="text-xs text-[var(--muted)] mb-1">{s.label}</p>
            <p className="text-xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 shadow-soft">
          <h2 className="font-semibold text-sm mb-4">Revenue (14 days)</h2>
          <RevenueChart data={series} />
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 shadow-soft">
          <h2 className="font-semibold text-sm mb-4">Order status</h2>
          <StatusChart data={statusDist} />
        </div>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 shadow-soft">
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
