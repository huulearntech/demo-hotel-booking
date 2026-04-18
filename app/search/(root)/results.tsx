"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";

import { useFilterForm } from "../filter-form-context";
import { codec_searchSpec, SearchBar_FormInput } from "@/lib/zod_schemas/search-bar";
import { fetchSearchResult, type CursorType } from "@/lib/actions/search";
import { PATHS } from "@/lib/constants";

import ButtonOpenFilterSheet from "../button-open-filter-sheet";
import SearchStatusBar, { SearchStatusBarSkeleton } from "./search-status-bar";
import HotelCard from "@/components/hotel-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, LoaderCircleIcon } from "lucide-react";
import noResultImage from "@/public/images/no-result.svg";

// temporary. TODO: move to types
type SortType = "price_asc" | "price_desc" | "reviewPoints_desc";
const sort: SortType = "price_asc";

export default function Results({
  searchBarFormValues,
}: {
  searchBarFormValues: SearchBar_FormInput;
}) {
  const searchParams = useSearchParams();
  const [totalCount, setTotalCount] = useState(0);
  const { getValues } = useFilterForm();

  const { location, ...searchSpecWithoutLocation } = searchBarFormValues;
  const searchSpecString = new URLSearchParams(codec_searchSpec.encode(searchSpecWithoutLocation)).toString();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["hotels", searchBarFormValues], // TODO: should also include filterFormValues and sort in the query key
    queryFn: async ({ pageParam }: { pageParam: CursorType | null }) => {
      const filterFormValues = getValues();

      const page = await fetchSearchResult(
        searchBarFormValues,
        filterFormValues,
        sort,
        pageParam,
      );
      return page;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage, _allPages) => lastPage.nextCursor ?? undefined,
    refetchOnWindowFocus: false,
  });

  // flatten pages into a single array of hotels
  const hotels = data?.pages.flatMap(p => p.items) ?? [];
  useEffect(() => {
    const total = data?.pages?.[0]?.totalCount ?? 0;
    setTotalCount(total);
  }, [data]);

  // sentinel to load next page when it comes into view
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
        total={totalCount}
        searchParams={searchParams}
      />

      <ul className="w-full grid grid-cols-1 min-[512px]:grid-cols-2 md:grid-cols-3 gap-4">
        {hotels.map((hotel: any, index: number) => (
          <li key={hotel.id} data-index={index}>
            <HotelCard
              hotel={hotel}
              href={`${PATHS.hotels}/${hotel.id}?${searchSpecString}`}
              showWardAtTopLeft={false}
            />
          </li>
        ))}

        {/* sentinel to trigger loading next page */}
        {hasNextPage && (
          <li key="loading-sentinel" className="col-span-full">
            <div ref={sentinelRef} aria-hidden className="w-full h-6" />
          </li>
        )}
      </ul>

      {isFetchingNextPage && (
        <div className="w-full flex items-center justify-center py-4 text-sm text-muted-foreground gap-x-2">
          <LoaderCircleIcon className="size-4 animate-spin" />
          Đang tải thêm kết quả...
        </div>
      )}

      {!hasNextPage && (
        <div className="w-full flex items-center justify-center py-4 text-sm text-muted-foreground">
          Đã hiển thị tất cả kết quả
        </div>
      )}
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
      <ButtonOpenFilterSheet className="w-fit lg:hidden">
        <span>Mở bộ lọc</span>
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
