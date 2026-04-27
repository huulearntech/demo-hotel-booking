"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import {
  hotelowner_getLast90DaysBookings,
  hotelowner_getUpcomingBookings as core_hotelowner_getUpcomingBookings,
} from "@/lib/generated/prisma/sql";
import type { OperationResult, Override } from "@/lib/types/utils";

// TODO: filter, pagination, date range: upcoming, ongoing, past, custom range, etc.
export async function hotelowner_getBookings() {
  const session = await auth();
  if (session?.user?.role !== "HOTEL_OWNER") {
    throw new Error("Unauthorized");
  }

  const hotelId = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!hotelId) {
    return [];
  }

  const result = await prisma.$queryRawTyped(hotelowner_getLast90DaysBookings(hotelId.id));
  return result.map((booking) => ({
    ...booking,
    totalPrice: booking.totalPrice?.toNumber() || 0,
  }));
};

export type BookingSerialized = Awaited<ReturnType<typeof hotelowner_getBookings>>[number];


// TODO: Make a consistent output shape, so that the table columns can be shared
export type UpcomingBooking = Override<core_hotelowner_getUpcomingBookings.Result, { totalPrice: number }>;
export async function hotelowner_getUpcomingBookings():
  Promise<OperationResult<UpcomingBooking[]>>
{
  const session = await auth();
  if (!session) {
    return { ok: false, status: 401, error: "Unauthenticated" };
  }
  if (session.user.role !== "HOTEL_OWNER") {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  // NOTE: Could use ownerId directly without fetching hotelId,
  // but this is okay for now, and also in case we want to support multiple hotels per owner in the future.
  const hotelId = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!hotelId) {
    return { ok: false, status: 404, error: "Hotel not found" };
  }

  const result = await prisma
    .$queryRawTyped(core_hotelowner_getUpcomingBookings(hotelId.id))
    .then(bookings => bookings.map((booking) => ({
      ...booking,
      totalPrice: booking.totalPrice?.toNumber() || 0,
    })));

  return { ok: true, data: result };
}