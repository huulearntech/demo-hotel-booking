import { ChartAreaInteractive } from "../tmp-components/chart-area-interactive";
import { DashboardCharts } from "./charts";
import PiechartPercentageOfRevenueComeFrom from "./piechart-percentage-of-revenue-come-from";
import RatingDistribution from "./rating-distribution";

import { hotelowner_getRatingDistribution } from "@/lib/actions/hotel-manager/analytics";

export default async function HotelManagerStatisticsPage() {
  const dist = await hotelowner_getRatingDistribution();

  // normalize to array of { rating: '1'..'5', count }
  const data = [1, 2, 3, 4, 5].map((r) => ({ rating: String(r), count: dist[r] ?? 0 }));
  return (
    <>
      <ChartAreaInteractive />
      <DashboardCharts />
      <PiechartPercentageOfRevenueComeFrom />
      <RatingDistribution data={data} />
    </>
  );
}