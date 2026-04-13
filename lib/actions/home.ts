"use server";

import { HotelCardProps } from "@/lib/types/hotel-card";
import prisma from "@/lib/prisma";
import { get10HotelsOf5Provinces } from "../generated/prisma/sql";
import { JsonValue } from "@prisma/client/runtime/client";


type FeedProps = { provinceName: string, hotels: HotelCardProps[] }[];
type Hotel = {
  id: string
  name: string
  type: string
  reviewPoints: number | null
  numberOfReviews: number | null
  imageUrls: string[] | null
  wardName: string | null
  provinceName: string
  facilities: { name: string }[]
  minPrice: number | null
}
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
      hotels: (item.hotels as Hotel[]).map((h) => {
        return {
          id: h.id,
          name: h.name,
          imageUrls: h.imageUrls || [],
          reviewPoints: h.reviewPoints || 0,
          numberOfReviews: h.numberOfReviews || 0,
          // build nested ward -> district -> province shape expected by HotelCardProps
          ward: {
            name: h.wardName || "",
            district: { province: { name: item.province_name } },
          },
          facilities: h.facilities,
          // roomTypes expected as array; use minPrice as single entry if available
          roomTypes: h.minPrice ? [{ price: h.minPrice }] : [],
          type: h.type,
        };
      }) as HotelCardProps[],
    }));
}