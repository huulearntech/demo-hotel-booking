"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ArrowRightIcon, DoorOpenIcon, UserIcon } from "lucide-react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { user_getRecentBookings, type RecentBookingType } from "@/lib/actions/user-account";
import { type BookingStatus } from "@/lib/generated/prisma/enums";
import { differenceInDays } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BOOKING_STATUS_BADGE_COLORS } from "@/lib/constants";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { user_cancelBooking } from "@/lib/actions/bookings";
import { toast } from "sonner";



export default function BookingsInfiniteScrollList() {
  const { ref: sentinelRef, inView } = useInView({
    root: null,
    rootMargin: "200px",
    threshold: 0.1,
  });

  const [status, setStatus] = useState<BookingStatus>("PENDING_TO_PAY");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["user_recent_bookings", status],
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      // pageParam is the lastCursor string or null
      return user_getRecentBookings(pageParam, 10, status);
    },
    initialPageParam: null,
    getNextPageParam: (lastPage, _allPages) => lastPage.nextCursor ?? undefined,
    refetchOnWindowFocus: false,
  });

  // flatten pages
  const bookings = data?.pages?.flatMap((p) => p.items) ?? [];
  const loading = isLoading || isFetchingNextPage;

  // trigger loading next page when sentinel comes into view
  useEffect(() => {
    if (inView && hasNextPage && !loading) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, loading, fetchNextPage]);

  return (
    <div className="content flex flex-col gap-y-6 py-6">
      <div className="flex justify-between items-center gap-2">
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold">
            Lịch sử đặt phòng
          </h1>
          <p className="text-sm text-muted-foreground">
            Tất cả các đơn đặt phòng bạn đã thực hiện sẽ được hiển thị ở đây.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <ToggleGroup
            type="single"
            value={status}
            onValueChange={(value) => value && setStatus(value as BookingStatus)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! md:flex"
          >
            <ToggleGroupItem value="PENDING_TO_PAY">
              Chờ thanh toán
            </ToggleGroupItem>
            <ToggleGroupItem value="PAID">
              Chưa nhận phòng
            </ToggleGroupItem>
            <ToggleGroupItem value="CHECKED_IN">
              Đang lưu trú
            </ToggleGroupItem>
            <ToggleGroupItem value="CHECKED_OUT">
              Đã trả phòng
            </ToggleGroupItem>
            <ToggleGroupItem value="CANCELLED">
              Đã huỷ
            </ToggleGroupItem>
          </ToggleGroup>

          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as BookingStatus);
            }}
          >
            <SelectTrigger
              className="flex **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate md:hidden"
              size="sm"
              aria-label="Chọn khoảng thời gian hiển thị đặt phòng"
            >
              <SelectValue placeholder="Chọn khoảng thời gian" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="PENDING_TO_PAY" className="rounded-lg">
                Chờ thanh toán
              </SelectItem>
              <SelectItem value="PAID" className="rounded-lg">
                Chưa nhận phòng
              </SelectItem>
              <SelectItem value="CHECKED_IN" className="rounded-lg">
                Đang lưu trú
              </SelectItem>
              <SelectItem value="CHECKED_OUT" className="rounded-lg">
                Đã trả phòng
              </SelectItem>
              <SelectItem value="CANCELLED" className="rounded-lg">
                Đã huỷ
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <main>
          {bookings.length === 0 && !loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Không có kết quả.
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {bookings.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}

                {loading && <SkeletonCard />}
              </div>

              <div ref={sentinelRef} aria-hidden className="h-8" />

              <div className="flex items-center justify-center gap-3 mt-4">
                {loading ? (
                  <div className="text-sm text-muted-foreground">Đang tải...</div>
                ) : !hasNextPage ? (
                  <div className="text-sm text-muted-foreground">Đã tải toàn bộ kết quả</div>
                ) : null}
              </div>
            </>
          )}
      </main>
    </div>
  );
}


function StatusBadge({ status }: { status: BookingStatus }) {
  const s = BOOKING_STATUS_BADGE_COLORS[status];
  return <span className={`px-2 py-1 rounded-md text-xs font-medium ${s.variant}`}>{s.text}</span>;
}

const fmtCurrency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format;
const fmtDate = (d: Date) => {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
};
const fmtDateTime = (d: Date) => {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

function BookingCard({ booking }: { booking: RecentBookingType }) {
  const {
    roomType: { hotel: { name: hotelName, type: hotelType, owner: { profileImageUrl } } },
    checkInDate,
    checkOutDate,
    numRooms,
    numAdults,
    numChildren,
    snapshotRoomTypeName,
  } = booking;
  const totalPrice = booking.totalPrice;
  const createdAt = booking.createdAt;
  const nights = differenceInDays(checkOutDate, checkInDate);

  const queryClient = useQueryClient();

  return (
    <Card className="rounded-xl border bg-card/50 hover:shadow-md transition-shadow">
      <CardHeader className="flex items-start justify-between gap-4 py-3 px-4">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar>
            <AvatarImage src={profileImageUrl ?? undefined} alt={`${hotelName} owner profile`} />
            <AvatarFallback>
              {hotelName
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="truncate font-semibold leading-5">{hotelName}</div>
              <span className="ml-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {hotelType}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground truncate">
              <span className="truncate">Mã: {booking.id}</span>
              <span className="hidden sm:inline">- Đặt lúc {fmtDateTime(createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold">{fmtCurrency(totalPrice)}</div>
            <StatusBadge status={booking.status} />
          </div>
          <div className="text-sm text-muted-foreground">
            {fmtDate(checkInDate)} <ArrowRightIcon className="inline h-4 w-4 align-middle" />{" "}
            {fmtDate(checkOutDate)} {nights ? <span className="ml-2">· {nights} đêm</span> : null}
          </div>
        </div>
      </CardHeader>

      <CardFooter className="flex items-center justify-between gap-x-4">
        <div className="flex text-sm items-center gap-4">
          <div className="flex items-center gap-2">
            <DoorOpenIcon className="size-4 text-muted-foreground" />
            <span>{numRooms} phòng</span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-sm text-muted-foreground">
              {snapshotRoomTypeName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <UserIcon className="size-4 text-muted-foreground" />
            <span>
              {numAdults} người lớn{numChildren ? ` & ${numChildren} trẻ em` : ""}
            </span>
          </div>
        </div>
        {booking.status === "PENDING_TO_PAY" && booking.vnpayUrl && (
          <div className="flex items-center gap-x-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Hủy
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="sm:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Hủy đơn đặt phòng</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc muốn hủy đơn đặt phòng này? Hành động này sẽ không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4 flex justify-end gap-2">
                  <AlertDialogCancel asChild>
                    <Button variant="secondary" size="sm">
                      Không
                    </Button>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        const response = await user_cancelBooking(booking.id);
                        if (response.ok) {
                          toast.success("Đã hủy đơn đặt phòng.");
                          queryClient.invalidateQueries({ queryKey: ["user_recent_bookings"] });
                        } else {
                          toast.error("Có lỗi xảy ra khi hủy đơn đặt phòng. Vui lòng thử lại.");
                        }
                      }}
                    >
                      Xác nhận hủy
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="link" asChild>
              <Link href={booking.vnpayUrl} target="_blank" className="text-sm font-medium text-primary flex items-center gap-x-1">
                Thanh toán
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="mb-2 animate-pulse rounded-lg border bg-card/50">
      <CardHeader className="flex items-start justify-between gap-4 py-3 px-4">
        <div className="min-w-0 space-y-2 w-48">
          <div className="h-4 w-full rounded bg-slate-200" />
          <div className="h-3 w-32 rounded bg-slate-200" />
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-3 w-36 rounded bg-slate-200" />
        </div>
      </CardHeader>

      <CardContent className="flex items-center justify-between gap-4 py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="h-3 w-20 rounded bg-slate-200" />
          <div className="h-3 w-4 rounded bg-slate-200" />
          <div className="h-3 w-20 rounded bg-slate-200" />
        </div>
        <div className="h-6 w-20 rounded bg-slate-200" />
      </CardContent>
    </Card>
  );
}