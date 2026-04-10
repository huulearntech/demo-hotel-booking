"use server";
import prisma from "@/lib/prisma";

export type BBox = {
  west: number;
  south: number;
  east: number;
  north: number;
}

export async function getHotelsByBoundingBox(bbox: BBox) {
  const { west, south, east, north } = bbox;

  const where =
    west <= east
      ? {
          latitude: { gte: south, lte: north },
          longitude: { gte: west, lte: east },
        }
      : {
          latitude: { gte: south, lte: north },
          // When the bounding box crosses the antimeridian, select hotels with longitude >= west OR longitude <= east
          OR: [{ longitude: { gte: west } }, { longitude: { lte: east } }],
        };

  const hotels = await prisma.hotel.findMany({
    take: 20,
    where,
    select: {
      id: true,
      name: true,
      roomTypes: { select: { price: true }, take: 1, orderBy: { price: "asc" } },
      reviewPoints: true,
      numberOfReviews: true,
      imageUrls: true,
      latitude: true,
      longitude: true,
    },
  }).then(hotels => hotels.map(hotel => ({
    ...hotel,
    price: hotel.roomTypes[0].price.toNumber() || 0, // convert Decimal to number, default to 0 if no room types
    thumbnailUrl: hotel.imageUrls[0] ?? null,
    roomTypes: undefined, // remove rooms from the result since we only needed the price
  })));

  return hotels;
}

export type Map_HotelCardProps = Awaited<ReturnType<typeof getHotelsByBoundingBox>>[number];
