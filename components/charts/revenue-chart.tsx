"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Point = { date: string; revenue: number };

export function RevenueChart({ data }: { data: Point[] }) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-[var(--muted)]">
        No revenue data yet
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E91E8C" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#E91E8C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#EDE4E8" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => v.slice(5)}
          />
          <YAxis tick={{ fontSize: 11 }} width={48} />
          <Tooltip
            formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, "Revenue"]}
            contentStyle={{ borderRadius: 8, border: "1px solid #EDE4E8" }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#E91E8C"
            fill="url(#rev)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
