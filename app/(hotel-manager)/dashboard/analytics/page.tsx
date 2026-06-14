import { hotelowner_getRatingDistribution } from "@/lib/actions/hotel-manager/analytics";
import { ChartAreaInteractive } from "../tmp-components/chart-area-interactive";
import PiechartPctRevenueBookingsRatings from "./piechart-pct-revenue-bookings-ratings";
import RatingDistribution from "./rating-distribution";
import { Suspense } from "react";

export default async function HotelManagerStatisticsPage() {
  const data = await hotelowner_getRatingDistribution();

  return (
    <main className="flex flex-col gap-y-6">
      <section>
        <Suspense fallback={<ChartAreaInteractiveSkeleton />}>
          <ChartAreaInteractive />
        </Suspense>
      </section>

      <div className="flex flex-col gap-y-6 lg:flex-row lg:items-start lg:gap-x-6">
        <section className="flex-1">
          <Suspense fallback={<PiechartPctRevenueBookingsRatingsSkeleton />}>
            <PiechartPctRevenueBookingsRatings />
          </Suspense>
        </section>

        <section className="flex-1">
          <Suspense fallback={<RatingDistributionSkeleton />}>
            <RatingDistribution data={data} />
          </Suspense>
        </section>
      </div>
    </main>
  );
}

const ChartAreaInteractiveSkeleton = () => (
  <div className="h-80 rounded-3xl border border-slate-200 bg-slate-50 p-6 animate-pulse" />
);

const PiechartPctRevenueBookingsRatingsSkeleton = () => (
  <div className="h-80 rounded-3xl border border-slate-200 bg-slate-50 p-6 animate-pulse" />
);

const RatingDistributionSkeleton = () => (
  <div className="h-80 rounded-3xl border border-slate-200 bg-slate-50 p-6 animate-pulse" />
);