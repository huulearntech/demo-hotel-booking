// TODO: 5 tab: pending, upcoming, staying, past, cancelled. with filter? This covers all cases of enum, so it should use the enum itself.
"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRightIcon, DoorOpenIcon, UserIcon } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { type RecentBookingType, user_getRecentBookingsPaginated } from "@/lib/actions/user-account";
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

type BookingTimeRangeOptions = "past" | "current" | "upcoming";


function StatusBadge({ status }: { status: BookingStatus }) {
  const s = BOOKING_STATUS_BADGE_COLORS[status];
  return <span className={`px-2 py-1 rounded-md text-xs font-medium ${s.variant}`}>{s.text}</span>;
}

const fmtCurrency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format;
const fmtDate = (d?: string | Date | null) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(dt);
};
const fmtDateTime = (d?: string | Date | null) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
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
              <span className="ml-1 rounded-md bg-muted/20 px-2 py-0.5 text-xs text-muted-foreground">
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

      <CardContent className="flex items-center justify-between gap-4 py-3 px-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <DoorOpenIcon className="h-4 w-4 text-muted-foreground" />
            <span>{numRooms} phòng</span>
            <span className="ml-1 rounded-md bg-muted/20 px-2 py-0.5 text-xs text-muted-foreground">
              {snapshotRoomTypeName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span>
              {numAdults} người lớn{numChildren ? ` • ${numChildren} trẻ em` : ""}
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="text-xs text-muted-foreground">Chi tiết</div>
          <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
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

export default function BookingsInfiniteScrollList() {
  const { ref: sentinelRef, inView } = useInView({
    root: null,
    rootMargin: "200px",
    threshold: 0.1,
  });

  const [timeRange, setTimeRange] = useState<BookingTimeRangeOptions>("upcoming");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["user_recent_bookings"],
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      // pageParam is the lastCursor string or null
      return user_getRecentBookingsPaginated(pageParam);
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
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as BookingTimeRangeOptions)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! md:flex"
          >
            <ToggleGroupItem value="upcoming">
              Chưa nhận phòng
            </ToggleGroupItem>
            <ToggleGroupItem value="current">
              Đang lưu trú
            </ToggleGroupItem>
            <ToggleGroupItem value="past">
              Đã trả phòng
            </ToggleGroupItem>
          </ToggleGroup>

          <Select
            value={timeRange}
            onValueChange={(value) => {
              setTimeRange(value as BookingTimeRangeOptions);
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
              <SelectItem value="upcoming" className="rounded-lg">
                Chưa nhận phòng
              </SelectItem>
              <SelectItem value="current" className="rounded-lg">
                Đang lưu trú
              </SelectItem>
              <SelectItem value="past" className="rounded-lg">
                Đã trả phòng
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <main>
          {bookings.length === 0 && !loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Bạn chưa có đơn đặt phòng nào. Hãy khám phá các khách sạn và đặt phòng đầu tiên của bạn!
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