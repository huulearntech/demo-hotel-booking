import Image from "next/image"
import { tvlk_favicon, tvlk_logo_text_dark } from "@/public/logos"
import { ThumbsUp } from "lucide-react"

import { differenceInDays } from "date-fns"

import { fetchHotel } from "@/lib/actions/hotel"

// TODO: standardize the types inferred from server actions
type Hotel = NonNullable<Awaited<ReturnType<typeof fetchHotel>>>;

export default async function ReviewSection({
  hotelName,
  bookingsMetadata,
  reviewPoints,
  numberOfReviews,
}: {
  hotelName: Hotel["name"],
  bookingsMetadata: Hotel["bookingsMetadata"],
  reviewPoints: Hotel["reviewPoints"],
  numberOfReviews: Hotel["numberOfReviews"],
}) {
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
                <Image src={tvlk_logo_text_dark} alt="traveloka" className="h-6.25 w-auto"/>
              </div>
            </div>
          </div>
        </div>

        <ul className="flex flex-col gap-y-3">
          {bookingsMetadata.map((meta, index) => (
            <li key={meta.booking!.id || index}> <ReviewCard meta={meta} /> </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ReviewCard({
  meta
}: {
  meta: Hotel["bookingsMetadata"][number]
}) {
  if (!meta.booking?.review) return null;
  const today = new Date();
  const diff = differenceInDays(today, meta.booking.review.createdAt);
  let timeAgo = "";
  if (diff < 1) {
    timeAgo = "hôm nay";
  } else if (diff < 7) {
    timeAgo = `cách đây ${diff} ngày trước`;
  } else if (diff < 30) {
    timeAgo = `cách đây ${Math.floor(diff / 7)} tuần trước`;
  } else {
    timeAgo = `cách đây ${Math.floor(diff / 30)} tháng trước`;
  }

  return (
    <div className="px-6 py-4 rounded-xl border flex gap-x-12 h-40">
      <div className="flex flex-col items-center gap-y-2 shrink-0 w-1/6">
        <Image
          src={meta.user.profileImageUrl ?? tvlk_favicon}
          alt=""
          className="rounded-full w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24"
          width={64}
          height={64}
        />
        <div className="font-bold text-center truncate w-full">{meta.user.name}</div>
      </div>

      <div className="flex flex-col justify-between">
        <div className="flex flex-col gap-y-2">
          <div className="flex gap-x-4 items-center">
            <div className="px-2.5 py-0.5 rounded-full bg-blue-50 flex items-center justify-center space-x-1">
              <Image src={tvlk_favicon} alt="" aria-hidden className="size-4.5" />
              <div className="flex items-end gap-x-0.5">
                <div className="text-primary font-bold">{meta.booking.review.rating}</div>
                <div className="text-sm font-medium">/</div>
                <div className="text-sm font-medium">10</div>
              </div>
            </div>

            <div className="text-sm font-bold mt-2 sm:mt-0"> Đánh giá {timeAgo} </div>
          </div>

          <p className="text-sm font-medium">{meta.booking.review.comment}</p>
        </div>

        <div className="flex items-center space-x-2">
          <ThumbsUp className="size-5"/>
          <div className="text-sm font-bold text-primary">Đánh giá này hữu ích không?</div>
        </div>
      </div>
    </div>
  )
};