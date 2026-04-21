"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
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

import {
  fetchRevenueByRoomTypeLast90Days,
  fetchBookingsCountByRoomTypeLast90Days,
  fetchAvgRatingByRoomTypeLast90Days,
} from "./tmp-actions";

type ServerItem = {
  id: string;
  name: string;
  revenue?: number;
  bookings?: number;
  rating?: number;
};

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

type Mode = "revenue" | "bookings" | "ratings";

export default function PiechartPctRevenueBookingsRatings({
  height = 260,
}: {
  height?: number;
}) {
  // mode toggle
  const [mode, setMode] = useState<Mode>("revenue");

  // source data as returned by server actions (ServerItem[]). We normalize to RevenueItem shape
  const [sourceRoomTypes, setSourceRoomTypes] = useState<ServerItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // fetch data when mode changes
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        let res: ServerItem[] = [];
        if (mode === "revenue") {
          const rows = await fetchRevenueByRoomTypeLast90Days();
          res = rows.map((r: any) => ({
            id: String(r.roomTypeName),
            name: r.roomTypeName,
            revenue: Number(r.totalRevenue || 0),
          }));
        } else if (mode === "bookings") {
          const rows = await fetchBookingsCountByRoomTypeLast90Days();
          res = rows.map((r: any) => ({
            id: String(r.roomTypeName),
            name: r.roomTypeName,
            bookings: Number(r.bookingsCount || 0),
          }));
        } else if (mode === "ratings") {
          const rows = await fetchAvgRatingByRoomTypeLast90Days();
          res = rows.map((r: any) => ({
            id: String(r.roomTypeName),
            name: r.roomTypeName,
            rating: r.avgRating !== null ? Number(r.avgRating) : 0,
            ratingsCount: r.ratingCount,
          }));
        }

        if (!mounted) return;

        setSourceRoomTypes(
          res.map((r) => ({
            // include all server fields first to avoid duplicate literal keys,
            // then override/ensure the computed 'revenue' value is set from available numeric keys
            ...r,
            // keep all numeric fields on the server item so we can map later
            revenue: r.revenue ?? r.bookings ?? r.rating ?? 0,
          }))
        );
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message ?? "Failed to load data");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [mode]);

  // decide which numeric key to use as chart value based on mode
  const valueKey: keyof ServerItem =
    mode === "revenue"
      ? "revenue"
      : mode === "bookings"
      ? "bookings"
      : "rating";

  const data = useMemo(() => sourceRoomTypes, [sourceRoomTypes]);

  const total = useMemo(
    () =>
      data.reduce(
        (s, d) => s + Math.max(0, Number((d as any)[valueKey]) || 0),
        0
      ),
    [data, valueKey]
  );

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        id: d.id,
        name: d.name,
        value: Number((d as any)[valueKey]) || 0,
        percent: total > 0 ? (Number((d as any)[valueKey]) / total) * 100 : 0,
      })),
    [data, total, valueKey]
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const formatTooltip = (value: number) => {
    if (mode === "revenue") return vndFormatter.format(Number(value) || 0);
    if (mode === "bookings") return `${Number(value || 0).toLocaleString()}`;
    // ratings: show one decimal
    return Number(value || 0).toFixed(1);
  };

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Phần trăm theo loại phòng</CardTitle>
        <CardDescription>
          {mode === "revenue"
            ? "Tỷ lệ doanh thu theo loại phòng trong 90 ngày qua"
            : mode === "bookings"
            ? "Tỷ lệ lượt đặt phòng theo loại phòng trong 90 ngày qua"
            : "Tỷ lệ đánh giá trung bình theo loại phòng trong 90 ngày qua"}
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-3">
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(v) => v && setMode(v as Mode)}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
            >
              <ToggleGroupItem value="revenue">Revenue</ToggleGroupItem>
              <ToggleGroupItem value="bookings">Bookings</ToggleGroupItem>
              <ToggleGroupItem value="ratings">Ratings</ToggleGroupItem>
            </ToggleGroup>

            <Select
              value={mode}
              onValueChange={(value) => setMode(value as Mode)}
            >
              <SelectTrigger
                className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                size="sm"
                aria-label="Lựa chọn mode"
              >
                <SelectValue placeholder="Revenue" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="revenue" className="rounded-lg">
                  Doanh thu
                </SelectItem>
                <SelectItem value="bookings" className="rounded-lg">
                  Lượt đặt phòng
                </SelectItem>
                <SelectItem value="ratings" className="rounded-lg">
                  Đánh giá
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="flex gap-4 items-start">
          <div style={{ width: 360, height }}>
            <div className="flex items-center justify-between mb-3">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : error ? (
                <div className="text-sm text-destructive">{error}</div>
              ) : null}
            </div>

            {total <= 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No data
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
                      <Cell key={i} fill={`var(--chart-${i % 5 + 1})`} />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value: number) => formatTooltip(Number(value))}
                    itemStyle={{ color: "#111827", fontSize: 13, fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Sidebar: Legend */}
          <div className="flex flex-col gap-4 @container/card w-full">
              <div className="flex flex-col gap-2">
                {chartData.map((d, i) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          background: `var(--chart-${i % 5 + 1})`,
                          borderRadius: 4,
                          display: "inline-block",
                        }}
                      />
                      <div className="text-sm">
                        <div
                          className="font-medium"
                          style={{ fontSize: 13, fontWeight: 600 }}
                        >
                          {d.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {mode === "revenue"
                            ? vndFormatter.format(d.value)
                            : mode === "bookings"
                            ? Number(d.value).toLocaleString()
                            : Number(d.value).toFixed(1)}
                        </div>
                      </div>
                    </div>

                    <div
                      className="text-sm font-medium"
                      style={{ fontSize: 13, fontWeight: 600 }}
                    >
                      {d.percent ? `${d.percent.toFixed(1)}%` : "0%"}
                    </div>
                  </div>
                ))}
              </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}