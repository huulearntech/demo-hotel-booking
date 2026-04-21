// FIXME: "Xem thêm" button kinda overlap with the reply.
"use client";

import { useState } from "react";
import Image from "next/image";
import { differenceInDays } from "date-fns";
import { user_getReviewsOfHotel } from "@/lib/actions/reviews";
import { tvlk_favicon } from "@/public/logos";
import { MAX_REVIEW_POINTS } from "@/lib/constants";
import { ChevronDownIcon } from "lucide-react";

export default function ReviewCard({
  review,
}: {
  review: Awaited<ReturnType<typeof user_getReviewsOfHotel>>["reviews"][number];
}) {
  const [open, setOpen] = useState(false);

  const today = new Date();
  const diff = differenceInDays(today, new Date(review.created_at));
  let timeAgo = "";
  if (diff < 1) {
    timeAgo = "hôm nay";
  } else if (diff < 7) {
    timeAgo = `cách đây ${diff} ngày`;
  } else if (diff < 30) {
    timeAgo = `cách đây ${Math.floor(diff / 7)} tuần`;
  } else {
    timeAgo = `cách đây ${Math.floor(diff / 30)} tháng`;
  }

  const reply = review.reply ?? null;
  const hasReply = !!reply;

  return (
    <details
      className="group data-[open=true]:h-fit px-6 py-4 rounded-xl border bg-white"
      open={open}
      data-open={open}
    >
      <summary className="list-none cursor-pointer marker:content-['']">
        <div className="flex gap-x-12">
          <div className="flex flex-col items-center gap-y-2 shrink-0 w-1/6">
            <Image
              src={review.author_profile_image ?? tvlk_favicon}
              alt=""
              className="rounded-full w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24"
              width={64}
              height={64}
            />
            <div className="font-bold text-center truncate w-full">
              {review.author_name}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex gap-x-4 items-start">
              <div className="px-2.5 py-0.5 rounded-full bg-blue-50 flex items-center justify-center space-x-1">
                <Image src={tvlk_favicon} alt="" aria-hidden className="size-4.5" />
                <div className="flex items-end gap-x-0.5">
                  <div className="text-primary font-bold">{review.rating}</div>
                  <div className="text-sm font-medium">/</div>
                  <div className="text-sm font-medium">{MAX_REVIEW_POINTS}</div>
                </div>
              </div>

              <div className="text-sm font-bold mt-2 sm:mt-0"> Đánh giá {timeAgo} </div>
            </div>

            <p className="text-sm font-medium mt-3 whitespace-pre-wrap">{review.comment}</p>

            {hasReply && (
              <div className="relative overflow-hidden transition-all duration-200 mt-3 h-24 group-data-[open=true]:h-fit" >
                <div className="px-4 py-3 rounded-md bg-gray-50 border text-sm text-gray-800 whitespace-pre-wrap">
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    Phản hồi từ chủ khách sạn:
                  </div>
                  <div>{reply}</div>

                  {review.replied_at && (
                    <div className="text-xs text-muted-foreground mt-2 hidden data-[open=true]:block">
                      {new Date(review.replied_at).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="group-data-[open=true]:hidden pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-white to-transparent" />
                <div
                  className="absolute bottom-2 right-3 text-sm text-primary font-medium reply-gradient flex items-center gap-x-1"
                  onClick={() => setOpen(!open)}
                >
                  {open ? "Thu gọn" : "Xem thêm"}
                  <ChevronDownIcon className="size-5 transition-transform group-data-[open=true]:-rotate-180" />
                </div>
              </div>
            )}
          </div>
        </div>
      </summary>
    </details>
  );
}
