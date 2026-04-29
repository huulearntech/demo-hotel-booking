import { ChartAreaInteractive } from "../tmp-components/chart-area-interactive";
import PiechartPctRevenueBookingsRatings from "./piechart-pct-revenue-bookings-ratings";
import RatingDistribution from "./rating-distribution";
import { hotelowner_getRatingDistribution } from "@/lib/actions/hotel-manager/analytics";

export default async function HotelManagerStatisticsPage() {
  const data = await hotelowner_getRatingDistribution();

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