// FIXME: Virtual list not work yet.

"use client";

import { SearchBarFormData } from "@/lib/zod_schemas/search-bar";
import { useSearchParams } from "next/navigation";

import ButtonOpenFilterSheet from "../button-open-filter-sheet";
import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useInView } from "react-intersection-observer";

import { fetchSearchResult } from "@/lib/actions/search";
import SearchStatusBar, { SearchStatusBarSkeleton } from "./search-status-bar";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import noResultImage from "@/public/images/no-result.svg";
import Image from "next/image";
import HotelCard from "@/components/hotel-card";
import { AlertCircle } from "lucide-react";
import { PATHS } from "@/lib/constants";


// temporary. TODO: move to types
type SortType = "price_asc" | "price_desc" | "reviewPoints_desc";
import type { CursorType } from "@/lib/actions/search";

export default function Results({
  searchBarFormValues,
}: {
  searchBarFormValues: SearchBarFormData;
}) {
  const searchParams = useSearchParams();
  // TODO: remove
  const pageSize = 2;

  const sort: SortType = "price_asc";
  const [totalCount, setTotalCount] = useState(0);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["hotels", searchBarFormValues],
    queryFn: async ({ pageParam }: { pageParam: CursorType | null }) => {
      const page = await fetchSearchResult(
        searchBarFormValues,
        pageSize,
        sort,
        pageParam
      );
      setTotalCount(page.totalCount);
      return page;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage, _allPages) => lastPage.nextCursor ?? undefined,
  });

  // flatten pages into a single array of hotels
  const hotels = data?.pages ? data.pages.flatMap((p: any) => p.items) : [];
  useEffect(() => {
    const total = data?.pages?.[0]?.totalCount ?? 0;
    setTotalCount(total);
  }, [data]);

  // For virtualizer count include an extra slot for the loading sentinel when there's more to fetch
  // TODO: Clarify this, I not quite understand it yet. // @Important.
  const itemCount = hotels.length + (hasNextPage ? 1 : 0);

  const rowVirtualizer = useVirtualizer({
    count: itemCount,
    estimateSize: () => 430, // approximate card height (adjust as needed)
    // use the scrollable container by id to avoid needing useRef import
    getScrollElement: () =>
      document.getElementById("results-scroll-container") ?? document.scrollingElement,
    overscan: 0,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // Only trigger loading when the sentinel is actually at the viewport bottom.
  // Use threshold: 1 so the callback fires when the sentinel is fully visible.
  const { ref: sentinelRef, inView } = useInView({
    root: null,
    rootMargin: "0px",
    threshold: 1,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <ResultsSkeleton />;
  if (isError) return <ResultsError onRetry={() => refetch()} />;

  if (hotels.length === 0) return <NoResult />;

  return (
    <div className="w-full flex flex-col space-y-3">
      <SearchStatusBar
        location={searchBarFormValues.location}
        total={totalCount}
        searchParams={searchParams}
      />

      {/* Virtualized list */}
      <div
        id="results-scroll-container"
        className="w-full"
        style={{ position: "relative", overflowY: "auto", height: "auto" }}
      >
        <ul style={{ height: totalSize, position: "relative" }}>
          {virtualItems.map((virtualRow) => {
            const index = virtualRow.index;
            const isSentinel = index === hotels.length && hasNextPage;

            const style: React.CSSProperties = {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
              padding: 8,
            };

            if (isSentinel) {
              // sentinel slot used to trigger loading of next page
              return (
                <li key="loading" style={style}>
                  <div ref={sentinelRef} aria-hidden className="w-full h-6" />
                </li>
              );
            }

            const hotel = hotels[index];
            if (!hotel) return null;

            return (
              <li key={hotel.id} style={style}>
                <HotelCard
                  hotel={hotel}
                  href={`${PATHS.hotels}/${hotel.id}?${searchParams.toString()}`}
                  showWardAtTopLeft={false}
                />
              </li>
            );
          })}
        </ul>

        {/* Loading indicator for next page (renders below virtualized list) */}
        {isFetchingNextPage && (
          <div className="w-full flex items-center justify-center py-4">
            <Skeleton className="w-40 h-10 rounded-sm" />
          </div>
        )}
      </div>
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="w-full flex flex-col space-y-3">
      <SearchStatusBarSkeleton />
      <ul className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 24 }).map((_, index) => (
          <li key={index}>
            <div className="w-full h-106 rounded-lg overflow-hidden flex flex-col justify-between gap-y-2">
              <Skeleton className="w-full h-50" />
              <div className="flex justify-between px-3 py-2 flex-1 gap-x-2">
                <div className="w-full flex flex-col gap-y-2">
                  <Skeleton className="w-full h-4 rounded-lg" />
                  <Skeleton className="w-full h-4 rounded-lg" />
                  <Skeleton className="w-3/5 h-3 rounded-lg" />
                </div>
                <Skeleton className="size-10 rounded-sm" />
              </div>

              <div className="flex justify-between items-end px-3 py-2 flex-1 gap-x-2">
                <div className="w-full flex flex-col gap-y-2">
                  <Skeleton className="w-4/5 h-5 rounded-lg" />
                  <Skeleton className="w-4/5 h-5 rounded-lg" />
                </div>
                <Skeleton className="w-20 h-10 rounded-sm" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NoResult() {
  return (
    <div className="w-full h-[calc(100vh-15rem)] flex flex-col gap-y-2 items-center justify-center overflow-hidden">
      <Image src={noResultImage} alt="No result found" className="w-48 h-48 object-contain" />
      <h2 className="text-2xl font-semibold">Không tìm thấy kết quả nào</h2>
      <p className="text-sm text-muted-foreground">
        Bạn có thể điều chỉnh bộ lọc để tìm kiếm kết quả khác.
      </p>
      <ButtonOpenFilterSheet className="lg:hidden">
        <span className="hidden sm:block">Mở bộ lọc</span>
      </ButtonOpenFilterSheet>
    </div>
  );
}

function ResultsError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="w-full items-center flex flex-col gap-y-4 mt-20">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-semibold">Có lỗi xảy ra khi tải kết quả tìm kiếm</h2>
      <p className="text-sm text-muted-foreground text-center">
        Vui lòng thử lại hoặc tải lại trang.
      </p>
      <Button onClick={onRetry}> Thử lại </Button>
    </div>
  );
}
