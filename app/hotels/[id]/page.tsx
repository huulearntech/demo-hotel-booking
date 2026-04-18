import AvailableRoomsSection from "./section-available-rooms";
import FacilitiesSection from "./section-facilities";
import LocationSection from "./section-location";
import OverviewSection from "./section-overview";
import ReviewSection from "./section-review";

import { fetchHotel } from "@/lib/actions/hotel";
import Navbar from "./navbar";
import { notFound } from "next/navigation";
import SearchBar from "@/components/search-bar";
import { SearchBar_FormOutput, SearchBar_LocationType, SearchSpec, codec_searchSpec } from "@/lib/zod_schemas/search-bar";
import { fetchPoiCategoriesWithPlaces } from "@/lib/actions/hotel-poi";


export default async function Page(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchSpec>;
}) {
  const [{ id: hotelId }, awaitedSearchParams] = await Promise.all([
    props.params,
    props.searchParams
  ]);
  const hotel = await fetchHotel(hotelId);
  const safeDecodedParams = codec_searchSpec.safeParse(awaitedSearchParams);
  if (!safeDecodedParams.success || !hotel) notFound()

  const {
    reviewPoints,
    numberOfReviews
  } = hotel;

  const searchBarFormData: SearchBar_FormOutput = {
    ...safeDecodedParams.data,
    location: {
      id: hotel.id,
      type: "hotel" as SearchBar_LocationType,
    },
  };

  // const poiCategoriesWithPlaces = await fetchPoiCategoriesWithPlaces(hotel.longitude, hotel.latitude);
  const poiCategoriesWithPlaces = [] as Awaited<ReturnType<typeof fetchPoiCategoriesWithPlaces>>; // TODO: fetch real data

  return (
    <>
      <div className="flex flex-col py-3 sticky top-0 shadow-lg bg-white z-20 gap-y-4">
        <SearchBar defaultValues={searchBarFormData} collapsible />
        <Navbar />
      </div>
      <main className="flex flex-col gap-y-4 content my-4 [&>section]:scroll-mt-35">
        <OverviewSection
          searchParams={awaitedSearchParams}
          hotel={hotel}
          poiCategoriesWithPlaces={poiCategoriesWithPlaces}
        />
        <AvailableRoomsSection hotelId={hotel.id} hotelName={hotel.name} searchBarFormData={searchBarFormData}/>
        <LocationSection hotel={hotel} poiCategoriesWithPlaces={poiCategoriesWithPlaces}/>
        <FacilitiesSection hotel={hotel} />
        <ReviewSection hotelName={hotel.name} hotelId={hotel.id} numberOfReviews={numberOfReviews} reviewPoints={reviewPoints}/>
      </main>
    </>
  );
}