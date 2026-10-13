"use client";

import { useEffect, useRef, useState } from "react";

type RevenuePoint = { date: string; revenue: number };
type StatusPoint = { status: string; count: number };
type RevenueComponent = React.ComponentType<{ data: RevenuePoint[] }>;
type StatusComponent = React.ComponentType<{ data: StatusPoint[] }>;

export function LazyAdminCharts({ days }: { days: number }) {
  const regionRef = useRef<HTMLDivElement>(null);
  const [charts, setCharts] = useState<{ Revenue: RevenueComponent; Status: StatusComponent } | null>(null);
  const [data, setData] = useState<{ revenue: RevenuePoint[]; statuses: StatusPoint[] } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const element = regionRef.current;
    if (!element) return;
    let active = true;
    const load = async () => {
      try {
        const [response, revenueModule, statusModule] = await Promise.all([
          fetch(`/api/admin/analytics/charts?days=${days}`, { cache: "no-store" }),
          import("@/components/charts/revenue-chart"),
          import("@/components/charts/status-chart"),
        ]);
        if (!response.ok) throw new Error("Chart data request failed");
        const chartData = await response.json() as { revenue: RevenuePoint[]; statuses: StatusPoint[] };
        if (!active) return;
        setData(chartData);
        setCharts({ Revenue: revenueModule.RevenueChart, Status: statusModule.StatusChart });
      } catch {
        if (active) setError(true);
      }
    };
    if (!("IntersectionObserver" in window)) {
      void load();
      return () => { active = false; };
    }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void load();
    }, { rootMargin: "180px" });
    observer.observe(element);
    return () => { active = false; observer.disconnect(); };
  }, [days]);

  const RevenueChart = charts?.Revenue;
  const StatusChart = charts?.Status;
  const skeleton = <div aria-label={error ? "Chart data unavailable" : "Loading chart"} className={`flex h-[260px] items-center justify-center rounded-2xl ${error ? "bg-[#fff7fb] text-sm text-[#8e7d88]" : "animate-pulse bg-gradient-to-br from-[#fff7fb] via-[#fbf7fa] to-[#f7f1f5]"}`}>{error ? "Charts could not be loaded. Refresh to try again." : null}</div>;

  return (
    <div ref={regionRef} className="grid min-w-0 gap-5 xl:grid-cols-2">
      <section className="admin-chart-card min-w-0 rounded-[22px] border border-[#eee4ea] bg-white p-4 shadow-[0_12px_40px_rgba(72,40,59,.055)] sm:p-6">
        <div className="mb-4 flex items-end justify-between gap-3"><div><p className="admin-eyebrow">Performance</p><h2 className="text-base font-semibold text-[#342a32]">Revenue trend</h2></div><span className="rounded-full bg-[#fff2f8] px-3 py-1 text-[11px] font-medium text-[#c2186b]">Last {days} days</span></div>
        {RevenueChart && data ? <RevenueChart data={data.revenue} /> : skeleton}
      </section>
      <section className="admin-chart-card min-w-0 rounded-[22px] border border-[#eee4ea] bg-white p-4 shadow-[0_12px_40px_rgba(72,40,59,.055)] sm:p-6">
        <div className="mb-4"><p className="admin-eyebrow">Order health</p><h2 className="text-base font-semibold text-[#342a32]">Order status mix</h2></div>
        {StatusChart && data ? <StatusChart data={data.statuses} /> : skeleton}
      </section>
    </div>
  );
}
