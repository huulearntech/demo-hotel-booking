"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { type RecentBookingType } from "@/lib/actions/user-account";
import { ArrowRightIcon } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { text: string; variant: string }> = {
    PENDING: { text: "Pending", variant: "bg-yellow-100 text-yellow-800" },
    CONFIRMED: { text: "Confirmed", variant: "bg-green-100 text-green-800" },
    COMPLETED: { text: "Completed", variant: "bg-sky-100 text-sky-800" },
    CANCELLED: { text: "Cancelled", variant: "bg-red-100 text-red-800" },
  };
  const s = map[status] ?? { text: status, variant: "bg-gray-100 text-gray-800" };
  return <span className={`px-2 py-1 rounded-md text-xs font-medium ${s.variant}`}>{s.text}</span>;
}


const columns: ColumnDef<RecentBookingType>[] = [
  {
    id: "booking",
    header: "Booking",
    accessorFn: (row) => row.id,
    cell: ({ row }) => (
      <div>
        <div className="text-sm font-medium">{row.original.id}</div>
        <div className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleString()}</div>
      </div>
    ),
  },
  {
    id: "hotel",
    header: "Hotel",
    accessorKey: "hotelName",
    cell: ({ row }) => <div className="font-medium">{row.original.metadata.hotel.name}</div>,
  },
  {
    id: "dates",
    header: "Dates",
    cell: ({ row }) => (
      <div className="text-sm inline-flex items-center gap-1">
        {new Intl.DateTimeFormat('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(new Date(row.original.metadata.checkInDate))}
        <ArrowRightIcon className="size-4" />
        {new Intl.DateTimeFormat('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(new Date(row.original.metadata.checkOutDate))} 
      </div>
    ),
  },
  // {
  //   id: "guests",
  //   header: "Guests / Room",
  //   accessorFn: (row) => row.guests,
  //   cell: ({ row }) => (
  //     <div className="text-sm">
  //       {row.original.guests} guest{row.original.guests > 1 ? "s" : ""} • {row.original.roomType}
  //     </div>
  //   ),
  // },
  {
    id: "price",
    header: "Price",
    accessorKey: "totalPrice",
    cell: ({ row }) => <div className="text-sm font-medium">${row.original.totalPrice.toFixed(2)}</div>,
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  // {
  //   id: "actions",
  //   header: "Actions",
  //   cell: ({ row }) => (
  //     <div className="flex justify-end gap-2">
  //       <Link href={`/account/bookings/${row.original.id}`}>
  //         <Button variant="ghost" size="sm">View</Button>
  //       </Link>
  //       {row.original.status === "CONFIRMED" && (
  //         <form method="post" action={`/api/bookings/${row.original.id}/cancel`}>
  //           <Button type="submit" size="sm" variant="destructive">Cancel</Button>
  //         </form>
  //       )}
  //     </div>
  //   ),
  // },
];


export default function BookingsTable({
  bookings,
}: {
  bookings: RecentBookingType[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your bookings</span>
          <span className="text-sm text-muted-foreground">{bookings.length} result(s)</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {bookings.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No bookings found. Try clearing filters or make a booking.
          </div>
        ) : (
          <DataTable columns={columns} data={bookings} />
        )}
      </CardContent>
    </Card>
  );
}