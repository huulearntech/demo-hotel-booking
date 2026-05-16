"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { columns } from "./booking-columns";
import { hotelowner_getBookings } from "@/lib/actions/hotel-manager/bookings";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

const PAGE_SIZE = 20;

export default function UpcomingBooking() {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageHistory, setPageHistory] = useState<Array<{ prevCursor: { checkInDate: Date; id: string } | null; nextCursor: { checkInDate: Date; id: string } | null }>>([
    { prevCursor: null, nextCursor: null },
  ]);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const currentPage = pageHistory[pageIndex];
  const { data, isLoading, isError } = useQuery({
    queryKey: ["hotelowner_bookings", "upcoming", PAGE_SIZE, currentPage, direction],
    queryFn: async () => {
      return hotelowner_getBookings(
        "upcoming",
        PAGE_SIZE,
        direction === "prev" ? currentPage.prevCursor : null,
        direction === "next" ? currentPage.nextCursor : null,
        direction,
      );
    },
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const pageCount = data ? pageHistory.length + (data.nextCursor ? 1 : 0) : 1;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-6 w-1/3 rounded bg-slate-200 animate-pulse" />
        <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
        <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
        <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return <div>Đã có lỗi khi tải danh sách đặt phòng. Vui lòng thử lại.</div>;
  }

  return (
    <DataTable
      columns={columns}
      data={items}
      pageCount={pageCount}
      onPaginationChange={({ pageIndex: newIndex }) => {
        if (newIndex === pageIndex) return;

        if (newIndex > pageIndex) {
          if (!data?.nextCursor || newIndex !== pageHistory.length) return;
          setDirection("next");
          setPageHistory((current) => [
            ...current,
            { prevCursor: data?.prevCursor ?? null, nextCursor: data.nextCursor! },
          ]);
          setPageIndex(newIndex);
        } else {
          if (!pageHistory[newIndex]) return;
          setDirection("prev");
          setPageIndex(newIndex);
        }
      }}
    />
  );
}