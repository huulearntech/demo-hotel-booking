import AvailableRoomsSection from "./section-available-rooms";
import FacilitiesSection from "./section-facilities";
import LocationSection from "./section-location";
import OverviewSection from "./section-overview";
import ReviewSection from "./section-review";

import { fetchHotel, get5ReviewsAboutHotelForOverview, user_getAvailableRoomTypeOfHotel } from "@/lib/actions/hotel";
import Navbar from "./navbar";
import { notFound } from "next/navigation";
import SearchBar from "@/components/search-bar";
import { SearchBar_FormOutput, SearchBar_LocationType, SearchSpecWithoutLocation_Params, codec_SearchSpecWithoutLocation_Params } from "@/lib/zod_schemas/search-bar";
import { fetchPoiCategoriesWithPlaces } from "@/lib/actions/hotel-poi";


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

  const hotel = await fetchHotel(hotelId);
  if (!hotel) notFound()

  const {
    inOutDates: { from: checkInDate, to: checkOutDate },
    guestsAndRooms: { numAdults, numChildren, numRooms }
  } = safeDecodedParams.data;

  const [roomTypes, reviews] = await Promise.all([
    user_getAvailableRoomTypeOfHotel(
      hotelId,
      checkInDate,
      checkOutDate,
      numAdults,
      numChildren,
      numRooms
    ),
    get5ReviewsAboutHotelForOverview(hotelId),
  ]);

  const searchBarFormData: SearchBar_FormOutput = {
    ...safeDecodedParams.data,
    location: {
      id: hotelId,
      type: "hotel" as SearchBar_LocationType,
    },
  };

  // const poiCategoriesWithPlaces = await fetchPoiCategoriesWithPlaces(hotel.longitude, hotel.latitude);
  const poiCategoriesWithPlaces = [] as Awaited<ReturnType<typeof fetchPoiCategoriesWithPlaces>>; // TODO: fetch real data

  return (
    <>
      <div className="flex flex-col py-3 sticky top-0 shadow-lg bg-white z-20 gap-y-4">
        <SearchBar defaultValues={searchBarFormData} collapsible />
        <Navbar hotelId={hotel.id} />
      </div>
      <main className="flex flex-col gap-y-4 content my-4 [&>section]:scroll-mt-32">
        <OverviewSection
          searchParams={awaitedSearchParams}
          hotel={hotel}
          poiCategoriesWithPlaces={poiCategoriesWithPlaces}
          reviews={reviews}
        />
        <AvailableRoomsSection
          hotelName={hotel.name}
          roomTypes={roomTypes}
          searchSpecWithoutLocation={awaitedSearchParams}
        />
        <LocationSection hotel={hotel} poiCategoriesWithPlaces={poiCategoriesWithPlaces}/>
        <FacilitiesSection hotel={hotel} />
        <ReviewSection
          hotelName={hotel.name}
          hotelId={hotel.id}
          numberOfReviews={hotel.numberOfReviews}
          rating={hotel.rating}
        />
      </main>
    </>
  );
}