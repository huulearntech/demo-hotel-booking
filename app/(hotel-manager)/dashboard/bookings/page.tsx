import { Suspense } from "react";
import BookingsTable from "./booking-table";

export default function HotelManagerDashboardBookingsPage() {
  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex justify-between gap-2">
        <header className="flex flex-col gap-2">
          <h1 className="font-semibold">Danh sách lượt đặt phòng</h1>
          <p className="text-sm text-muted-foreground">Quản lý các lượt đặt phòng của khách hàng tại khách sạn của bạn.</p>
        </header>
      </div>

      <Suspense fallback={<div>Đang tải...</div>} >
        <BookingsTable />
      </Suspense>
    </div>
  );
}