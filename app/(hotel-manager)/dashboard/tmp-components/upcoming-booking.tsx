import { DataTable } from "@/components/data-table";
import { columns } from "./upcoming-booking-columns";
import { tmp_hotelowner_getUpcomingBookings } from "@/lib/actions/hotel-manager/bookings";

import { Skeleton } from "@/components/ui/skeleton";

export default async function UpcomingBooking() {
  const upcomingBookings = await tmp_hotelowner_getUpcomingBookings();
  return (
    <DataTable columns={columns} data={upcomingBookings} />
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