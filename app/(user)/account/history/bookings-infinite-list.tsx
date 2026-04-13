// TODO: the card component is AI-generated and ugly as fuck. Have to fix it.
"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRightIcon } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { type RecentBookingType, user_getRecentBookingsPaginated } from "@/lib/actions/user-account";
import { BookingStatus } from "@/lib/generated/prisma/enums";

const map: Record<BookingStatus, { text: string; variant: string }> = {
  PENDING: { text: "Pending", variant: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { text: "Confirmed", variant: "bg-green-100 text-green-800" },
  COMPLETED: { text: "Completed", variant: "bg-sky-100 text-sky-800" },
  CANCELLED: { text: "Cancelled", variant: "bg-red-100 text-red-800" },
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const s = map[status] ?? { text: status, variant: "bg-gray-100 text-gray-800" };
  return <span className={`px-2 py-1 rounded-md text-xs font-medium ${s.variant}`}>{s.text}</span>;
}
// cleanup - compact card variants
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
    hotel: { name: hotelName },
    checkInDate,
    checkOutDate,
    numRooms,
    numGuests,
  } = booking.metadata;
  const totalPrice = booking.totalPrice;
  const createdAt = booking.createdAt;

  return (
    <Card className="rounded-lg border bg-card/50">
      <CardHeader className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate font-semibold leading-5">{hotelName}</div>
          <div className="mt-1 text-sm text-muted-foreground truncate">Mã: {booking.id}</div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="font-semibold">{fmtCurrency(totalPrice)}</div>
          <div className="text-sm text-muted-foreground">Đặt lúc {fmtDateTime(createdAt)}</div>
        </div>
      </CardHeader>

      <CardContent className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-muted-foreground truncate">{fmtDate(checkInDate)}</div>
            <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
            <div className="text-muted-foreground truncate">{fmtDate(checkOutDate)}</div>
          </div>
          <div className="hidden md:block h-5 w-px bg-muted/40" />
          <div className="hidden md:block text-muted-foreground">{numRooms} phòng</div>
          <div className="hidden md:block text-muted-foreground">{numGuests} khách</div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={booking.status} />
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

// This page size is repeated. TODO: cleanup.
const PAGE_SIZE = 8;

export default function BookingsInfiniteScrollList() {
  const { ref: sentinelRef, inView } = useInView({
    root: null,
    rootMargin: "200px",
    threshold: 0.1,
  });

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
      const res = await user_getRecentBookingsPaginated(pageParam, PAGE_SIZE);
      return res;
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
    <div>
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
    </div>
  );
}