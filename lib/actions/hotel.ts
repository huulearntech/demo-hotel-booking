"use server";

import prisma from "@/lib/prisma";
import { getRoomTypesOfHotel } from "../generated/prisma/sql";

export async function fetchHotel(hotelId: string) {
  return prisma.hotel.findUnique({
    where: { id: hotelId },
    include: {
      roomTypes: {
        select: {
          price: true,
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
            orderBy: { createdAt: "desc" },
            where: {
              booking: { isNot: null }
            },
          },
        },
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

export async function getHotelReview(hotelId: string) {
  return prisma.review.findMany({
    where: {
      booking: {
        metadata: {
          roomType: {
            hotelId,
          },
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
          metadata: {
            select: {
              user: {
                select: {
                  name: true,
                  profileImageUrl: true,
                }
              },
              roomType: {
                select: {
                  hotel: {
                    select: {
                      name: true,
                    }
                  },
                }
              }
            }
          }
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}