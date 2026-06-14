"use client";

import { useState } from "react";
import { DataTable, DataTablePagination } from "@/components/data-table";
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
const PAGE_SIZE = 25;

export default function BookingsTable() {
  const [timeRange, setTimeRange] = useState<BookingTimeRangeOptions>("upcoming");
  const [pageParams, setPageParams] = useState<Record<BookingTimeRangeOptions, {
    queryPrevCursor: { checkInDate: Date, id: string } | null;
    queryNextCursor: { checkInDate: Date, id: string } | null;
    directionIsNext: boolean;
  }>>({
    upcoming: {
      queryPrevCursor: null,
      queryNextCursor: null,
      directionIsNext: true,
    },
    current: {
      queryPrevCursor: null,
      queryNextCursor: null,
      directionIsNext: true,
    },
    past: {
      queryPrevCursor: null,
      queryNextCursor: null,
      directionIsNext: true,
    },
  });

  const currentPageParam = pageParams[timeRange];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hotelowner_bookings", timeRange, currentPageParam],
    queryFn: async () => {
      return hotelowner_getBookings(
        timeRange,
        PAGE_SIZE,
        currentPageParam.queryPrevCursor,
        currentPageParam.queryNextCursor,
        currentPageParam.directionIsNext,
      );
    },
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const hasNextPage = Boolean(data?.nextCursor);
  const hasPreviousPage = Boolean(data?.prevCursor);

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

      <div>
        <DataTable
          columns={columns}
          data={items}
        />
        <div className="flex items-center justify-end space-x-2 py-4">
          <DataTablePagination
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            previousPage={() => {
              if (data?.prevCursor) {
                setPageParams((prev) => ({
                  ...prev,
                  [timeRange]: {
                    queryPrevCursor: data.prevCursor,
                    queryNextCursor: data.nextCursor,
                    directionIsNext: false,
                  },
                }));
              }
            }}
            nextPage={() => {
              if (data?.nextCursor) {
                setPageParams((prev) => ({
                  ...prev,
                  [timeRange]: {
                    queryPrevCursor: data.prevCursor,
                    queryNextCursor: data.nextCursor,
                    directionIsNext: true,
                  },
                }));
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}