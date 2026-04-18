import Image from "next/image"
import { tvlk_favicon, tvlk_logo_text_dark } from "@/public/logos"

import { differenceInDays } from "date-fns"

import { fetchHotel } from "@/lib/actions/hotel"
import { user_getReviewsOfHotel } from "@/lib/actions/reviews"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { MAX_REVIEW_POINTS } from "@/lib/constants"

// TODO: standardize the types inferred from server actions
type Hotel = NonNullable<Awaited<ReturnType<typeof fetchHotel>>>;

// Fuck you Copilot for deleting my code. What are you? You are just a probabilistic machine.
// You replaced my code with idiotic code.
export default async function ReviewSection({
  hotelId,
  hotelName,
  reviewPoints,
  numberOfReviews,
  cursorCreatedAt = null,
  cursorId = null,
  pageSize = 1,
}: {
  hotelId: string,
  hotelName: Hotel["name"],
  reviewPoints: number,
  numberOfReviews: number,
  cursorCreatedAt?: string | null,
  cursorId?: string | null,
  pageSize?: number,
}) {
  // fetch page server-side
  const { reviews, nextCursor, prevCursor } = await user_getReviewsOfHotel(
    hotelId,
    cursorCreatedAt ? new Date(cursorCreatedAt) : undefined,
    cursorId ?? undefined,
    pageSize
  );

  const prevHref = prevCursor
    ? `?cursorCreatedAt=${encodeURIComponent(prevCursor.createdAt.toISOString())}&cursorId=${prevCursor.id}&direction=before`
    : null;

  const nextHref = nextCursor
    ? `?cursorCreatedAt=${encodeURIComponent(nextCursor.createdAt.toISOString())}&cursorId=${nextCursor.id}&direction=after`
    : null;

  return (
    <section id="review" className="w-full flex flex-col">
      <div className="rounded-4xl px-4 py-5 flex flex-col gap-y-5 shadow-xl">
        <h2 className="font-bold text-[1.25rem]">Những review của khách về {hotelName}</h2>
        <div className="flex flex-col lg:flex-row lg:items-center gap-y-6 lg:gap-y-0 lg:gap-x-12">
          <div className="flex space-x-12 flex-1">
            {numberOfReviews > 0 &&
              <div className="flex shrink-0 items-center justify-center size-32 rounded-4xl bg-linear-[137deg] from-[rgb(245,251,255)] from-0% via-[rgb(209,240,255)] via-[46.1%] to-[rgb(245,251,255)] to-[96.84%]">
                <div className="flex items-center justify-center size-24 border-4 border-white rounded-3xl">
                  <div className="text-center text-[3rem] font-bold text-primary">{reviewPoints.toFixed(1)}</div>
                </div>
              </div>
            }
            <div className="flex flex-col space-y-3">
              {numberOfReviews > 0 &&
                <div className="text-[1.25rem] font-bold">Từ {numberOfReviews} đánh giá</div>
              }
              <div className="font-medium flex">
                <div className="whitespace-pre">Bởi khách du lịch trong </div>
                <Image src={tvlk_logo_text_dark} alt="hoteloka" className="h-6.25 w-auto"/>
              </div>
            </div>
          </div>
        </div>

        <ul className="flex flex-col gap-y-3">
          {reviews.map((r) => (
            <li key={r.review_id}> <ReviewCard review={r} /> </li>
          ))}
        </ul>

        {/** TODO: fix this AI bullshit */}
        <div className="flex items-center justify-end gap-x-4 mt-4">
          <div>
            {prevHref ? (
              <Link href={prevHref} aria-label="Previous page">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2" />
                Trang trước
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ArrowLeft className="mr-2" />
                Trang trước
              </Button>
            )}
          </div>

          <div>
            {nextHref ? (
              <Link href={nextHref} aria-label="Next page">
                <Button size="sm">
                  Trang sau
                  <ArrowRight className="ml-2" />
                </Button>
              </Link>
            ) : (
              <Button size="sm" disabled>
                  Trang sau
                <ArrowRight className="ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
};


// TODO: remove like button for simplicity.
function ReviewCard({ review }: { review: Awaited<ReturnType<typeof user_getReviewsOfHotel>>['reviews'][number] }) {
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

  return (
    <div className="px-6 py-4 rounded-xl border flex gap-x-12 h-40">
      <div className="flex flex-col items-center gap-y-2 shrink-0 w-1/6">
        <Image
          src={review.author_profile_image ?? tvlk_favicon}
          alt=""
          className="rounded-full w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24"
          width={64}
          height={64}
        />
        <div className="font-bold text-center truncate w-full">{review.author_name}</div>
      </div>

      <div className="flex flex-col justify-between">
        <div className="flex flex-col gap-y-2">
          <div className="flex gap-x-4 items-center">
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

          <p className="text-sm font-medium">{review.comment}</p>
        </div>
      </div>
    </div>
  )
};