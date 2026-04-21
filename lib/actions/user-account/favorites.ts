"use server";

import { HotelCardProps } from "@/lib/types/hotel-card";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// TODO: Handle auth
export async function user_fetchFavoriteHotels() {
  const session = await auth();

  if (session?.user.role !== "USER") {
    return [];
  }

  const where = { userId: session.user.id };

  return prisma.favorite.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        hotel: {
          select: {
            id: true,
            name: true,
            imageUrls: true,
            rating: true,
            numberOfReviews: true,
            ward: { select: { name: true } },
            facilities: { select: { name: true } },
            roomTypes: { select: { price: true }, orderBy: { price: "asc" }, take: 1 },
            type: true,
          }
        }
      },
      take: 10, // TODO: pagination
    }).then(favs => favs.map(fav => ({
      ...fav.hotel,
      roomTypes: fav.hotel.roomTypes.map(rt => ({ ...rt, price: rt.price.toNumber() })),
    } as HotelCardProps)))
}