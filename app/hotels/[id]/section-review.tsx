import Image from "next/image"
import { tvlk_logo_text_dark } from "@/public/logos"

import { user_getReviewsOfHotel } from "@/lib/actions/reviews"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"

import ReviewCard from "./review-card"


export default async function ReviewSection({
  hotelId,
  hotelName,
  rating,
  numberOfReviews,
  cursorCreatedAt = null,
  cursorId = null,
  pageSize = 1,
}: {
  hotelId: string,
  hotelName: string,
  rating: number,
  numberOfReviews: number,
  cursorCreatedAt?: string | null,
  cursorId?: string | null,
  pageSize?: number,
}) {
  // TODO: fix this AI bullshit pagination.
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
                  <div className="text-center text-[3rem] font-bold text-primary">{rating.toFixed(1)}</div>
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
            <li key={r.reviewId}> <ReviewCard review={r} /> </li>
          ))}
        </ul>

        <div className="flex items-center justify-end gap-x-4 mt-4">
          <Button asChild variant="outline" size="sm" disabled>
            <Link href={prevHref || "#"} aria-label="Previous page">
              <ArrowLeft className="mr-2" />
              Trang trước
            </Link>
          </Button>

          <Button asChild size="sm" disabled={!nextHref}>
            <Link href={nextHref || "#"} aria-label="Next page">
              Trang sau
              <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
};