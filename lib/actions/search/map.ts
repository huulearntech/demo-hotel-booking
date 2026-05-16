"use server";
import prisma from "@/lib/prisma";
import { getHotelsByBoundingBox as core_getHotelsByBoundingBox } from "@/lib/generated/prisma/sql";
import { SearchBar_FormOutput, SearchBar_LocationType } from "@/lib/zod_schemas/search-bar";
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
    ratingRange: [minRating, maxRating],
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
    minRating,
    maxRating,
  )).then(hotels => hotels.map(hotel => ({
    ...hotel,
    price: hotel.price?.toNumber() || 0, // convert Decimal to number, default to 0 if price is null
  })));

  return hotels;
}

export type Map_HotelCardProps = Awaited<ReturnType<typeof getHotelsByBoundingBox>>[number];

export async function getCentroidOfRegion({
  id,
  type,
}: {
  id: string,
  type: SearchBar_LocationType;
}) {
  if (type === "province") {
    return prisma.province.findUnique({
      where: { id },
      select: {
        centroidLat: true,
        centroidLng: true,
      }
    });
  } else if (type === "ward") {
    return prisma.ward.findUnique({
      where: { id },
      select: {
        centroidLat: true,
        centroidLng: true,
      }
    });
  } else {
    throw new Error("Invalid location type");
  }
}
