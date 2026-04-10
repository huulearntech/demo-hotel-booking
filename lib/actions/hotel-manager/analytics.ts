"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { hotelowner_getLast90DaysRevenueAndBookings } from "@/lib/generated/prisma/sql";

export async function fetchLast90DaysRevenueAndNumberOfBookings() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  if (session.user.role !== "HOTEL_OWNER") {
    throw new Error("Forbidden");
  }

  const hotel = await prisma.hotel.findFirst({
    where: {
      ownerId: session.user.id,
    },
  });

  if (!hotel) {
    throw new Error("Hotel not found");
  }

  const result = await prisma.$queryRawTyped(hotelowner_getLast90DaysRevenueAndBookings(hotel.id));
  // return result.map((entry) => ({
  //   date: entry.day,
  //   revenue: entry.total_revenue?.toNumber() || 0,
  //   numberOfBookings: entry.bookings || 0,
  // }));
  return result;
}