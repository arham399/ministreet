"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#E91E8C", "#59B8AE", "#E7C66A", "#C2186B", "#746B72", "#2D9F6F", "#D14343"];

export function StatusChart({ data }: { data: { status: string; count: number }[] }) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-[var(--muted)]">
        No order data yet
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ status, percent }) =>
              `${status} ${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
