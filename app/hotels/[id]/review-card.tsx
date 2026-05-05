"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { tvlk_favicon } from "@/public/logos";
import { MAX_REVIEW_POINTS } from "@/lib/constants";
import { ChevronDownIcon } from "lucide-react";
import { vi } from "date-fns/locale";
import { getReviewsOfHotel } from "@/lib/generated/prisma/sql";

export default function ReviewCard({
  review,
}: {
  review: getReviewsOfHotel.Result;
}) {
  const [open, setOpen] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: vi });

  const reply = review.reply ?? null;
  const hasReply = !!reply;

  return (
    <div
      className="group data-[open=true]:h-fit px-6 py-4 rounded-xl border bg-white flex flex-col md:flex-row gap-x-12 gap-y-2 md:gap-y-0"
      data-open={open}
    >
      <div className="flex md:flex-col items-center gap-x-4 md:gap-x-0 md:gap-y-2 shrink-0 w-full md:w-1/6">
        <Image
          src={review.authorProfileImageUrl ?? tvlk_favicon}
          alt=""
          className="rounded-full w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24"
          width={64}
          height={64}
        />
        <div className="truncate flex flex-col gap-1">
          <span className="font-bold">{review.authorName}</span>

          <div className="flex gap-x-4 items-center md:hidden">
            <div className="px-2.5 py-0.5 rounded-full bg-blue-50 flex items-center justify-center space-x-1">
              <Image src={tvlk_favicon} alt="" aria-hidden className="size-4.5" />
              <div className="flex items-end gap-x-0.5">
                <div className="text-primary font-bold">{review.rating}</div>
                <div className="text-sm font-medium">/</div>
                <div className="text-sm font-medium">{MAX_REVIEW_POINTS}</div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground"> Đánh giá {timeAgo} </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="hidden md:flex gap-x-4 items-center">
          <div className="px-2.5 py-0.5 rounded-full bg-blue-50 flex items-center justify-center space-x-1">
            <Image src={tvlk_favicon} alt="" aria-hidden className="size-4.5" />
            <div className="flex items-end gap-x-0.5">
              <div className="text-primary font-bold">{review.rating}</div>
              <div className="text-sm font-medium">/</div>
              <div className="text-sm font-medium">{MAX_REVIEW_POINTS}</div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground"> Đánh giá {timeAgo} </div>
        </div>

        <p className="text-sm font-medium mt-3 whitespace-pre-wrap">{review.comment}</p>

        {hasReply && (
          <>
            <div className="relative overflow-hidden transition-all duration-200 mt-3 h-24 group-data-[open=true]:h-fit" >
              <div className="px-4 py-3 rounded-md bg-gray-50 border text-sm text-gray-800 whitespace-pre-wrap">
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Phản hồi từ chủ khách sạn:
                </div>
                <div>{reply}</div>

                {review.repliedAt && (
                  <div className="text-xs text-muted-foreground mt-2 hidden data-[open=true]:block">
                    {new Date(review.repliedAt).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="group-data-[open=true]:hidden pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-white to-transparent" />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setOpen(!open)}
                className="inline-flex items-center gap-x-1 mt-1 cursor-pointer text-sm text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {open ? "Thu gọn" : "Xem thêm"}
                <ChevronDownIcon className="size-5 transition-transform group-data-[open=true]:-rotate-180" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}