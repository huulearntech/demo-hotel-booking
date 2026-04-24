"use client";

import { useCallback, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import HotelCard from '@/components/hotel-card.draft';
import { useInView } from 'react-intersection-observer';
import { draft_user_createOrDeleteFavoriteHotel, draft_user_fetchFavoriteHotels } from '@/lib/actions/user-account/favorites';
import { PATHS } from '@/lib/constants';
import { toast } from 'sonner';

export default function FavoritesList() {
  const { ref: sentinelRef, inView } = useInView({ rootMargin: '200px' });

  // TODO: cleanup
  const fetchFavorites = async ({ pageParam }: { pageParam?: string | null }) => {
    const res = await draft_user_fetchFavoriteHotels({ limit: 12, cursor: pageParam ?? undefined });
    if (!res.ok) throw new Error(res.error || 'Failed to fetch');
    return res.data; // { items, nextCursor }
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  // TODO: this is repeated with the one in search results, and this is not efficient because of the "refetch" call.
  const onToggleFavorite = useCallback(async (hotelId: string, shouldFavorite: boolean) => {
    const response = await draft_user_createOrDeleteFavoriteHotel(hotelId, shouldFavorite);
    if (!response.ok) {
      if (response.status === 401) {
        toast.info("Bạn cần đăng nhập để thêm khách sạn vào danh sách yêu thích.");
      } else {
        toast.info("Đã có lỗi xảy ra khi cập nhật danh sách yêu thích. Vui lòng thử lại.");
      }
    } else {
      toast.success(shouldFavorite ? "Đã thêm vào danh sách yêu thích!" : "Đã xóa khỏi danh sách yêu thích!");
      // Refetch the search results to update the favorite status in the UI.
      // FIXME: NO this is not good, because it will reset the whole page.
      refetch();
    }
  }, []);

  const items = data?.pages.flatMap((p: any) => p.items ?? []) ?? [];

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isError) {
    return (
      <div className="text-center text-destructive mt-10">
        <p className="text-lg">Lỗi khi tải danh sách yêu thích.</p>
        <p className="text-sm">{(data as any)?.error ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.'}</p>
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
        {items.map((hotel: any) => (
          <HotelCard
            key={hotel.id}
            hotel={hotel}
            href={`${PATHS.hotels}/${hotel.id}?TODO:searchspec`}
            onFavoriteToggle={onToggleFavorite}
          />
        ))}
      </div>

      <div ref={sentinelRef} />

      <div className="mt-6 flex items-center justify-center">
        {isFetchingNextPage &&
          <span className="text-sm text-muted-foreground">Đang tải...</span>
        }

        {!hasNextPage &&
          <span className="text-sm text-muted-foreground">Không còn kết quả.</span>
        }
      </div>
    </>
  );
}
