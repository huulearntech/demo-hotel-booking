// TODO: Pagination. May move this to server because it doesn't need much interactivity.
"use client";

import { useLayoutEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchSearchResult } from "@/lib/actions/search";
import SearchStatusBar, { SearchStatusBarSkeleton } from "./search-status-bar";

export default function Results({
  searchBarFormValues
}: {
  searchBarFormValues: SearchBarFormData;
}) {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);


  const { data: hotels = [], isLoading, isError } = useQuery({
    queryKey: ["hotels", page],
    queryFn: async () => {
      return fetchSearchResult(searchBarFormValues);
    },
    placeholderData: keepPreviousData
  });

  if (isLoading) return <ResultsSkeleton />;
  // TODO: proper onRetry
  if (isError) return <ResultsError onRetry={() => setPage(1)} />;

  // const totalPages = Math.ceil((data?.total ?? 0) / pageSize);

  const totalPages = 1;

  // TODO: location
  return ( hotels.length === 0 ? <NoResult /> :
    <div className="w-full flex flex-col space-y-3">
      <SearchStatusBar
        location={searchBarFormValues.location}
        total={hotels.length ?? 0}
        searchParams={searchParams}
      />

      <PaginationBar
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(p: number) => { setPage(p); }}
      />

      <ul className="w-full grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 gap-4">
        {hotels.map((hotel) => (
          <li key={hotel.id}>
            <HotelCard
              hotel={hotel}
              href={`${PATHS.hotels}/${hotel.id}?${searchParams.toString()}`}
              showWardAtTopLeft={false}
            />
          </li>
        ))}
      </ul>
      <PaginationBar
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(p: number) => { setPage(p); }}
      />
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import noResultImage from "@/public/images/no-result.svg";
import Image from "next/image";
import HotelCard from "@/components/hotel-card";
import { AlertCircle } from "lucide-react";
import { PATHS } from "@/lib/constants";


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
  )
}

function NoResult() {
  // TODO: This is temporary solution, this affects accessibility.
  // Should make this button at the one place.
  return (
    <div className="w-full h-[calc(100vh-15rem)] flex flex-col gap-y-2 items-center justify-center overflow-hidden">
      <Image src={noResultImage} alt="No result found" className="w-48 h-48 object-contain" />
      <h2 className="text-2xl font-semibold">Không tìm thấy kết quả nào</h2>
      <p className="text-sm text-muted-foreground">
        Bạn có thể điều chỉnh bộ lọc để tìm kiếm kết quả khác.
      </p>
      <ButtonOpenFilterSheet>
        <span className="hidden sm:block">Mở bộ lọc</span>
      </ButtonOpenFilterSheet>
    </div>
  )
}


// TODO: cleanup
function ResultsError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="w-full items-center flex flex-col gap-y-4 mt-20">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-semibold">
        Có lỗi xảy ra khi tải kết quả tìm kiếm
      </h2>
      <p className="text-sm text-muted-foreground text-center">
        Vui lòng thử lại hoặc tải lại trang.
      </p>
      <Button onClick={onRetry}> Thử lại </Button>
    </div>
  );
}


import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { SearchBarFormData } from "@/lib/zod_schemas/search-bar";
import { useSearchParams } from "next/navigation";
import ButtonOpenFilterSheet from "../button-open-filter-sheet";

function PaginationBar({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="ghost"
            aria-label="Previous page"
          >
            <ChevronLeftIcon />
            <span className="hidden sm:block">Previous</span>
          </Button>
        </PaginationItem>
        {totalPages <= 5 ?
          Array.from({ length: totalPages }).map((_, index) => 
            <PaginationItem key={index}>
              <Button
                variant={index + 1 == currentPage ? "outline" : "ghost"}
                onClick={() => onPageChange(index + 1)}
                aria-current={index + 1 == currentPage ? "page" : undefined}
              >
                {index + 1}
              </Button>
            </PaginationItem>
          ) : (
            <>
              {currentPage > 1 &&
                <PaginationItem>
                  <Button variant="ghost" onClick={() => onPageChange(1)}> 1 </Button>
                </PaginationItem>
              }

              {currentPage >= 3 &&
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              }

              <PaginationItem>
                <Button variant="outline">
                  {currentPage}
                </Button>
              </PaginationItem>

              {currentPage <= totalPages - 2 &&
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              }
              {
                currentPage < totalPages &&
                <PaginationItem>
                  <Button variant="ghost" onClick={() => onPageChange(totalPages)}>
                    {totalPages}
                  </Button>
                </PaginationItem>
              }
            </>
          )
        }
        <PaginationItem>
          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="ghost"
            aria-label="Next page"
          >
            <span className="hidden sm:block">Next</span>
            <ChevronRightIcon />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}