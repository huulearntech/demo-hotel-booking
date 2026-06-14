"use client";

import { useState } from "react";
import { DataTable, DataTablePagination } from "@/components/data-table";
import { columns } from "./booking-columns";
import { hotelowner_getBookings } from "@/lib/actions/hotel-manager/bookings";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

const PAGE_SIZE = 25;

export default function UpcomingBooking() {
  const [pageParam, setPageParam] = useState<{
    queryPrevCursor: { checkInDate: Date, id: string } | null;
    queryNextCursor: { checkInDate: Date, id: string } | null;
    directionIsNext: boolean;
  }>({
    queryPrevCursor: null,
    queryNextCursor: null,
    directionIsNext: true
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["hotelowner_bookings", "upcoming", pageParam],
    queryFn: async () => {
      return hotelowner_getBookings(
        "upcoming",
        PAGE_SIZE,
        pageParam.queryPrevCursor,
        pageParam.queryNextCursor,
        pageParam.directionIsNext,
      );
    },
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const hasNextPage = Boolean(data?.nextCursor);
  const hasPreviousPage = Boolean(data?.prevCursor);

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
              setPageParam({
                queryPrevCursor: data.prevCursor,
                queryNextCursor: data.nextCursor,
                directionIsNext: false
              });
            }
          }}
          nextPage={() => {
            if (data?.nextCursor) {
              setPageParam({
                queryPrevCursor: data.prevCursor,
                queryNextCursor: data.nextCursor,
                directionIsNext: true
              });
            }
          }}
        />
      </div>
    </div>
  );
}


import { Skeleton } from "@/components/ui/skeleton";

export function UpcomingBookingSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
    </div>
  )
}