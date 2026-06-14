"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowRight, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { BookingRow } from "@/lib/actions/hotel-manager/bookings";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import { BOOKING_STATUS_BADGE_COLORS } from "@/lib/constants";
import { Checkbox } from "@/components/ui/checkbox";
import {
  hotelowner_checkInBooking,
  hotelowner_checkOutBooking,
  hotelowner_cancelBooking,
  hotelowner_getAvailableRoomsForBooking,
} from "@/lib/actions/hotel-manager/bookings";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
      const bookingStatus = booking.status;
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

            {bookingStatus === "PAID" &&
              <>
                <DropdownMenuSeparator />
                <CheckInDialog booking={booking} />
                <DropdownMenuSeparator />
                <CancelBookingDialog booking={booking} />
              </>
            }
            {bookingStatus === "CHECKED_IN" &&
              <>
                <DropdownMenuSeparator />
                <CheckOutDialog booking={booking} />
              </>
            }
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  },
];


function CheckInDialog({ booking }: { booking: BookingRow }) {
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    data: availableRooms = [],
    isLoading: isLoadingRooms,
    isError: isRoomsError,
    error: roomsError,
    refetch,
  } = useQuery({
    queryKey: ["availableRoomsForBooking", booking.id],
    queryFn: async () => { return await hotelowner_getAvailableRoomsForBooking(booking.id) },
    enabled: Boolean(booking.id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const queryClient = useQueryClient();
  const {
    mutateAsync: checkInBooking,
    status,
    isError: isCheckInError,
    error: checkInError,
  } = useMutation<
    { assignedRoomIds: string[] },
    Error,
    string[],
    unknown
  >({
    mutationFn: (roomIds: string[]) => hotelowner_checkInBooking(booking.id, roomIds),
    onSuccess: () => {
      toast.success("Check-in thành công.");
      setSelectedRoomIds([]);
      setValidationError(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["hotelowner_bookings"] });
    },
  });

  const isAssigning = status === "pending";

  const closeDialog = () => {
    setSelectedRoomIds([]);
    setValidationError(null);
  };

  const toggleRoom = (roomId: string) => {
    setSelectedRoomIds((prev) => {
      if (prev.includes(roomId)) return prev.filter((id) => id !== roomId);
      if (prev.length >= booking.numRooms) return prev;
      return [...prev, roomId];
    });
  };

  const handleConfirm = async () => {
    if (selectedRoomIds.length !== booking.numRooms) {
      setValidationError(`Vui lòng chọn đúng ${booking.numRooms} phòng.`);
      return;
    }

    setValidationError(null);
    try {
      await checkInBooking(selectedRoomIds);
    } catch {
      // Error state is handled by react-query
    }
  };

  const roomErrorMessage = isRoomsError
    ? (roomsError as Error)?.message || "Không thể lấy danh sách phòng khả dụng."
    : null;

  const actionErrorMessage =
    validationError ||
    (isCheckInError
      ? (checkInError as Error)?.message || "Có lỗi xảy ra khi check-in. Vui lòng thử lại."
      : null);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        data-slot="dropdown-menu-item"
        className="w-full focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        Check in
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Chọn phòng</AlertDialogTitle>
          <AlertDialogDescription>
            Chọn {booking.numRooms} phòng phù hợp cho đặt phòng này.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isLoadingRooms ? (
          <Loader2Icon className="mx-auto my-10 animate-spin text-muted-foreground" />
        ) : roomErrorMessage ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {roomErrorMessage}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-y-2 max-h-72 overflow-y-auto">
              {availableRooms.length === 0 ? (
                <div className="text-sm text-muted-foreground">Không có phòng khả dụng.</div>
              ) : (
                availableRooms.map((room) => (
                  <label
                    key={room.id}
                    className="flex items-center gap-3 rounded-md border px-3 py-2 hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedRoomIds.includes(room.id)}
                      onCheckedChange={() => toggleRoom(room.id)}
                      disabled={isAssigning}
                    />
                    <span>{room.name}</span>
                  </label>
                ))
              )}
            </div>

            {actionErrorMessage ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive mt-4">
                {actionErrorMessage}
              </div>
            ) : null}
          </>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          {selectedRoomIds.length}/{booking.numRooms} phòng đã chọn.
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>

          <AlertDialogAction onClick={handleConfirm} disabled={isAssigning || selectedRoomIds.length !== booking.numRooms}>
            {isAssigning ? "Đang thực hiện..." : "Xác nhận"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CheckOutDialog({ booking }: { booking: BookingRow }) {
  const queryClient = useQueryClient();
  const {
    mutateAsync: checkOutBooking,
    status: checkOutStatus,
  } = useMutation({
    mutationFn: () => hotelowner_checkOutBooking(booking.id),
    onSuccess: () => {
      toast.success("Đã trả phòng.");
      queryClient.invalidateQueries({ queryKey: ["hotelowner_bookings"] });
    },
    onError: () => {
      toast.error("Có lỗi xảy ra khi trả phòng. Vui lòng thử lại.");
    },
  });

  const handleCheckOutConfirm = async () => {
    await checkOutBooking();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger
        data-slot="dropdown-menu-item"
        className="w-full focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        Check out
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận trả phòng</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn trả phòng cho đặt phòng này không?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleCheckOutConfirm} disabled={checkOutStatus === "pending"} variant="destructive">
            Xác nhận
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CancelBookingDialog({ booking }: { booking: BookingRow }) {
  const queryClient = useQueryClient();
  const {
    mutateAsync: cancelBooking,
    status: cancelStatus,
  } = useMutation({
    mutationFn: () => hotelowner_cancelBooking(booking.id),
    onSuccess: () => {
      toast.success("Đã hủy đặt phòng.");
      queryClient.invalidateQueries({ queryKey: ["hotelowner_bookings"] });
    },
    onError: () => {
      toast.error("Có lỗi xảy ra khi hủy đặt phòng. Vui lòng thử lại.");
    },
  });

  const handleCancelConfirm = async () => {
    await cancelBooking();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger
        data-slot="dropdown-menu-item"
        className="w-full focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        Hủy đặt phòng
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận hủy đặt phòng</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn hủy đặt phòng này không? Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancelConfirm} disabled={cancelStatus === "pending"}>
            Xác nhận
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}