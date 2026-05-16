"use server";

import prisma from "@/lib/prisma";
import { getLocationsOrHotelsByString } from "../generated/prisma/sql";
import { SearchBar_LocationType } from "../zod_schemas/search-bar";

export async function user_getLocationOrHotelByQueryString(query: string, similarity: number = 0.2) {
  const result = await prisma.$queryRawTyped(getLocationsOrHotelsByString(query, similarity));
  // FIXME: Don't have any fucking idea why the result can contain items with null id, type, or name.
  // It seems to be result of using UNION.
  return result.filter(item => item.id !== null && item.type !== null && item.name !== null) as Array<{ id: string, type: string, name: string }>;
}

export async function user_getLocationNameOrHotelNameById(id: string, type: SearchBar_LocationType) {
  let result: string | null = null;
  if (type === "hotel") {
    result = await prisma.hotel
      .findUnique({ where: { id }, select: { name: true } })
      .then(hotel => hotel?.name ?? null);
  }
  else if (type === "province") {
    result = await prisma.province
      .findUnique({ where: { id }, select: { name: true } })
      .then(province => province?.name ?? null);
  }
  else if (type === "ward") {
    result = await prisma.ward
      .findUnique({ where: { id }, select: { name: true } })
      .then(ward => ward?.name ?? null);
  }
  return result;
}

export async function user_getDefaultSearchBarLocations() {
  const top_destinations = await prisma.province.findMany({
    where: {
      code: {
        in: ["48", "01", "79", "31", "92"]
      }
    },
    select: {
      id: true,
      name: true,
    }
  });

  return top_destinations.map(dest => ({
    id: dest.id,
    name: dest.name,
    type: "province" as SearchBar_LocationType,
  }));
}