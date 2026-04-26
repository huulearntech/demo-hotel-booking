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

  const hotel = await prisma.hotel.findUnique({
    where: {
      ownerId: session.user.id,
    },
  });

  if (!hotel) {
    throw new Error("Hotel not found");
  }

  const result = await prisma.$queryRawTyped(hotelowner_getLast90DaysRevenueAndBookings(hotel.id));
  return result.map((entry) => ({
    date: entry.day,
    revenue: entry.total_revenue?.toNumber() || 0,
    numberOfBookings: entry.bookings || 0,
  }));
}

export async function hotelowner_getRatingDistribution() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  if (session.user.role !== "HOTEL_OWNER") {
    throw new Error("Forbidden");
  }

  const hotel = await prisma.hotel.findUnique({
    where: {
      ownerId: session.user.id,
    },
  });

  if (!hotel) {
    throw new Error("Hotel not found");
  }

  // Run a single grouped SQL query (faster than nested Prisma filters for deep relations)
  const rows = await prisma.$queryRaw<
    { rating: number; count: bigint }[]
  >`SELECT rv.rating AS rating, COUNT(*)::bigint AS count
    FROM reviews rv
    JOIN bookings b ON b.id = rv.booking_id
    JOIN room_types rt ON rt.id = b.room_type_id
    WHERE rt.hotel_id = ${hotel.id}
    GROUP BY rv.rating;`;

  // Ensure 1..5 keys exist and convert bigint counts to number
  const result: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of rows) {
    result[row.rating] = Number(row.count);
  }

  return result;
}