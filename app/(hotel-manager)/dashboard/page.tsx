import RoomTypesOccupancyPctBoard from "./room-types-occupancy-pct-board";
import UpcomingBooking, { UpcomingBookingSkeleton } from "./tmp-components/upcoming-booking";

import { ChartAreaInteractive as RevenueChart } from "./tmp-components/chart-area-interactive";
import DashboardMetricCards from "./section-metric-cards";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <main className="flex flex-col gap-y-6">
      <DashboardMetricCards />
      <section className="flex flex-col gap-y-4">
        <RevenueChart />
      </section>

      <section className="flex flex-col gap-y-4">
        <h2 className="font-semibold"> Lượt đặt phòng sắp tới </h2>
        <Suspense fallback={<UpcomingBookingSkeleton />} >
          <UpcomingBooking />
        </Suspense>
      </section>

      <section className="flex flex-col gap-y-4">
        <h2 className="font-semibold"> Trạng thái các loại phòng </h2>
        <RoomTypesOccupancyPctBoard />
      </section>
    </main>
  );
}