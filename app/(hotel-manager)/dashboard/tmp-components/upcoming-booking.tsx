import { DataTable } from "@/components/data-table";
import { columns } from "./booking-columns";
import { hotelowner_getBookings } from "@/lib/actions/hotel-manager/bookings";

import { Skeleton } from "@/components/ui/skeleton";

export default async function UpcomingBooking() {
  const response = await hotelowner_getBookings("upcoming");
  // TODO: server-side pagination.
  return (
    <DataTable columns={columns} data={response.items} />
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