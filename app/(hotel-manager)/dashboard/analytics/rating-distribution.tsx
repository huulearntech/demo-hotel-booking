"use client";

import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Bar,
  Tooltip,
  CartesianGrid,
  LabelList,
} from "recharts";

type DataPoint = { rating: string; count: number };


export default function RatingDistribution({ data }: { data: DataPoint[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100">Rating distribution</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400">All time</p>
      </div>

      <div className="h-44">
        <div className="h-full flex items-center">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="rating"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#0f172a", fontSize: 12 }}
                padding={{ left: 12, right: 12 }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                width={34}
                domain={[0, Math.ceil(maxCount * 1.2)]}
              />
              <Tooltip
                formatter={(value: number) => [value, "Count"]}
                labelFormatter={(label: string) => `Rating ${label}`}
                contentStyle={{ borderRadius: 8, border: "1px solid #e6edf3" }}
              />

              <Bar dataKey="count" radius={[6, 6, 6, 6]} fill="#7c3aed" minPointSize={2}>
                <LabelList dataKey="count" position="top" style={{ fill: "#0f172a", fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
