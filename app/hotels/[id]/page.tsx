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

import {
  LucideFerrisWheel,
  Store,
  ForkKnifeCrossed,
  BusFront,
  TreePalm,
  type LucideIcon
} from "lucide-react";

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

  const poiCategories = [
    "entertainment",
    "catering",
    "commercial.shopping_mall",
    "leisure",
    "public_transport",
  ] as const;
  type PoiType = (typeof poiCategories)[number];

  const poiIcons: Record<PoiType, LucideIcon> = {
    entertainment: LucideFerrisWheel,
    catering: ForkKnifeCrossed,
    "commercial.shopping_mall": Store,
    leisure: TreePalm,
    public_transport: BusFront,
  };
  const poiCategoriesWithPlaces = [
    {
      key: "entertainment",
      icon: poiIcons.entertainment,
      name: "Entertainment",
      places: [
        {
          name: "City Amusements lorem ipsum dolor sit amet consectetur adipiscing elit",
          address: "123 Fun St",
          distance: "320 m",
        },
        {
          name: "Old Theatre",
          address: "45 Stage Rd",
          distance: "500 m",
        },
      ],
    },
    {
      key: "catering",
      icon: poiIcons.catering,
      name: "Restaurants & Cafés",
      places: [
        {
          name: "La Pasta Bistro",
          address: "12 Main St",
          distance: "150 m",
        },
        {
          name: "Sunrise Coffee",
          address: "5 Coffee Ln",
          distance: "200 m",
        },
      ],
    },
    {
      key: "commercial.shopping_mall",
      icon: poiIcons["commercial.shopping_mall"],
      name: "Shopping",
      places: [
        {
          name: "Market Mall",
          address: "34 Market Ave",
          distance: "400 m",
        },
      ],
    },
    {
      key: "leisure",
      icon: poiIcons.leisure,
      name: "Leisure",
      places: [
        {
          name: "Riverwalk",
          address: "Riverfront",
          distance: "300 m",
        },
        {
          name: "City Park",
          address: "Park Lane",
          distance: "1.2 km",
        },
      ],
    },
    {
      key: "public_transport",
      icon: poiIcons.public_transport,
      name: "Public transport",
      places: [
        {
          name: "Central Station",
          address: "Station Rd",
          distance: "500 m",
        },
      ],
    },
  ] as Awaited<ReturnType<typeof fetchPoiCategoriesWithPlaces>>;

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
        <LocationSection
          hotel={hotel}
          poiCategoriesWithPlaces={poiCategoriesWithPlaces}
          searchParams={awaitedSearchParams}
        />
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