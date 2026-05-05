import { Suspense } from "react";
import BookingsTable from "./booking-table";

export default function HotelManagerDashboardBookingsPage() {
  return (
    <div className="flex flex-col gap-y-6">
      <Suspense fallback={<div>Đang tải...</div>} >
        <BookingsTable />
      </Suspense>
    </div>
  );
}