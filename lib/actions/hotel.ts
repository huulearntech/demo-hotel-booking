"use server";

import prisma from "@/lib/prisma";
import { getRoomTypesOfHotel } from "../generated/prisma/sql";
import { auth } from "@/auth";

export async function fetchHotel(hotelId: string) {
  const session = await auth();
  if (session?.user.role === "USER") {
    // FIXME: Too many queries.
    const exists = await prisma.recentlyViewed.findFirst({
      where: {
        userId: session.user.id,
        hotelId,
      },
      select: { id: true },
    });
    if (!exists) {
      await prisma.recentlyViewed.create({
        data: {
          userId: session.user.id,
          hotelId,
        },
      });
    } else {
      await prisma.recentlyViewed.update({
        where: { id: exists.id },
        data: { viewedAt: new Date() },
      });
    }
  }


  // TODO: handle pagination or separate the query for fetching reviews
  // FIXME: This logic is incorrect: it selects the reviews of the cheapest room type, not the whole hotel.
  return prisma.hotel.findUnique({
    where: { id: hotelId },
    include: {
      roomTypes: {
        select: { price: true },
        orderBy: { price: "asc" },
        take: 1, // only need the cheapest room for the overview section
      },
      ward: {
        select: {
          id: true,
          name: true,
          district: {
            select: {
              id: true,
              name: true,
              province: {
                select: { id: true, name: true, },
              },
            },
          },
        },
      },
      facilities: {
        select: {
          type: true,
          name: true,
          iconUrl: true,
        },
      },
    },
  });
}

export async function user_getAvailableRoomTypeOfHotel(hotelId: string, checkInDate: Date, checkOutDate: Date, numAdults: number, numChildren: number, numRooms: number) {
  const result = await prisma.$queryRawTyped(getRoomTypesOfHotel(hotelId, checkInDate, checkOutDate, numAdults, numChildren, numRooms));
  return result.map(roomType => ({
    ...roomType,
    price: roomType.price.toNumber(),
    facilities: Array.isArray(roomType.facilities) ? roomType.facilities : [],
  }));
}

export type UserGetAvailableRoomTypeOfHotelResult = Awaited<ReturnType<typeof user_getAvailableRoomTypeOfHotel>>;

// TODO: pagination for reviews
export async function get5ReviewsAboutHotelForOverview(hotelId: string) {
  return prisma.review.findMany({
    where: {
      booking: {
        roomType: {
          hotelId,
        },
      },
    },
    include: {
      booking: {
        select: {
          id: true,
          review: {
            select: {
              rating: true,
              comment: true,
              createdAt: true,
            }
          },
          user: {
            select: {
              name: true,
              profileImageUrl: true,
            }
          },
        },
      },
    },
    take: 5,
  });
}