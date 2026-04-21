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

type DataPoint = { rating: string; count: number };

export default function RatingDistribution({ data }: { data: DataPoint[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

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
                  dataKey="rating"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-primary-foreground)", fontSize: 12 }}
                  padding={{ left: 12, right: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-secondary-foreground)", fontSize: 12 }}
                  width={34}
                  domain={[0, Math.ceil(maxCount * 1.2)]}
                />
                <Tooltip
                  formatter={(value: number) => [value, "Count"]}
                  labelFormatter={(label: string) => `Rating ${label}`}
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--color-secondary-foreground)" }}
                  // isAnimationActive={false}
                />

                <Bar dataKey="count" radius={[6, 6, 6, 6]} fill="var(--color-accent-foreground)" minPointSize={2} isAnimationActive={false}>
                  <LabelList dataKey="count" position="top" style={{ fill: "var(--color-accent-foreground)", fontSize: 12 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}