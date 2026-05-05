"use client";

import { useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import HotelCard from '@/components/hotel-card';
import { useInView } from 'react-intersection-observer';
import { user_fetchRecentlyViewedHotels } from '@/lib/actions/user-account/recently-viewed';

export default function RecentlyViewedList() {
  const { ref: sentinelRef, inView } = useInView({ rootMargin: '200px' });

  const fetchRecentlyViewed = async ({ pageParam }: { pageParam?: string | null }) => {
    const res = await user_fetchRecentlyViewedHotels({ limit: 12, cursor: pageParam ?? undefined });
    if (!res.ok) throw new Error(res.error || 'Failed to fetch');
    return res.data; // { items, nextCursor }
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = useInfiniteQuery({
    queryKey: ['recentlyViewed'],
    queryFn: fetchRecentlyViewed,
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
            href="#"
          />
        ))}
      </div>

      <div ref={sentinelRef} />

      <div className="mt-6 flex items-center justify-center">
        {isFetchingNextPage && <span className="text-sm text-muted-foreground">Đang tải...</span>}
        {!hasNextPage && <span className="text-sm text-muted-foreground">Không còn kết quả.</span>}
      </div>
    </>
  );
}
