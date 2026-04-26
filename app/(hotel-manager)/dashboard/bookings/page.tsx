import { Suspense } from "react";
import BookingsTable from "./booking-table";

export default function HotelManagerDashboardBookingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Danh sách lượt đặt phòng</h1>
      <Suspense fallback={<div>Đang tải...</div>} >
        <BookingsTable />
      </Suspense>
    </div>
  );
}