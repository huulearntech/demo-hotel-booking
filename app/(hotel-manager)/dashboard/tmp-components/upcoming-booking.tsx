import { DataTable } from "@/components/data-table";
import { columns } from "./booking-columns";
import { hotelowner_getUpcomingBookings } from "@/lib/actions/hotel-manager/bookings";

import { Skeleton } from "@/components/ui/skeleton";

export default async function UpcomingBooking() {
  const response = await hotelowner_getUpcomingBookings();
  // TODO: More specific
  if (!response.ok) {
    return (
      <div className="text-center text-destructive mt-10">
        <p className="text-lg">Lỗi khi tải danh sách đặt phòng sắp tới.</p>
        <p className="text-sm">{response.error ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.'}</p>
      </div>
    );
  }

  return (
    <DataTable columns={columns} data={response.data} />
  );
}

export function UpcomingBookingSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}