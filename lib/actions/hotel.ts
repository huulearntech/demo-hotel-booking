"use server";

import prisma from "@/lib/prisma";
import { getRoomTypesOfHotel } from "../generated/prisma/sql";
import { auth } from "@/auth";

export async function fetchHotel(hotelId: string) {
  const session = await auth();
  if (session?.user.role === "USER") {
    await prisma.recentlyViewed.upsert({
      where: {
        userId_hotelId: {
          userId: session.user.id,
          hotelId,
        },
      },
      create: {
        userId: session.user.id,
        hotelId,
      },
      update: {},
    });
  }


  return prisma.hotel.findUnique({
    where: { id: hotelId },
    include: {
      roomTypes: {
        select: { price: true },
        orderBy: { price: "asc" },
        take: 1,
      },
      ward: {
        select: {
          id: true,
          name: true,
          province: {
            select: { id: true, name: true, },
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
    facilities: Array.isArray(roomType.common_facilities) ? roomType.common_facilities : [],
  }));
}

export type UserGetAvailableRoomTypeOfHotelResult = Awaited<ReturnType<typeof user_getAvailableRoomTypeOfHotel>>;

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