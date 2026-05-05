// TODO: Cleanup AI shit
"use client";

import { useMemo, useState } from "react";
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

import { useQuery } from "@tanstack/react-query";

import {
  fetchRevenueByRoomTypeLast90Days,
  fetchBookingsCountByRoomTypeLast90Days,
} from "@/lib/actions/hotel-manager/analytics";

type ServerItem = {
  id: string;
  name: string;
  totalRevenue?: number;
  bookings?: number;
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

type Mode = "totalRevenue" | "bookings";

export default function PiechartPctRevenueBookings({
  height = 260,
}: {
  height?: number;
}) {
  // mode toggle
  const [mode, setMode] = useState<Mode>("totalRevenue");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Fetch + cache using React Query (v5) — use `select` to normalize and throw on server-side errors
  const {
    data: revRows = [],
    isLoading: loadingRev,
    isError: isErrorRev,
    error: errorRev,
  } = useQuery({
    queryKey: ["analytics", "revenue90"],
    queryFn: fetchRevenueByRoomTypeLast90Days,
    select: (res: any) => {
      if (!res?.ok) throw new Error(res?.error ?? "Failed to load revenue data");
      return res.data ?? [];
    },
  });

  const {
    data: bookingsRows = [],
    isLoading: loadingBookings,
    isError: isErrorBookings,
    error: errorBookings,
  } = useQuery({
    queryKey: ["analytics", "bookings90"],
    queryFn: fetchBookingsCountByRoomTypeLast90Days,
    select: (res: any) => {
      if (!res?.ok) throw new Error(res?.error ?? "Failed to load bookings data");
      return res.data ?? [];
    },
  });

  const loading = loadingRev || loadingBookings;

  // compose error message from react-query error states
  let error: string | null = null;
  if (isErrorRev && errorRev) {
    error = (errorRev as any)?.message ?? String(errorRev);
  }
  if (isErrorBookings && errorBookings) {
    error = error ?? (errorBookings as any)?.message ?? String(errorBookings);
  }

  // cached shape (derived from queries)
  const cached = useMemo(
    () => ({
      totalRevenue: (revRows as any[]).map((r: any) => ({
        id: String(r.roomTypeName ?? r.name ?? r.id),
        name: r.roomTypeName ?? r.name ?? String(r.id),
        totalRevenue: Number(r.totalRevenue ?? r.total_revenue ?? 0),
      })),
      bookings: (bookingsRows as any[]).map((r: any) => ({
        id: String(r.roomTypeName ?? r.roomTypeName ?? r.roomTypeId ?? r.id),
        name: r.roomTypeName ?? r.name ?? String(r.id),
        bookings: Number(r.bookingsCount ?? r.bookings ?? 0),
      })),
    }),
    [revRows, bookingsRows]
  );

  // derive sourceRoomTypes when cached data or mode changes
  const sourceRoomTypes = useMemo(() => {
    if (mode === "totalRevenue") {
      return cached.totalRevenue.map((r: any) => ({
        id: r.id,
        name: r.name,
        totalRevenue: r.totalRevenue ?? 0,
      }));
    } else if (mode === "bookings") {
      return cached.bookings.map((r: any) => ({
        id: r.id,
        name: r.name,
        bookings: r.bookings ?? 0,
      }));
    }
    return [];
  }, [cached, mode]);

  // decide which numeric key to use as chart value based on mode
  const valueKey = mode as keyof ServerItem;

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

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Phần trăm theo loại phòng</CardTitle>
        <CardDescription>
          {mode === "totalRevenue"
            ? "Tỷ lệ doanh thu theo loại phòng trong 90 ngày qua"
            : "Tỷ lệ lượt đặt phòng theo loại phòng trong 90 ngày qua"}
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
              <ToggleGroupItem value="totalRevenue">Doanh thu</ToggleGroupItem>
              <ToggleGroupItem value="bookings">Lượt đặt phòng</ToggleGroupItem>
            </ToggleGroup>

            <Select value={mode} onValueChange={(value) => setMode(value as Mode)}>
              <SelectTrigger
                className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                size="sm"
                aria-label="Lựa chọn mode"
              >
                <SelectValue placeholder="Revenue" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="totalRevenue" className="rounded-lg">
                  Doanh thu
                </SelectItem>
                <SelectItem value="bookings" className="rounded-lg">
                  Lượt đặt phòng
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
                    content={<PieTooltip mode={mode} />}
                    cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Sidebar: Legend (only top 5 items) */}
          {(() => {
            const topItems = chartData
              .map((d, i) => ({ ...d, _i: i }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 5);
            const remaining = Math.max(0, chartData.length - topItems.length);

            return (
              <div className="flex flex-col gap-4 @container/card w-full">
                <div className="flex flex-col gap-2">
                  {topItems.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            background: `var(--chart-${(d as any)._i % 5 + 1})`,
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
                            {mode === "totalRevenue"
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

                {remaining > 0 && (
                  <div className="text-xs text-muted-foreground">+{remaining} more</div>
                )}
              </div>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}

// Custom tooltip for pie chart (matches layout/style of ChartAreaInteractive.CustomTooltip)
function PieTooltip({ mode, ...props }: any) {
  const { active, payload, label } = props;
  if (!active || !payload || !payload.length) return null;

  const p = payload[0];
  const name = p?.name ?? (p && p.payload && p.payload.name) ?? label ?? '';
  const value = p?.value ?? 0;
  // const color = p?.fill ?? p?.color ?? '#000';

  let formattedValue = String(value);
  if (mode === 'totalRevenue') {
    formattedValue = vndFormatter.format(Number(value) || 0);
  } else if (mode === 'bookings') {
    formattedValue = `${Number(value || 0).toLocaleString()}`;
  } else {
    formattedValue = Number(value || 0).toFixed(1);
  }

  return (
    <div className="bg-white/95 text-slate-900 text-sm rounded-md shadow-md p-2 min-w-40">
      <div className="text-xs text-slate-500 mb-1">{String(name)}</div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* <span
            aria-hidden
            className="inline-block rounded-full"
            style={{ width: 10, height: 10, background: color }}
          /> */}
          <span className="truncate text-sm text-slate-700">{mode === 'totalRevenue' ? 'Doanh thu' : mode === 'bookings' ? 'Lượt đặt' : 'Đánh giá'}</span>
        </div>
        <div className="text-sm font-medium text-slate-900 whitespace-nowrap">{formattedValue}</div>
      </div>
    </div>
  );
}