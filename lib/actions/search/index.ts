"use server";

import prisma from "@/lib/prisma";
import { type SearchBar_FormInput } from "@/lib/zod_schemas/search-bar";

import { getHotelsBySearchBarForm } from "@/lib/generated/prisma/sql";
import {
  HotelCardProps,
  //  HotelCardProps
} from "@/lib/types/hotel-card";
import { Decimal } from "@prisma/client/runtime/client";
import { FilterFormValues } from "@/lib/zod_schemas/filter";
import { FILTER_MAX_PRICE, FILTER_MIN_PRICE } from "@/lib/constants";
import { auth } from "@/auth";

export type SortType = "price_asc" | "price_desc" | "rating_desc";
// NOTE: There is some kind of tagged union here:
export type SearchResult_CursorType = {
  lastPrice: Decimal | number | null;
  lastReviewPoints: number | null;
  lastHotelIndex: string;
}


export async function user_getSearchResult(
  searchBarFormValues: SearchBar_FormInput,
  filterFormValues: FilterFormValues,
  sort: SortType,
  cursor: SearchResult_CursorType | null,
  pageSize: number = 10,
): Promise<{
  items: HotelCardProps[];
  totalCount: number;
  nextCursor: SearchResult_CursorType | null
}> {
  const {
    location: { id: locationId, type: locationType },
    inOutDates: { from: checkInDate, to: checkOutDate },
    guestsAndRooms: { numAdults, numChildren, numRooms }
  } = searchBarFormValues;

  const {
    priceRange: [minPrice, maxPrice],
    ratingRange: [minRating, maxRating],
    propertyTypes: hotelTypes,
    amenities: facilities,
  } = filterFormValues;

  const lastPrice = cursor?.lastPrice ?? null;
  const lastReviewPoints = cursor?.lastReviewPoints ?? null;
  const lastHotelIndex = cursor?.lastHotelIndex ?? null;

  const session = await auth();
  const userId = session?.user.id ?? null;

  const result = await prisma.$queryRawTyped(getHotelsBySearchBarForm(
    locationId,
    checkInDate,
    checkOutDate,
    numAdults,
    numRooms,
    pageSize,
    sort as string,
    lastPrice,
    lastReviewPoints,
    lastHotelIndex,
    locationType, // Temporarily put this at the end.
    minPrice,
    maxPrice,
    facilities,
    hotelTypes,
    numChildren,  // NOTE: move this up with the numAdults.
    userId,
    minRating,
    maxRating,
  ));

  const items = result.map((hotel) => ({
    id: hotel.id,
    name: hotel.name,
    thumbnailUrl: hotel.thumbnailUrl,
    rating: hotel.rating,
    numberOfReviews: hotel.numberOfReviews,
    type: hotel.type,
    wardName: hotel.wardName,
    provinceName: hotel.provinceName,
    price: sort === 'price_desc'
      ? (hotel.maxPrice?.toNumber() || 0)
      : (hotel.minPrice?.toNumber() || 0)
    ,
    facilityNames: hotel.facilityNames || [],
    isFavorited: hotel.isFavorited,
    totalCount: hotel.totalCount,
  }));

  const totalCount = result[0]?.totalCount ?? 0;
  const lastItem = result[pageSize - 1];

  return {
    items,
    totalCount,
    nextCursor: lastItem ?
      {
        lastPrice: sort === 'price_desc'
          ? (lastItem.maxPrice?.toNumber() ?? FILTER_MAX_PRICE)
          : (lastItem.minPrice?.toNumber() ?? FILTER_MIN_PRICE),
        lastReviewPoints: lastItem.rating,
        lastHotelIndex: lastItem.id,
      }
      : null
  };
}