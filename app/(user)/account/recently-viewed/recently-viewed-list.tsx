"use client";

import { useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import HotelCard from '@/components/hotel-card';
import { useInView } from 'react-intersection-observer';
import { user_getRecentlyViewedHotels } from '@/lib/actions/user-account/recently-viewed';
import { DEFAULT_SEARCH_BAR_VALUES, PATHS } from '@/lib/constants';
import { codec_SearchSpecWithoutLocation_Params } from '@/lib/zod_schemas/search-bar';

export default function RecentlyViewedList() {
  const { ref: sentinelRef, inView } = useInView({ rootMargin: '200px' });
  const { location, ...defaultSpecWithoutLocation } = DEFAULT_SEARCH_BAR_VALUES;
  const stringifiedSearchSpecWithoutLocation = new URLSearchParams(
    codec_SearchSpecWithoutLocation_Params.encode(defaultSpecWithoutLocation)
  ).toString();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = useInfiniteQuery({
    queryKey: ['recentlyViewed'],
    queryFn: async ({ pageParam }: { pageParam: { viewedAt: Date; id: string } | null }) => {
      return user_getRecentlyViewedHotels(12, pageParam);
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchOnWindowFocus: false,
  });


  const items = data?.pages.flatMap(p => p.items) ?? [];

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === 'pending') {
    return <div className="text-center text-muted-foreground mt-8">Đang tải...</div>;
  }

  if (status === 'error') {
    return <div className="text-center text-destructive mt-8">Lỗi: {(error as any)?.message ?? 'Không thể tải'}</div>;
  }

  if (items.length === 0 && !isFetchingNextPage) {
    return (
      <div className="text-center text-gray-500 mt-10">
        <p className="text-lg">Bạn chưa xem khách sạn nào gần đây.</p>
        <p className="text-sm">Khám phá khách sạn và họ sẽ xuất hiện ở đây khi bạn xem chúng.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((hotel) => (
          <HotelCard
            key={hotel.id}
            hotel={hotel}
            href={`${PATHS.hotels}/${hotel.id}?${stringifiedSearchSpecWithoutLocation}`}
          />
        ))}
      </div>

      <div ref={sentinelRef} />

      <div className="mt-6 flex items-center justify-center">
        {isFetchingNextPage && <span className="text-sm text-muted-foreground">Đang tải...</span>}
        {!hasNextPage && <span className="text-sm text-muted-foreground">Đã tải hết kết quả.</span>}
      </div>
    </>
  );
}
