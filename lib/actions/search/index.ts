"use server";

import prisma from "@/lib/prisma";
import { type SearchBarFormData } from "@/lib/zod_schemas/search-bar";

import { getHotelsBySearchBarForm } from "@/lib/generated/prisma/sql";
import { HotelCardProps } from "@/lib/types/hotel-card";
import { Decimal } from "@prisma/client/runtime/client";

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

export async function fetchSearchResult(
  searchBarFormValues: SearchBarFormData,
  pageSize: number,
  sort: SortType,
  cursor: CursorType | null
): Promise<{ items: HotelCardProps[]; totalCount: number; nextCursor: CursorType | null }> {
  const {
    location,
    inOutDates: { from, to },
    guestsAndRooms: { numAdults, numChildren, numRooms }
  } = searchBarFormValues;

  const lastPrice = cursor?.lastPrice ?? null;
  const lastReviewPoints = cursor?.lastReviewPoints ?? null;
  const lastHotelIndex = cursor?.lastHotelIndex ?? null;

  // TODO: filter facilities
  const result = await prisma.$queryRawTyped(getHotelsBySearchBarForm(
    location,
    from,
    to,
    numAdults,
    numRooms,
    sort as string,
    pageSize,
    lastPrice,
    lastReviewPoints,
    lastHotelIndex
  ));

  const items = result.map((hotel) => ({
    id: hotel.id,
    type: hotel.type,
    name: hotel.name,
    reviewPoints: hotel.reviewPoints,
    numberOfReviews: hotel.numberOfReviews,
    roomTypes: [{
      price: sort === 'price_desc'
        ? (hotel.maxPrice?.toNumber?.() || 0)
        : (hotel.minPrice?.toNumber?.() || 0)
    }],
    ward: {
      name: hotel.wardName,
      district: { province: { name: hotel.provinceName } }
    },
    imageUrls: hotel.imageUrls ?? [],
    facilities: (hotel.facilityNames ?? []).map((facilityName: string) => ({ name: facilityName })),
  }));
  const totalCount = result[0]?.totalCount ?? 0;
  const lastItem = result[result.length - 1];
  
  // totalCount being fetch over and over again for every page is not ideal, but it's a tradeoff to avoid a separate count query. We can optimize later if needed.
  return {
    items,
    totalCount,
    nextCursor: lastItem ?
      {
        lastPrice: lastItem.minPrice!.toNumber(), // TODO: depend on sort order.
        lastReviewPoints: lastItem.reviewPoints,
        lastHotelIndex: lastItem.id,
      }
      : null
  };
}