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

import type { UpcomingBooking } from "@/lib/actions/hotel-manager/bookings";
import { BookingStatus } from "@/lib/generated/prisma/enums";
import { cn, formatVND } from "@/lib/utils";
import { differenceInDays } from "date-fns";

function formatDateShort(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

// TODO: export this
const map: Record<BookingStatus, { text: string; variant: string }> = {
  PENDING_TO_PAY: { text: "Đang chờ", variant: "bg-yellow-100 text-yellow-800" },
  PAID: { text: "Đã thanh toán", variant: "bg-green-100 text-green-800" },
  CHECKED_IN: { text: "Đã nhận phòng", variant: "bg-sky-100 text-sky-800" },
  CHECKED_OUT: { text: "Đã trả phòng", variant: "bg-sky-100 text-sky-800" },
  CANCELLED: { text: "Đã huỷ", variant: "bg-red-100 text-red-800" },
};

export const columns: ColumnDef<UpcomingBooking>[] = [
  {
    id: "customer",
    header: "Khách hàng",
    accessorFn: (row) => row.customerName,
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
    accessorFn: (row) => row.customerPhone,
    cell: ({ row }) => <div className="text-sm truncate"> {row.original.customerPhone} </div>
  },
  {
    id: "roomType",
    header: "Loại phòng",
    accessorFn: (row) => row.roomTypeName,
    cell: ({ row }) => <div className="truncate">{row.original.roomTypeName}</div>
  },
  {
    id: "roomsGuests",
    header: "Phòng / Khách",
    cell: ({ row }) => (
      <div className="text-sm">
        <div>{row.original.numRooms} phòng</div>
        <div className="text-muted-foreground text-xs">{row.original.numAdults} khách người lớn</div>
        {row.original.numChildren > 0 && (
          <div className="text-muted-foreground text-xs">{row.original.numChildren} khách trẻ em</div>
        )}
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
    id: "price",
    accessorKey: "totalPrice",
    header: () => <div className="text-right">Giá</div>,
    cell: ({ row }) => {
      return <div className="text-right font-medium">{formatVND(row.original.totalPrice)}</div>
    }
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      return (
        <span className={cn(
          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
          map[row.original.status].variant
        )}>
          {map[row.original.status].text}
        </span>
      )
    }
  },
  {
    accessorKey: "notes",
    header: "Ghi chú",
    cell: ({ row }) => <div className="truncate text-sm">{row.original.notes}</div>
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
            <DropdownMenuItem onClick={() => {/* view customer */}}>Xem khách hàng</DropdownMenuItem>
            <DropdownMenuItem onClick={() => {/* view booking */}}>Xem chi tiết đặt phòng</DropdownMenuItem>
            <DropdownMenuItem onClick={() => {/* message customer */}}>Nhắn khách</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {/* confirm booking */}}>Xác nhận đặt phòng</DropdownMenuItem>
            <DropdownMenuItem onClick={() => {/* cancel booking */}}>Hủy đặt phòng</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
];
