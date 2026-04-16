import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";

// TODO: Cleanup
type Trend = {
  value: number;
  isPercent?: boolean;
};

type MetricItem = {
  id: string;
  title: string;
  value: number;
  valueType: "integer" | "percent" | "currency";
  trend?: Trend;
};

type MetricCardProps = {
  title: string;
  value: React.ReactNode;
  trend?: Trend;
};

function formatMetricValue(value: number, type: MetricItem["valueType"]) {
  if (type === "currency") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (type === "percent") {
    // value is a fraction, e.g. 0.74 => 74%
    return new Intl.NumberFormat("vi-VN", {
      style: "percent",
      maximumFractionDigits: 0,
    }).format(value);
  }

  // integer / general number
  return new Intl.NumberFormat("vi-VN").format(value);
}

function MetricCard({ title, value, trend }: MetricCardProps) {
  const trendIsIncreasing = trend ? trend.value > 0 : false;

  const renderTrend = (t?: Trend) => {
    if (!t) return null;
    const sign = t.value > 0 ? "+" : t.value < 0 ? "-" : ""; // use proper minus sign
    const text = t.isPercent
      ? `${sign}${Math.round(t.value * 100)}%`
      : `${sign}${Math.abs(t.value)}`;
    return (
      <Badge variant="outline" className="flex items-center gap-2">
        {trendIsIncreasing ? <TrendingUpIcon /> : <TrendingDownIcon />}
        {text}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle>
          {value}
        </CardTitle>
        <CardAction>{renderTrend(trend)}</CardAction>
      </CardHeader>
      <CardFooter className="text-xs text-gray-500">Thông tin cập nhật theo thời gian thực</CardFooter>
    </Card>
  );
}

const metrics: MetricItem[] = [
  {
    id: "checkins",
    title: "Lượt khách check-in hôm nay",
    value: 8,
    valueType: "integer",
    trend: { value: 2 },
  },
  {
    id: "occupancy",
    title: "Tỷ lệ lấp phòng",
    value: 0.74,
    valueType: "percent",
    trend: { value: 0.03, isPercent: true },
  },
  {
    id: "bookings",
    title: "Lượt đặt phòng hôm nay",
    value: 12,
    valueType: "integer",
    trend: { value: -1 },
  },
  {
    id: "revenueMTD",
    title: "Doanh thu (từ đầu tháng)",
    value: 24300000,
    valueType: "currency",
    trend: { value: 0.12, isPercent: true },
  },
];

export default function DashboardMetricCards() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <MetricCard
          key={m.id}
          title={m.title}
          value={formatMetricValue(m.value, m.valueType)}
          trend={m.trend}
        />
      ))}
    </section>
  );
}