"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Sector,
} from "recharts";

type RevenueItem = {
  id: string;
  name: string;
  revenue: number;
};

type Props = {
  // component now expects aggregated revenue per room type
  roomTypes?: RevenueItem[]; // revenue per room type
  height?: number;
};

const DEFAULT_ROOM_TYPES: RevenueItem[] = [
  { id: "t1", name: "Standard", revenue: 18_000 },
  { id: "t2", name: "Deluxe", revenue: 6_400 },
  { id: "t3", name: "Suite", revenue: 2_000 },
];

const COLORS = [
  "#6366f1",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#7c3aed",
  "#ec4899",
];

export default function PiechartPercentageOfRevenueComeFrom({
  roomTypes = DEFAULT_ROOM_TYPES,
  height = 260,
}: Props) {
  // component now shows only room type aggregated revenue
  const data = useMemo(() => roomTypes, [roomTypes]);

  const total = useMemo(
    () => data.reduce((s, d) => s + Math.max(0, d.revenue), 0),
    [data]
  );

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        value: d.revenue,
        percent: total > 0 ? (d.revenue / total) * 100 : 0,
      })),
    [data, total]
  );

  const vndFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
      value,
    } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#111827"
          fontSize={13}
          fontWeight={600}
        >
          {payload.name}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#6b7280"
          fontSize={12}
          fontWeight={500}
        >
          {`${percent.toFixed(1)}% — ${vndFormatter.format(Number(value) || 0)}`}
        </text>
      </g>
    );
  };

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <Card className="p-4">
      <div className="flex gap-4 items-start">
        <div style={{ width: 360, height }}>
          {total <= 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No revenue data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={4}
                  activeIndex={activeIndex ?? undefined}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  isAnimationActive={false}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value: number) => vndFormatter.format(Number(value) || 0)}
                  itemStyle={{ color: "#111827", fontSize: 13, fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sidebar: Legend */}
        <div className="flex flex-col gap-4 @container/card w-full">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Room type</span>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-2">Percentage of total revenue</div>

            <div className="flex flex-col gap-2">
              {chartData.map((d, i) => (
                <div key={d.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        background: COLORS[i % COLORS.length],
                        borderRadius: 4,
                        display: "inline-block",
                      }}
                    />
                    <div className="text-sm">
                      <div className="font-medium" style={{ fontSize: 13, fontWeight: 600 }}>
                        {d.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{vndFormatter.format(d.revenue)}</div>
                    </div>
                  </div>

                  <div className="text-sm font-medium" style={{ fontSize: 13, fontWeight: 600 }}>
                    {d.percent ? `${d.percent.toFixed(1)}%` : "0%"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}