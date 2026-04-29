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

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { hotelowner_getRatingCountGroupedByStars } from "@/lib/generated/prisma/sql";

export default function RatingDistribution({ data }: { data: hotelowner_getRatingCountGroupedByStars.Result[] }) {
  const maxCount = Math.max(...data.map((d) => d.count ?? 0), 1);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Phân bố điểm đánh giá</CardTitle>
        <CardDescription>Dữ liệu dựa trên đánh giá của khách hàng</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="h-44">
          <div className="h-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--color-secondary-foreground)" strokeOpacity={0.12} />
                <XAxis
                  dataKey="star"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  tickFormatter={(value) => `${value} sao`}
                  padding={{ left: 12, right: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  width={34}
                  domain={[0, Math.ceil(maxCount * 1.2)]}
                />
                <Tooltip content={<RatingTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />

                <Bar dataKey="count" radius={[6, 6, 6, 6]} fill="var(--color-primary)" minPointSize={2} isAnimationActive={false}>
                  <LabelList dataKey="count" position="top" style={{ fill: "var(--color-primary)", fontSize: 12 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Custom tooltip for rating distribution (matches layout/style of ChartAreaInteractive.CustomTooltip)
function RatingTooltip(props: any) {
  const { active, payload, label } = props;
  if (!active || !payload || !payload.length) return null;

  const value = payload[0]?.value ?? 0;
  // const color = payload[0]?.fill ?? payload[0]?.color ?? '#000';
  const labelText = `${String(label ?? '')} sao`;

  return (
    <div className="bg-white/95 text-slate-900 text-sm rounded-md shadow-md p-2 min-w-40">
      <div className="text-xs text-slate-500 mb-1">{labelText}</div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* <span
            aria-hidden
            className="inline-block rounded-full"
            style={{ width: 10, height: 10, background: color }}
          /> */}
          <span className="truncate text-sm text-slate-700">Số lượng</span>
        </div>
        <div className="text-sm font-medium text-slate-900 whitespace-nowrap">{Number(value).toLocaleString()}</div>
      </div>
    </div>
  );
}