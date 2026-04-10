"use client";
// May consider use tanstack useInfiniteQuery in the future.
// But the chance of user have too many bookings is quite low.

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRightIcon } from "lucide-react";

import { type RecentBookingType, user_getRecentBookings } from "@/lib/actions/user-account";
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

// cleanup
const fmtCurrency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format;
const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);

function BookingCard({ booking }: { booking: RecentBookingType }) {
  const hotelName = booking.metadata?.hotel?.name ?? "Unknown hotel";
  const checkInDate = booking.metadata?.checkInDate;
  const checkOutDate = booking.metadata?.checkOutDate;
  const totalPrice = booking.totalPrice;

  const fmtCreatedAt = booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "—";

  return (
    <Card className="mb-1">
      <CardHeader className="py-1.5 px-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate font-medium">{hotelName}</div>
            <div className="text-sm text-muted-foreground truncate">ID: {booking.id}</div>
          </div>

          <div className="text-right shrink-0">
            <div className="font-semibold">{fmtCurrency(totalPrice)}</div>
            <div className="text-sm text-muted-foreground">{fmtCreatedAt}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-1.5 px-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-sm text-muted-foreground truncate">{fmtDate(checkInDate)}</div>
            <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm text-muted-foreground truncate">{fmtDate(checkOutDate)}</div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={booking.status} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="mb-1 animate-pulse">
      <CardHeader className="py-1.5 px-2">
        <div className="flex items-center justify-between w-full">
          <div className="space-y-2 w-40">
            <div className="h-3 bg-slate-200 rounded" />
            <div className="h-3 bg-slate-200 rounded w-32" />
          </div>
          <div className="space-y-2 text-right">
            <div className="h-3 bg-slate-200 rounded w-24 mx-auto" />
            <div className="h-3 bg-slate-200 rounded w-20 mx-auto" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-1.5 px-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-3 bg-slate-200 rounded w-20" />
            <div className="h-3 bg-slate-200 rounded w-4" />
            <div className="h-3 bg-slate-200 rounded w-20" />
          </div>
          <div className="h-6 w-20 bg-slate-200 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

// This page size is repeated. TODO: cleanup.
const PAGE_SIZE = 8;

export default function BookingsInfiniteScrollList() {
  const [bookings, setBookings] = useState<RecentBookingType[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const { ref: sentinelRef, inView } = useInView({
    root: null,
    rootMargin: "200px",
    threshold: 0.1,
  });

  // helper that talks to server action user_getRecentBookings
  async function fetchPage(nextCursor: string | null) {
    setLoading(true);
    try {
      const res = await user_getRecentBookings(nextCursor, PAGE_SIZE);
      if (!res.ok) {
        console.error("Server action error:", res.error);
        setHasMore(false);
        return;
      }

      const items = res.data ?? [];

      // Determine next cursor: if we received a full page, use last item's id
      const next = items.length === PAGE_SIZE ? items[items.length - 1].id : null;

      setBookings((prev) => [...prev, ...items]);
      setCursor(next);
      setHasMore(!!next);
    } catch (err) {
      console.error("Error loading bookings via server action:", err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    if (bookings.length === 0 && !loading) {
      fetchPage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ?????

  // trigger loading next page when sentinel comes into view
  useEffect(() => {
    if (inView && !loading && hasMore) {
      fetchPage(cursor);
    }
  }, [inView, loading, hasMore, cursor]);

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
            {loading ? ( // May consider show spinner instead of text
              <div className="text-sm text-muted-foreground">Đang tải...</div>
            ) : !hasMore ? (
              <div className="text-sm text-muted-foreground">Đã tải toàn bộ kết quả</div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}