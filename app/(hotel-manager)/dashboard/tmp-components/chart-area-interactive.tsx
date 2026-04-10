// TODO: Fix AI generated slops in the chart tooltip component.

"use client"

import { useState, useEffect } from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { fetchLast90DaysRevenueAndNumberOfBookings } from "@/lib/actions/hotel-manager/analytics"

type TimeRangeOptions = "90d" | "30d" | "7d";
const timeRangeValues: Record<TimeRangeOptions, number> = {
  "90d": 90,
  "30d": 30,
  "7d": 7,
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--color-blue-500)",
  },
  numberOfBookings: {
    label: "Bookings",
    color: "var(--color-red-500)",
  },
} satisfies ChartConfig

type ChartDataItem = Awaited<ReturnType<typeof fetchLast90DaysRevenueAndNumberOfBookings>>[number];

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = useState<TimeRangeOptions>("90d")
  const [chartData, setChartData] = useState<ChartDataItem[]>([])

  useEffect(() => {
    let mounted = true
    async function fetchData() {
      try {
        const data = await fetchLast90DaysRevenueAndNumberOfBookings();
        if (mounted) setChartData(data)
      } catch (e) {
        // swallow or log as needed
        // console.error(e)
      }
    }
    fetchData()
    return () => {
      mounted = false
    }
  }, []);

  useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const sliceStart = Math.max(0, chartData.length - timeRangeValues[timeRange])
  const dataInTimeRange = chartData.slice(sliceStart)


  // Vietnamese formatters
  const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
    month: "short",
    day: "numeric",
  })

  const bookingsCompactFormatter = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
    notation: "compact",
    compactDisplay: "short",
  })
  const bookingsFullFormatter = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  })

  const currencyCompactFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 1,
    notation: "compact",
    compactDisplay: "short",
  })
  const currencyFullFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Doanh thu và lượt đặt phòng</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Tổng doanh thu và lượt đặt phòng trong {
              timeRange === "90d" ? "3 tháng qua"
                : timeRange === "30d" ? "30 ngày qua"
                  : "7 ngày qua"
            }
          </span>
          <span className="@[540px]/card:hidden">{
              timeRange === "90d" ? "3 tháng qua"
                : timeRange === "30d" ? "30 ngày qua"
                  : "7 ngày qua"
          }</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRangeOptions)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">3 tháng qua</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 ngày qua</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 ngày qua</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRangeOptions)}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Lựa chọn khoảng thời gian"
            >
              <SelectValue placeholder="3 tháng qua" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                3 tháng qua
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 ngày qua
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                7 ngày qua
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-64 w-full"
        >
          <LineChart data={dataInTimeRange}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => dateFormatter.format(value)}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const n = Number(value)
                if (Number.isNaN(n)) return String(value)
                if (n >= 1000) return bookingsCompactFormatter.format(n)
                return bookingsFullFormatter.format(n)
              }}
              label={{ value: "Lượt đặt phòng", angle: -90, position: "insideLeft", offset: 10 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={80}
              tickFormatter={(value) => {
                const n = Number(value)
                if (Number.isNaN(n)) return String(value)
                // if (n >= 1_000_000) return currencyCompactFormatter.format(n)
                return currencyCompactFormatter.format(n)
              }}
              label={{ value: "Doanh thu", angle: 90, position: "insideRight", offset: 10 }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value: any) => {
                    const safeParseDate = (v: any): Date | null => {
                      if (v instanceof Date && !Number.isNaN(v.getTime())) return v
                      // If it's a numeric timestamp or numeric string
                      const asNumber = typeof v === "number" ? v : Number(v)
                      if (!Number.isNaN(asNumber)) {
                        const d = new Date(asNumber)
                        if (!Number.isNaN(d.getTime())) return d
                      }
                      // Try Date.parse on string
                      const parsed = Date.parse(String(v))
                      if (!Number.isNaN(parsed)) return new Date(parsed)
                      return null
                    }

                    const d = safeParseDate(value)
                    return d ? dateFormatter.format(d) : String(value ?? "")
                  }}
                  formatter={(value, name) => {
                    const key = String(name) as keyof typeof chartConfig
                    const label = chartConfig?.[key]?.label ?? String(name)

                    if (key === "numberOfBookings") {
                      const n = Number(value) || 0
                      const formatted = n >= 1000 ? bookingsCompactFormatter.format(n) : bookingsFullFormatter.format(n)
                      return [formatted, label]
                    }

                    if (key === "revenue") {
                      const n = Number(value) || 0
                      const formatted = n >= 1_000_000
                        ? currencyCompactFormatter.format(n)
                        : currencyFullFormatter.format(n)
                      return [formatted, label]
                    }

                    return [String(value), label]
                  }}
                  indicator="dot"
                />
              }
              isAnimationActive={false}
            />
            <Line
              yAxisId="left"
              dataKey="numberOfBookings"
              type="monotone"
              stroke="var(--color-red-500)"
              strokeWidth={2}
              dot={{ r: 1 }}
              activeDot={{ r: 2 }}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              dataKey="revenue"
              type="monotone"
              stroke="var(--color-blue-500)"
              strokeWidth={2}
              dot={{ r: 1 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}