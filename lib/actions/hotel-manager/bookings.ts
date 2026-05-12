"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { hotelowner_getBookings as core_hotelowner_getBookings } from "@/lib/generated/prisma/sql";

// TODO: filter, pagination: currently only go forward, not be able to go backward.
export async function hotelowner_getBookings(
  timeRange: "past" | "current" | "upcoming" = "upcoming",
  pageSize = 20,
  cursor: { checkInDate: Date; id: string } | null = null,
) {
  const session = await auth();
  if (session?.user?.role !== "HOTEL_OWNER") {
    throw new Error("Unauthorized");
  }

  const hotelId = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!hotelId) {
    throw new Error("Hotel not found");
  }

  const result = await prisma.$queryRawTyped(core_hotelowner_getBookings(
    hotelId.id,
    timeRange,
    pageSize,
    cursor?.checkInDate ?? null,
    cursor?.id ?? null,
  )).then(bookings => bookings.map((booking) => ({
    ...booking,
    totalPrice: booking.totalPrice?.toNumber() || 0,
  })));

  // result.length or pageSize?
  const lastBooking = result[result.length - 1];
  const nextCursor = lastBooking ? { checkInDate: lastBooking.checkInDate, id: lastBooking.id } : null;

  return {
    items: result,
    nextCursor,
  };
};

export type BookingRow = Awaited<ReturnType<typeof hotelowner_getBookings>>["items"][number]