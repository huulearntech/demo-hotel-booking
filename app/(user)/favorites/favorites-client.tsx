"use client";

import { useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import HotelCard from '@/components/hotel-card';
import { useInView } from 'react-intersection-observer';
import { user_getFavoriteHotels } from '@/lib/actions/user-account/favorites';
import { PATHS, DEFAULT_SEARCH_BAR_VALUES } from '@/lib/constants';
import { codec_SearchSpecWithoutLocation_Params } from '@/lib/zod_schemas/search-bar';

export default function FavoritesList() {
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
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['favorites'],
    queryFn: async ({ pageParam }: { pageParam?: string | null }) => {
      // NOTE: I don't like the throw mechanism in general, at the point of writing this,
      // but tanstack uses it, so I have to conform to it.
      const res = await user_getFavoriteHotels({ limit: 12, cursor: pageParam ?? undefined });
      if (!res.ok) throw new Error(res.error || 'Failed to fetch');
      return res.data; // { items, nextCursor }
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchOnWindowFocus: false,
  });

  const items = data?.pages.flatMap(p => p.items ?? []) ?? [];

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isError) {
    return (
      <div className="text-center text-destructive mt-10">
        <p className="text-lg">Lỗi khi tải danh sách yêu thích.</p>
        <p className="text-sm">{error?.message ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.'}</p>
      </div>
    );
  }

  if (items.length === 0 && !isFetchingNextPage) {
    return (
      <div className="text-center text-gray-500 mt-10">
        <p className="text-lg">Bạn chưa thêm khách sạn nào vào danh sách yêu thích.</p>
        <p className="text-sm">Hãy bắt đầu khám phá và thêm những khách sạn mà bạn quan tâm vào danh sách yêu thích!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map(hotel => (
          <HotelCard
            key={hotel.id}
            hotel={hotel}
            href={`${PATHS.hotels}/${hotel.id}?${stringifiedSearchSpecWithoutLocation}`}
          />
        ))}
      </div>

      <div ref={sentinelRef} />

      <div className="mt-6 flex items-center justify-center">
        {isFetchingNextPage &&
          <span className="text-sm text-muted-foreground">Đang tải...</span>
        }

        {!hasNextPage &&
          <span className="text-sm text-muted-foreground">Đã tải toàn bộ kết quả.</span>
        }
      </div>
    </>
  );
}
