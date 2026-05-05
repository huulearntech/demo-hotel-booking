"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowRight } from "lucide-react";

import type { BookingRow } from "@/lib/actions/hotel-manager/bookings";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import { BOOKING_STATUS_BADGE_COLORS } from "@/lib/constants";

function formatDateShort(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", { year: "numeric", month: "short", day: "numeric" }).format(date);
}


export const columns: ColumnDef<BookingRow>[] = [
  {
    id: "customer",
    header: "Khách hàng",
    accessorKey: "customerName",
    cell: ({ row }) => (
      <div className="min-w-0">
        <div className="truncate font-medium">{row.original.customerName}</div>
        <div className="text-xs text-muted-foreground truncate">{row.original.customerEmail}</div>
      </div>
    )
  },
  {
    id: "contact",
    header: "Liên hệ",
    accessorKey: "customerPhone",
    cell: ({ row }) => <div className="text-sm truncate"> {row.original.customerPhone} </div>
  },
  {
    id: "roomType",
    header: "Loại phòng",
    accessorKey: "roomTypeName",
    cell: ({ row }) => (
      <div>
        <div className="truncate text-sm">{row.original.roomTypeName}</div>
        <div className="text-xs text-muted-foreground">{row.original.numRooms} phòng</div>
      </div>
    )
  },
  {
    id: "checkinCheckout",
    header: () => <div className="inline-flex gap-1 items-center">Nhận phòng <ArrowRight className="size-4"/> Trả phòng</div>,
    cell: ({ row }) => {
      const checkIn = row.original.checkInDate;
      const checkOut = row.original.checkOutDate;
      const nights = differenceInDays(checkOut, checkIn);
      return (
        <div className="min-w-0">
          <div className="inline-flex gap-1 items-center">
            <div className="truncate">{formatDateShort(checkIn)}</div>
            <ArrowRight className="size-4" />
            <div className="truncate">{formatDateShort(checkOut)}</div>
          </div>
          <div className="text-xs text-muted-foreground">{nights} đêm</div>
        </div>
      )
    }
  },
  {
    id: "guests",
    header: "Lượng khách",
    cell: ({ row }) => (
      <div>
        <div className="text-sm">{row.original.numAdults} khách người lớn</div>
        {row.original.numChildren > 0 && (
          <div className="text-muted-foreground">{row.original.numChildren} khách trẻ em</div>
        )}
      </div>
    )
  },
  {
    id: "notes",
    accessorKey: "notes",
    header: "Ghi chú",
    cell: ({ row }) => <div className="truncate text-sm">{row.original.notes}</div>
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      return (
        <span className={cn(
          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
          BOOKING_STATUS_BADGE_COLORS[row.original.status].variant
        )}>
          {BOOKING_STATUS_BADGE_COLORS[row.original.status].text}
        </span>
      )
    }
  },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => {
      const booking = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="size-8">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs text-secondary-foreground">Hành động</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(booking.id)}>
              <div className="flex flex-col gap-1">
                Sao chép mã đặt phòng
                <div className="truncate font-mono text-xs">{row.original.id}</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {/* view booking */}}>Xem chi tiết đặt phòng</DropdownMenuItem>
            <DropdownMenuItem onClick={() => {/* confirm booking */}}>Xác nhận đặt phòng</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  },
];
