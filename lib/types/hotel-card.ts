import { Prisma } from "@/lib/generated/prisma/client";

// TODO: Should have more rigid solution for serializing Decimal to number.
// This is just a workaround.
export type HotelCardProps = Prisma.HotelGetPayload<{
  select: {
    id: true,
    name: true,
    imageUrls: true,
    rating: true,
    numberOfReviews: true,
    ward: { select: { name: true, district: { select: { province: { select: { name: true } } } } }, },
    facilities: { select: { name: true } },
    // roomTypes: {
    //   select: { price: true },
    // },
    type: true,
  }
}> & { roomTypes: { price: number }[] }; // override roomTypes to have price as number instead of Decimal

export type draft_HotelCardProps = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  rating: number;
  numberOfReviews: number;
  wardName: string;
  provinceName: string;
  facilityNames: string[] | null;
  price: number;
  type: string;
  isFavorited: boolean | null;
}