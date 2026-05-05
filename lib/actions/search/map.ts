"use server";
import prisma from "@/lib/prisma";
import { getHotelsByBoundingBox as core_getHotelsByBoundingBox } from "@/lib/generated/prisma/sql";
import { SearchBar_FormOutput } from "@/lib/zod_schemas/search-bar";
import { FilterFormValues } from "@/lib/zod_schemas/filter";

export type BBox = {
  west: number;
  south: number;
  east: number;
  north: number;
}

export async function getHotelsByBoundingBox(
  bbox: BBox,
  searchBarFormValues: SearchBar_FormOutput, // This is currently called "search spec", though it is not correct term.
  filterFormValues: FilterFormValues,
  pageSize: number = 20,
) {
  const { west, south, east, north } = bbox;
  const {
    inOutDates: { from: checkInDate, to: checkOutDate },
    guestsAndRooms: { numAdults, numChildren, numRooms }
  } = searchBarFormValues;

  const {
    priceRange: [minPrice, maxPrice],
    propertyTypes: hotelTypes,
    amenities: facilities,
  } = filterFormValues;

  const hotels = await prisma.$queryRawTyped(core_getHotelsByBoundingBox(
    checkInDate,
    checkOutDate,
    numAdults,
    numRooms,
    pageSize,


    north,
    south,
    west,
    east,


    minPrice,
    maxPrice,
    facilities,
    hotelTypes,


    numChildren,  // NOTE: move this up with the numAdults.
  )).then(hotels => hotels.map(hotel => ({
    ...hotel,
    price: hotel.price?.toNumber() || 0, // convert Decimal to number, default to 0 if price is null
  })));
  console.log("hotels fetched by map",hotels);

  return hotels;
}

export type Map_HotelCardProps = Awaited<ReturnType<typeof getHotelsByBoundingBox>>[number];
