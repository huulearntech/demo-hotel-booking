"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import {
  hotelowner_getLast90DaysRevenueAndBookings,
  hotelowner_getRatingCountGroupedByStars
} from "@/lib/generated/prisma/sql";

export async function fetchLast90DaysRevenueAndNumberOfBookings() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  if (session.user.role !== "HOTEL_OWNER") {
    throw new Error("Forbidden");
  }

  const hotel = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
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
    where: { ownerId: session.user.id },
  });

  if (!hotel) {
    throw new Error("Hotel not found");
  }

  const result = await prisma.$queryRawTyped(hotelowner_getRatingCountGroupedByStars(hotel.id));
  return result;
}


import { OperationResult, Override } from "@/lib/types/utils";
import {
  hotelowner_getRevenueByRoomTypeLast90Days,
  hotelowner_getLast90DaysRatingByTypes,
  hotelowner_getLast90DaysBookings
} from "@/lib/generated/prisma/sql";

export async function fetchRevenueByRoomTypeLast90Days():
  Promise<OperationResult<Override<
    hotelowner_getRevenueByRoomTypeLast90Days.Result,
    { totalRevenue: number }>[]
  >>
{
  const session = await auth();
  if (!session)   return { ok: false, error: "Unauthorized", status: 401 };
  if (session.user.role !== "HOTEL_OWNER") return { ok: false, error: "Forbidden", status: 403 };
  const hotel = await prisma.hotel.findFirst({ where: { ownerId: session.user.id }, select: { id: true } });
  if (!hotel) return { ok: false, error: "Hotel not found", status: 404 };

  const result = await prisma.$queryRawTyped(
    hotelowner_getRevenueByRoomTypeLast90Days(hotel.id)
  ).then(rows => rows.map(r => ({
    ...r,
    totalRevenue: r.totalRevenue?.toNumber() ?? 0,
  })));

  console.log("hello", result)
  return { ok: true, data: result };
}


// TODO: Cleanup
const DAYS = 90;
export async function fetchBookingsCountByRoomTypeLast90Days(): Promise<OperationResult<{ roomTypeName: string; bookingsCount: number }[]>> {
  const session = await auth();
  if (!session) return { ok: false, error: 'Unauthorized', status: 401 };
  if (session.user.role !== 'HOTEL_OWNER') return { ok: false, error: 'Forbidden', status: 403 };

  const hotel = await prisma.hotel.findFirst({ where: { ownerId: session.user.id }, select: { id: true } });
  if (!hotel) return { ok: false, error: 'Hotel not found', status: 404 };

  try {
    // Use typed query to fetch bookings in last 90 days for this hotel
    const rows = await prisma.$queryRawTyped(hotelowner_getLast90DaysBookings(hotel.id));

    // Aggregate counts by room type name
    const countsMap: Record<string, number> = {};
    for (const r of rows) {
      const name = (r as any).roomTypeName ?? String((r as any).roomTypeName ?? 'Unknown');
      countsMap[name] = (countsMap[name] ?? 0) + 1;
    }

    // Ensure all room types are present (include zero counts)
    const roomTypes = await prisma.roomType.findMany({ where: { hotel: { ownerId: session.user.id } }, select: { name: true } });

    const result = roomTypes.map(rt => ({ roomTypeName: rt.name, bookingsCount: countsMap[rt.name] ?? 0 }));

    result.sort((a, b) => b.bookingsCount - a.bookingsCount);

    return { ok: true, data: result };
  } catch (err: any) {
    console.error('Error fetching bookings count by room type', err);
    return { ok: false, error: err?.message ?? 'Internal error', status: 500 };
  }
}

export async function fetchAvgRatingByRoomTypeLast90Days(): Promise<OperationResult<{ roomTypeName: string; ratingCount: number; avgRating: number | null }[]>> {
  const session = await auth();
  if (!session) return { ok: false, error: 'Unauthorized', status: 401 };
  if (session.user.role !== 'HOTEL_OWNER') return { ok: false, error: 'Forbidden', status: 403 };

  const hotel = await prisma.hotel.findFirst({ where: { ownerId: session.user.id }, select: { id: true } });
  if (!hotel) return { ok: false, error: 'Hotel not found', status: 404 };

  try {
    const rows = await prisma.$queryRawTyped(hotelowner_getLast90DaysRatingByTypes(hotel.id));
    const mapped = rows.map(r => ({
      roomTypeName: r.name,
      ratingCount: Number(r.ratingCount ?? 0),
      avgRating: r.avgRating != null ? (typeof (r.avgRating as any).toNumber === 'function' ? (r.avgRating as any).toNumber() : Number(r.avgRating)) : null,
    }));

    // sort same as SQL ordering to be safe
    mapped.sort((a, b) => {
      if (a.avgRating === null && b.avgRating !== null) return 1;
      if (b.avgRating === null && a.avgRating !== null) return -1;
      if (a.avgRating !== b.avgRating) return (b.avgRating ?? 0) - (a.avgRating ?? 0);
      return b.ratingCount - a.ratingCount;
    });

    return { ok: true, data: mapped };
  } catch (err: any) {
    console.error('Error fetching ratings by room type', err);
    return { ok: false, error: err?.message ?? 'Internal error', status: 500 };
  }
}