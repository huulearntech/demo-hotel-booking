"use client";

import Image from "next/image";
import { useState } from "react";
import { tvlk_logo_text_dark } from "@/public/logos";

import { user_getReviewsOfHotel, type ReviewCursor } from "@/lib/actions/reviews";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

import ReviewCard from "./review-card";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";


export default function ReviewSection({
  hotelId,
  hotelName,
  rating,
  numberOfReviews,
}: {
  hotelId: string;
  hotelName: string;
  rating: number;
  numberOfReviews: number;
}) {
  const [pageParam, setPageParam] = useState<{
    queryPrevCursor: ReviewCursor | null;
    queryNextCursor: ReviewCursor | null;
    directionIsNext: boolean
  }>({
    queryPrevCursor: null,
    queryNextCursor: null,
    directionIsNext: true
  });

  const { data, isFetching } = useQuery({
    queryKey: ["hotelReviews", hotelId, pageParam],
    queryFn: async () => {
      return await user_getReviewsOfHotel(
        hotelId,
        DEFAULT_PAGE_SIZE,
        pageParam.queryPrevCursor,
        pageParam.queryNextCursor,
        pageParam.directionIsNext
      )
    },
    placeholderData: keepPreviousData,
  });

  const reviews = data?.items ?? [];
  const hasNextPage = Boolean(data?.nextCursor);
  const hasPreviousPage = Boolean(data?.prevCursor);

  return (
    <section id="review" className="w-full flex flex-col">
      <div className="rounded-4xl px-4 py-5 flex flex-col gap-y-5 shadow-xl">
        <h2 className="font-bold text-[1.25rem]">Những review của khách về {hotelName}</h2>
        <div className="flex flex-col lg:flex-row lg:items-center gap-y-6 lg:gap-y-0 lg:gap-x-12">
          <div className="flex gap-x-6 md:gap-x-12 flex-1">
            {numberOfReviews > 0 && (
              <div
                className="flex shrink-0 items-center justify-center
                size-24 rounded-2xl
                md:size-32 md:rounded-4xl
                bg-linear-[137deg] from-[rgb(245,251,255)] from-0% via-[rgb(209,240,255)] via-[46.1%] to-[rgb(245,251,255)] to-[96.84%]"
              >
                <div
                  className="flex items-center justify-center border-white
                  size-18 border-3 rounded-2xl
                  md:size-24 md:border-4 md:rounded-3xl"
                >
                  <div className="text-center text-[2rem] md:text-[3rem] font-bold text-primary">
                    {rating.toFixed(1)}
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col space-y-3">
              {numberOfReviews > 0 && <div className="text-[1.25rem] font-bold">Từ {numberOfReviews} đánh giá</div>}
              <div className="font-medium flex">
                <div className="whitespace-pre">Bởi khách du lịch trong </div>
                <Image src={tvlk_logo_text_dark} alt="hoteloka" className="h-6.25 w-auto" />
              </div>
            </div>
          </div>
        </div>

        { numberOfReviews > 0
          ? <>
            <ul className="flex flex-col gap-y-3">
              {reviews.map((r) => (
                <li key={r.id}>
                  <ReviewCard review={r} />
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-end gap-x-4 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasPreviousPage || isFetching}
                onClick={() => {
                  if (data?.prevCursor) {
                    setPageParam({
                      queryPrevCursor: data.prevCursor,
                      queryNextCursor: data.nextCursor,
                      directionIsNext: false
                    });
                  }
                }}
                aria-label="Previous page"
              >
                <ArrowLeft className="mr-2" />
                Trang trước
              </Button>

              <Button
                size="sm"
                disabled={!hasNextPage || isFetching}
                onClick={() => {
                  if (data?.nextCursor) {
                    setPageParam({
                      queryPrevCursor: data.prevCursor,
                      queryNextCursor: data.nextCursor,
                      directionIsNext: true
                    });
                  }
                }}
                aria-label="Next page"
              >
                Trang sau
                <ArrowRight className="ml-2" />
              </Button>
            </div>
          </>
          : (
            <div className="text-center text-muted-foreground mt-10">
              <p>Chưa có đánh giá nào.</p>
              <p className="text-sm">Hãy là người đầu tiên đánh giá trải nghiệm của bạn tại {hotelName}!</p>
            </div>
           )
        }
      </div>
    </section>
  );
}