"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { Decimal } from "@prisma/client/runtime/client";

const DAYS = 90;

// TODO: Cleanup
export async function fetchRevenueByRoomTypeLast90Days() {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") return [];

  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

  const roomTypes = await prisma.roomType.findMany({
    where: { hotel: { ownerId: session.user.id } },
    select: {
      id: true,
      name: true,
      bookings: {
        where: { createdAt: { gte: since } },
        select: { snapshotRoomPrice: true, numRooms: true },
      },
    },
  });

  const result = roomTypes.map((rt) => {
    const total = rt.bookings.reduce((acc, booking) => {
      const price = booking.snapshotRoomPrice;
      return acc.add(price.mul(booking.numRooms).toNumber());
    }, new Decimal(0)).toNumber();

    return { roomTypeName: rt.name, totalRevenue: total };
  });

  return result.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export async function fetchBookingsCountByRoomTypeLast90Days() {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") return [];

  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

  // Get room types for this owner
  const roomTypes = await prisma.roomType.findMany({
    where: { hotel: { ownerId: session.user.id } },
    select: { id: true, name: true },
  });

  // Count bookings per room type in time window
  const counts = await prisma.booking.groupBy({
    by: ["roomTypeId"],
    where: { createdAt: { gte: since }, roomType: { hotel: { ownerId: session.user.id } } },
    _count: { id: true },
  });

  const countsById = Object.fromEntries(counts.map((c) => [c.roomTypeId, c._count.id]));

  const result = roomTypes.map((rt) => ({ roomTypeName: rt.name, bookingsCount: countsById[rt.id] ?? 0 }));

  return result.sort((a, b) => b.bookingsCount - a.bookingsCount);
}

export async function fetchAvgRatingByRoomTypeLast90Days() {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") return [];

  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

  // Fetch reviews in time window with associated booking.roomTypeId
  const reviews = await prisma.review.findMany({
    where: { createdAt: { gte: since }, booking: { roomType: { hotel: { ownerId: session.user.id } } } },
    select: { id: true, rating: true, booking: { select: { roomTypeId: true } } },
  });

  const agg: Record<string, { sum: number; count: number }> = {};
  for (const r of reviews) {
    const rtId = r.booking.roomTypeId;
    if (!agg[rtId]) agg[rtId] = { sum: 0, count: 0 };
    agg[rtId].sum += r.rating;
    agg[rtId].count += 1;
  }

  // Get room type names
  const roomTypes = await prisma.roomType.findMany({ where: { hotel: { ownerId: session.user.id } }, select: { id: true, name: true } });

  const result = roomTypes.map((rt) => {
    const a = agg[rt.id];
    const avg = a && a.count > 0 ? Math.round((a.sum / a.count) * 100) / 100 : null;
    return { roomTypeName: rt.name, ratingCount: a?.count ?? 0, avgRating: avg };
  });

  return result.sort((a, b) => {
    // Sort by avgRating desc, fallback to ratingCount
    if (a.avgRating === null && b.avgRating !== null) return 1;
    if (b.avgRating === null && a.avgRating !== null) return -1;
    if (a.avgRating !== b.avgRating) return (b.avgRating ?? 0) - (a.avgRating ?? 0);
    return b.ratingCount - a.ratingCount;
  });
}
