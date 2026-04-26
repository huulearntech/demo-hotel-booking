"use server";

import { draft_HotelCardProps } from "@/lib/types/hotel-card";
import prisma from "@/lib/prisma";
import { get10HotelsOf5Provinces } from "../generated/prisma/sql";
import { JsonValue } from "@prisma/client/runtime/client";


type FeedProps = { provinceName: string, hotels: draft_HotelCardProps[] }[];
type HotelRow = {
  province_id: string
  province_name: string
  hotels: JsonValue | null
}

export async function fetchFeed(): Promise<FeedProps> {
  const rows = await prisma
    .$queryRawTyped(get10HotelsOf5Provinces());

  return rows
    .filter((item: HotelRow) => item.hotels != null)
    .map((item: HotelRow) => ({
      provinceName: item.province_name,
      hotels: item.hotels as draft_HotelCardProps[],
    }));
}