"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Status = { status: string; count: number };
const COLORS: Record<string, string> = {
  PLACED: "#e8bf63", CONFIRMED: "#e91e8c", PROCESSING: "#a784c2", PACKED: "#76b8a5",
  SHIPPED: "#61aeca", OUT_FOR_DELIVERY: "#54b8ad", DELIVERED: "#4b9c77", CANCELLED: "#c85c78",
};
const colorAt = (status: string, index: number) => COLORS[status.toUpperCase()] || ["#e91e8c", "#e8bf63", "#59b8ae", "#9b80b5", "#c85c78"][index % 5];
const readable = (status: string) => status.toLowerCase().split("_").map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ");
const number = new Intl.NumberFormat("en-PK");

export function StatusChart({ data }: { data: Status[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (!data.length || total === 0) return <div className="flex h-[260px] items-center justify-center rounded-2xl bg-[#fffafc] text-sm text-[var(--muted)]">No order data yet</div>;

  return (
    <div className="grid h-[260px] min-w-0 grid-cols-1 items-center gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(150px,.8fr)]">
      <div className="relative mx-auto h-[210px] w-full max-w-[260px]">
        <ResponsiveContainer width="100%" height="100%"><PieChart>
          <Pie data={data} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius="62%" outerRadius="88%" paddingAngle={3} stroke="white" strokeWidth={3}>
            {data.map((entry, index) => <Cell key={entry.status} fill={colorAt(entry.status, index)} />)}
          </Pie>
          <Tooltip formatter={(value, name) => [number.format(Number(value) || 0), readable(String(name))]} contentStyle={{ border: "1px solid #f0e5eb", borderRadius: 14, boxShadow: "0 12px 32px rgba(53,31,45,.12)", padding: "10px 14px", fontSize: 12 }} />
        </PieChart></ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl font-semibold tracking-tight text-[#342a32]">{number.format(total)}</strong><span className="mt-0.5 text-[10px] uppercase tracking-[.16em] text-[#968993]">Total orders</span></div>
      </div>
      <ul className="flex max-h-[220px] flex-col justify-center gap-2 overflow-y-auto pr-1">
        {data.map((entry, index) => <li key={entry.status} className="flex min-w-0 items-center justify-between gap-2 rounded-xl px-2 py-1.5 transition hover:bg-[#fff7fb]"><span className="flex min-w-0 items-center gap-2"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorAt(entry.status, index) }} /><span className="truncate text-xs text-[#6f626b]">{readable(entry.status)}</span></span><span className="shrink-0 text-xs font-semibold text-[#342a32]">{Math.round(entry.count / total * 100)}%</span></li>)}
      </ul>
    </div>
  );
}
