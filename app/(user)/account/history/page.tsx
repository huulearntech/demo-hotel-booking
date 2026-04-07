import { notFound } from "next/navigation";
import BookingsTable from "./bookings-table";
import { user_getRecentBookings } from "@/lib/actions/user-account";


export default async function AccountHistoryPage() {
  const result = await user_getRecentBookings();
  if (!result.ok) {
    // TODO: Handle error properly
    notFound();
  }
  const bookings = result.data;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Booking history</h1>
        <p className="text-sm text-muted-foreground">
          All your past and upcoming bookings. Use the search to filter by hotel or booking id.
        </p>
      </div>
      <BookingsTable bookings={bookings}/>
    </div>
  );
}