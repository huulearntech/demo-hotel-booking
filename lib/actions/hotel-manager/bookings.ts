"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { hotelowner_getLast90DaysBookings, hotelowner_getUpcomingBookings } from "@/lib/generated/prisma/sql";

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

  // TODO: filter, pagination, date range.
  const result = await prisma.$queryRawTyped(hotelowner_getLast90DaysBookings(hotelId.id));
  return result.map((booking) => ({
    ...booking,
    totalPrice: booking.totalPrice?.toNumber() || 0,
  }));
};

export type BookingSerialized = Awaited<ReturnType<typeof hotelowner_getBookings>>[number];


// TODO: Rename and make a consistent output shape, so that the table columns can be shared
export async function tmp_hotelowner_getUpcomingBookings() {
  const session = await auth();
  // TODO: Clarify this
  if (session?.user.role !== "HOTEL_OWNER") {
    throw new Error("Unauthorized");
  }

  const hotelId = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!hotelId) {
    return [];
  }

  const result = await prisma.$queryRawTyped(hotelowner_getUpcomingBookings(hotelId.id));
  return result.map((booking) => ({
    ...booking,
    totalPrice: booking.totalPrice?.toNumber() || 0,
  }));
}

export type UpcomingBooking = Awaited<ReturnType<typeof tmp_hotelowner_getUpcomingBookings>>[number];