"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

import { HotelCardProps } from "@/lib/types/hotel-card";

export async function user_getRecentlyViewedHotels() {
  const session = await auth();
  if (session?.user.role !== "USER") return [];

  return prisma.recentlyViewed.findMany({
    where: { userId: session.user.id },
    orderBy: { viewedAt: "desc" },
    select: {
      hotel: {
        select: {
          id: true,
          name: true,
          imageUrls: true,
          rating: true,
          numberOfReviews: true,
          ward: { select: { name: true, district: { select: { province: { select: { name: true } } } } } },
          facilities: { select: { name: true } },
          roomTypes: { select: { price: true }, orderBy: { price: "asc" }, take: 1 },
          type: true,
        }
      }
    },
    take: 10, // TODO: pagination
  }).then(recentlyViewedEntries => recentlyViewedEntries.map(entry => ({
    ...entry.hotel,
    roomTypes: entry.hotel.roomTypes.map(rt => ({ ...rt, price: rt.price.toNumber() })),
  } as HotelCardProps)));
}