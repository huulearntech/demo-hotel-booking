import AvailableRoomsSection from "./section-available-rooms";
import FacilitiesSection from "./section-facilities";
import LocationSection from "./section-location";
import OverviewSection from "./section-overview";
import ReviewSection from "./section-review";

import { fetchHotel } from "@/lib/actions/hotel";
import Navbar from "./navbar";
import { notFound } from "next/navigation";
import SearchBar from "@/components/search-bar";
import { SearchParams, SearchParamsCodec } from "@/lib/zod_schemas/search-bar.draft";
import { fetchPoiCategoriesWithPlaces } from "@/lib/actions/hotel-poi";


export default async function Page(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>;
}) {
  const [{ id: hotelId }, searchParams] = await Promise.all([
    props.params,
    props.searchParams
  ]);

  const safeDecodedParams = SearchParamsCodec.safeDecode(searchParams);
  if (!safeDecodedParams.success) {
    // TODO: Handle trolling parameter or show the 404 page.
    notFound();
  }

  // TODO: there should be query with search params to fetch hotel data.
  const hotel = await fetchHotel(hotelId);
  if (!hotel) {
    notFound();
  }

  safeDecodedParams.data.location = {
    id: hotel.id,
    type: "hotel",
    name: hotel.name,
  }; // override the location in search params with hotel name

  const {
    name: hotelName,
    bookingsMetadata,
    reviewPoints,
    numberOfReviews
  } = hotel;

  // const poiCategoriesWithPlaces = await fetchPoiCategoriesWithPlaces(hotel.longitude, hotel.latitude);
  const poiCategoriesWithPlaces = [] as Awaited<ReturnType<typeof fetchPoiCategoriesWithPlaces>>; // TODO: fetch real data

  return (
    <>
      <div className="flex flex-col py-3 sticky top-0 shadow-lg bg-white z-20 gap-y-4">
        <SearchBar defaultValues={safeDecodedParams.data} collapsible/>
        <Navbar />
      </div>
      <main className="flex flex-col gap-y-4 content my-4 [&>section]:scroll-mt-35">
        <OverviewSection hotel={hotel} poiCategoriesWithPlaces={poiCategoriesWithPlaces}/>
        <AvailableRoomsSection hotelId={hotel.id} hotelName={hotelName} searchBarFormData={safeDecodedParams.data}/>
        <LocationSection hotel={hotel} poiCategoriesWithPlaces={poiCategoriesWithPlaces}/>
        <FacilitiesSection hotel={hotel} />
        <ReviewSection hotelName={hotelName} bookingsMetadata={bookingsMetadata} reviewPoints={reviewPoints} numberOfReviews={numberOfReviews} />
      </main>
    </>
  );
}