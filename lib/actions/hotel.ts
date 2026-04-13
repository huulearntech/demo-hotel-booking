"use server";

import prisma from "@/lib/prisma";
import { getRoomTypesOfHotel } from "../generated/prisma/sql";

export async function fetchHotel(hotelId: string) {
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
          name: true,
          district: {
            select: {
              name: true,
              province: {
                select: { name: true, },
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
      // TODO: handle pagination or separate the query for fetching reviews
      // This following is for overview section.
      bookingsMetadata: {
        select: {
          booking: {
            where: { review: { isNot: null } },
            select: {
              id: true,
              review: {
                select: {
                  rating: true,
                  comment: true,
                  createdAt: true,
                }
              },
            },
          },
          user: {
            select: {
              name: true,
              profileImageUrl: true,
            }
          }
        },
        take: 5,
        orderBy: { booking: { createdAt: "desc" } },
        where: { booking: { isNot: null } 
        },
        // order at bookingsMetadata level by the nested booking.createdAt
        // But should order by direct createdAt.
      },
    },
  });
}

export async function user_getAvailableRoomTypeOfHotel(hotelId: string, checkInDate: Date, checkOutDate: Date, numAdults: number, numChildren: number, numRooms: number) {
  return prisma.$queryRawTyped(getRoomTypesOfHotel(hotelId, checkInDate, checkOutDate, numAdults, numChildren, numRooms));
  // return result;
}

export type UserGetAvailableRoomTypeOfHotelResult = Awaited<ReturnType<typeof user_getAvailableRoomTypeOfHotel>>;