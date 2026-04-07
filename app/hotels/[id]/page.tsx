import AvailableRoomsSection from "./section-available-rooms";
import FacilitiesSection from "./section-facilities";
import LocationSection from "./section-location";
import OverviewSection from "./section-overview";
import PolicySection from "./section-policy";
import ReviewSection from "./section-review";

import { fetchHotel } from "@/lib/actions/hotel";
import Navbar from "./navbar";
import { notFound } from "next/navigation";
import SearchBar from "@/components/search-bar";
import { SearchParams, SearchParamsCodec } from "@/lib/zod_schemas/search-bar";
import { fetchPoiCategoriesWithPlaces } from "@/lib/actions/hotel-poi";


// TODO: This page is not yet responsive
// TODO: add default value for searchbar: location = hotel name, other specs stay the same as the search result page.
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
    // TODO: change search params to default values instead of showing 404 page
    notFound();
  }

  // TODO: there should be query with search params to fetch hotel data.
  const hotel = await fetchHotel(hotelId);
  if (!hotel) {
    notFound();
  }

  safeDecodedParams.data.location = hotel.name; // override the location in search params with hotel name

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
        <SearchBar defaultValues={safeDecodedParams.data} />
        <Navbar />
      </div>
      <main className="flex flex-col gap-y-4 content my-4 [&>section]:scroll-mt-35">
        <OverviewSection hotel={hotel} poiCategoriesWithPlaces={poiCategoriesWithPlaces}/>
        <AvailableRoomsSection hotelId={hotel.id} />
        <LocationSection hotel={hotel} poiCategoriesWithPlaces={poiCategoriesWithPlaces}/>
        <FacilitiesSection hotel={hotel} />
        <PolicySection hotelName={hotelName} />
        <ReviewSection hotelName={hotelName} bookingsMetadata={bookingsMetadata} reviewPoints={reviewPoints} numberOfReviews={numberOfReviews} />
      </main>
    </>
  );
}