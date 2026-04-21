import { ChartAreaInteractive } from "../tmp-components/chart-area-interactive";
import PiechartPctRevenueBookingsRatings from "./piechart-pct-revenue-bookings-ratings";
import RatingDistribution from "./rating-distribution";

import { hotelowner_getRatingDistribution } from "@/lib/actions/hotel-manager/analytics";

export default async function HotelManagerStatisticsPage() {
  const dist = await hotelowner_getRatingDistribution();
  const data = [1, 2, 3, 4, 5].map((r) => ({ rating: String(r), count: dist[r] ?? 0 }));

  return (
    <main className="flex flex-col gap-y-6">
      <section>
        <ChartAreaInteractive />
      </section>

      <div className="flex flex-col gap-y-6 lg:flex-row lg:items-start lg:gap-x-6">
        <section className="flex-1">
          <PiechartPctRevenueBookingsRatings />
        </section>

        <section className="flex-1">
          <RatingDistribution data={data} />
        </section>
      </div>
    </main>
  );
}