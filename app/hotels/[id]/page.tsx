import AvailableRoomsSection, { AvailableRoomsSectionSkeleton } from "./section-available-rooms";
import FacilitiesSection, { FacilitiesSectionSkeleton } from "./section-facilities";
import LocationSection, { LocationSectionSkeleton } from "./section-location";
import OverviewSection, { OverviewSectionSkeleton } from "./section-overview";
import ReviewSectionClient from "./section-review";

import Navbar from "./navbar";
import { notFound } from "next/navigation";
import SearchBar from "@/components/search-bar";
import { SearchBar_FormOutput, SearchBar_LocationType, SearchSpecWithoutLocation_Params, codec_SearchSpecWithoutLocation_Params } from "@/lib/zod_schemas/search-bar";
import prisma from "@/lib/prisma";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";


export default async function Page(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchSpecWithoutLocation_Params>;
}) {
  const [{ id: hotelId }, awaitedSearchParams] = await Promise.all([
    props.params,
    props.searchParams
  ]);

  const safeDecodedParams = codec_SearchSpecWithoutLocation_Params.safeParse(awaitedSearchParams);
  if (!safeDecodedParams.success) notFound()

  const searchBarFormData: SearchBar_FormOutput = {
    ...safeDecodedParams.data,
    location: {
      id: hotelId,
      type: "hotel" as SearchBar_LocationType,
    },
  };

  return (
    <>
      <div className="flex flex-col py-3 sticky top-0 shadow-lg bg-white z-20 gap-y-4">
        <SearchBar defaultValues={searchBarFormData} collapsible />
        <Navbar hotelId={hotelId} />
      </div>

      <main className="flex flex-col gap-y-4 content my-4 [&>section]:scroll-mt-32">
        <Suspense fallback={<OverviewSectionSkeleton /> } >
          <OverviewSection
            searchParams={awaitedSearchParams}
            hotelId={hotelId}
          />
        </Suspense>

        <Suspense fallback={<AvailableRoomsSectionSkeleton />}>
          <AvailableRoomsSection
            hotelId={hotelId}
            searchSpecWithoutLocation={awaitedSearchParams}
          />
        </Suspense>

        <Suspense fallback={<LocationSectionSkeleton />}>
          <LocationSection
            hotelId={hotelId}
            searchParams={awaitedSearchParams}
          />
        </Suspense>

        <Suspense fallback={<FacilitiesSectionSkeleton />}>
          <FacilitiesSection hotelId={hotelId} />
        </Suspense>

        <Suspense fallback={<ReviewSectionSkeleton />}>
          <ReviewSection hotelId={hotelId} />
        </Suspense>
      </main>
    </>
  );
}


async function ReviewSection({ hotelId }: { hotelId: string }) {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: {
      name: true,
      rating: true,
      numberOfReviews: true,
    }
  })
  if (!hotel) notFound()
  return (
    <ReviewSectionClient hotelId={hotelId} hotelName={hotel.name} rating={hotel.rating} numberOfReviews={hotel.numberOfReviews} />
  )
}

function ReviewSectionSkeleton() {
  return (
    <section id="review" className="w-full flex flex-col">
      <div className="rounded-4xl px-4 py-5 flex flex-col gap-y-5 shadow-xl">
        <Skeleton className="h-8 w-75" />
        <div className="flex flex-col lg:flex-row lg:items-center gap-y-6 lg:gap-y-0 lg:gap-x-12">
          <div className="flex gap-x-6 md:gap-x-12 flex-1">
            <Skeleton className="size-24 rounded-2xl md:size-32 md:rounded-4xl" />
            <div className="flex flex-col space-y-3">
              <Skeleton className="h-8 w-30" />
              <Skeleton className="h-6 w-30" />
            </div>
          </div>
        </div>

        <ul className="flex flex-col gap-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-30 w-full" />
          ))}
        </ul>
      </div>
    </section>
  )
}