"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { date: string; revenue: number };
const compact = new Intl.NumberFormat("en-PK", { notation: "compact", maximumFractionDigits: 1 });
const rupees = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

export function RevenueChart({ data }: { data: Point[] }) {
  if (!data.length) return <div className="flex h-[260px] items-center justify-center rounded-2xl bg-[#fffafc] text-sm text-[var(--muted)]">No revenue data yet</div>;

  return (
    <div className="h-[260px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
          <defs><linearGradient id="miniStreetRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e91e8c" stopOpacity={0.22} /><stop offset="95%" stopColor="#e91e8c" stopOpacity={0.015} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#f1e8ed" strokeDasharray="4 5" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#988b94", fontSize: 10 }} tickMargin={12} tickFormatter={(value: string) => value.slice(5)} minTickGap={24} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#988b94", fontSize: 10 }} tickFormatter={(value: number) => compact.format(value)} width={52} />
          <Tooltip cursor={{ stroke: "#d9cbd4", strokeDasharray: "4 4" }} formatter={(value) => [`Rs. ${rupees.format(Number(value) || 0)}`, "Revenue"]} labelFormatter={(label) => `Date · ${label}`} contentStyle={{ border: "1px solid #f0e5eb", borderRadius: 14, boxShadow: "0 12px 32px rgba(53,31,45,.12)", padding: "10px 14px", fontSize: 12 }} />
          <Area type="monotone" dataKey="revenue" stroke="#e91e8c" strokeWidth={2.5} fill="url(#miniStreetRevenue)" activeDot={{ r: 5, stroke: "white", strokeWidth: 3, fill: "#c2186b" }} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
