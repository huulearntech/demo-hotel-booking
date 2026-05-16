// FIXME: the pagination is not working correctly.
"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { hotelowner_getBookings as core_hotelowner_getBookings } from "@/lib/generated/prisma/sql";

export async function hotelowner_getBookings(
  timeRange: "past" | "current" | "upcoming" = "upcoming",
  pageSize = 20,
  queryPrevCursor: { checkInDate: Date; id: string } | null = null,
  queryNextCursor: { checkInDate: Date; id: string } | null = null,
  direction: "next" | "prev" = "next",
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

  const rawResult = await prisma.$queryRawTyped(core_hotelowner_getBookings(
    hotelId.id,
    timeRange,
    pageSize + 1,
    queryPrevCursor?.checkInDate ?? null,
    queryPrevCursor?.id ?? null,
    queryNextCursor?.checkInDate ?? null,
    queryNextCursor?.id ?? null,
    direction === "next",
  ));

  const hasMore = rawResult.length === pageSize + 1;
  let result = rawResult
    .slice(0, pageSize)
    .map((booking) => ({
      ...booking,
      totalPrice: booking.totalPrice?.toNumber() || 0,
    }));

  if (direction === "prev") {
    result = result.reverse();
  }

  const firstBooking = result[0];
  const lastBooking = result[result.length - 1];
  const nextCursor = result.length > 0
    ? (direction === "next"
      ? (hasMore ? { checkInDate: lastBooking.checkInDate, id: lastBooking.id } : null)
      : (queryPrevCursor ? { checkInDate: lastBooking.checkInDate, id: lastBooking.id } : null))
    : null;
  const prevCursor = result.length > 0
    ? (direction === "next"
      ? (queryNextCursor ? { checkInDate: firstBooking.checkInDate, id: firstBooking.id } : null)
      : (hasMore ? { checkInDate: firstBooking.checkInDate, id: firstBooking.id } : null))
    : null;

  return {
    items: result,
    nextCursor,
    prevCursor,
  };
};

export type BookingRow = Awaited<ReturnType<typeof hotelowner_getBookings>>["items"][number]