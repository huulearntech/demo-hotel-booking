"use server";

import prisma from "@/lib/prisma";
import { getLocationsOrHotelsByString } from "../generated/prisma/sql";

export async function user_getLocationOrHotelByQueryString(query: string, similarity: number = 0.2) {
  const result = await prisma.$queryRawTyped(getLocationsOrHotelsByString(query, similarity));
  // FIXME: Don't have any fucking idea why the result can contain items with null id, type, or name.
  // It seems to be result of using UNION.
  return result.filter(item => item.id !== null && item.type !== null && item.name !== null) as Array<{ id: string, type: string, name: string }>;
}