"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { columns } from "../tmp-components/booking-columns";
import { hotelowner_getBookings } from "@/lib/actions/hotel-manager/bookings";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";

type BookingTimeRangeOptions = "past" | "current" | "upcoming";
const PAGE_SIZE = 2;

export default function BookingsTable() {
  const [timeRange, setTimeRange] = useState<BookingTimeRangeOptions>("upcoming");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageHistory, setPageHistory] = useState<Array<{ prevCursor: { checkInDate: Date; id: string } | null; nextCursor: { checkInDate: Date; id: string } | null }>>([
    { prevCursor: null, nextCursor: null },
  ]);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const currentPage = pageHistory[pageIndex];
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hotelowner_bookings", timeRange, PAGE_SIZE, currentPage, direction],
    queryFn: async () => {
      return hotelowner_getBookings(
        timeRange,
        PAGE_SIZE,
        currentPage.prevCursor,
        currentPage.nextCursor,
        direction,
      );
    },
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  // const pageCount = data
  //   ? pageHistory.length + (data.nextCursor ? 1 : 0)
  //   : 1;

  if (isLoading)
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 rounded bg-gray-200/60 animate-pulse" />
        </div>

        <div className="rounded-md border bg-white">
          {/* table header skeleton */}
          <div className="grid grid-cols-6 gap-4 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 rounded bg-gray-200/60 animate-pulse" />
            ))}
          </div>

          {/* table rows skeleton */}
          <div className="divide-y">
            {Array.from({ length: 4 }).map((_, row) => (
              <div key={row} className="grid grid-cols-6 gap-4 p-4">
                {Array.from({ length: 6 }).map((_, col) => (
                  <div key={col} className="h-5 rounded bg-gray-100 animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  if (isError) return <div>Đã có lỗi khi tải danh sách đặt phòng. Vui lòng thử lại.</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between gap-2">
        <header className="flex flex-col gap-2">
          <h1 className="font-semibold">Danh sách lượt đặt phòng</h1>
          <p className="text-sm text-muted-foreground">Quản lý các lượt đặt phòng của khách hàng tại khách sạn của bạn.</p>
        </header>

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

      <DataTable
        columns={columns}
        data={items}
        // pageCount={pageCount}
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
    </div>
  );
}