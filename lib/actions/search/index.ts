"use server";

import prisma from "@/lib/prisma";
import { type SearchBar_FormInput } from "@/lib/zod_schemas/search-bar";

import { getHotelsBySearchBarForm } from "@/lib/generated/prisma/sql";
import { HotelCardProps } from "@/lib/types/hotel-card";
import { Decimal } from "@prisma/client/runtime/client";
import { FilterFormValues } from "@/lib/zod_schemas/filter";
import { FILTER_MAX_PRICE, FILTER_MIN_PRICE } from "@/lib/constants";

type SortType = "price_asc" | "price_desc" | "reviewPoints_desc";

// There is some kind of tagged union here:
// if sort is price_asc or price_desc, then lastPrice and lastHotelIndex are used for pagination
// if sort is reviewPoints_desc, then lastReviewPoints and lastHotelIndex are used for pagination
// so TODO: clean up the types.
export type CursorType = {
  lastPrice: Decimal | number | null;
  lastReviewPoints: number | null;
  lastHotelIndex: string; // this can't be null, because it must be something if the whole cursor exists.
  // if we want to indicate the end of the list, we can return null for the whole cursor instead of having nullable fields
}

// FIXME: not debounced or bind to the apply button yet.
export async function fetchSearchResult(
  searchBarFormValues: SearchBar_FormInput,
  filterFormValues: FilterFormValues,
  sort: SortType,
  cursor: CursorType | null,
  pageSize: number = 10,
): Promise<{
  items: HotelCardProps[];
  totalCount: number;
  nextCursor: CursorType | null
}> {
  const {
    location: { id: locationId, type: locationType },
    inOutDates: { from: checkInDate, to: checkOutDate },
    guestsAndRooms: { numAdults, numChildren, numRooms }
  } = searchBarFormValues;

  const {
    priceRange: [minPrice, maxPrice],
    propertyTypes: hotelTypes,
    amenities: facilities,
  } = filterFormValues;

  const lastPrice = cursor?.lastPrice ?? null;
  const lastReviewPoints = cursor?.lastReviewPoints ?? null;
  const lastHotelIndex = cursor?.lastHotelIndex ?? null;

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
    numChildren  // TODO: move this up with the numAdults.
  ));

  const items = result.map((hotel) => ({
    id: hotel.id,
    type: hotel.type,
    name: hotel.name,
    reviewPoints: hotel.reviewPoints,
    numberOfReviews: hotel.numberOfReviews,
    roomTypes: [{
      price: sort === 'price_desc'
        ? (hotel.maxPrice?.toNumber() || 0)
        : (hotel.minPrice?.toNumber() || 0)
    }],
    ward: {
      name: hotel.wardName,
      district: { province: { name: hotel.provinceName } }
    },
    imageUrls: hotel.thumbnailUrl ? [hotel.thumbnailUrl] : [], // TODO: cleanup.
    facilities: (hotel.facilityNames ?? []).map((facilityName: string) => ({ name: facilityName })),
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
        lastReviewPoints: lastItem.reviewPoints,
        lastHotelIndex: lastItem.id,
      }
      : null
  };
}