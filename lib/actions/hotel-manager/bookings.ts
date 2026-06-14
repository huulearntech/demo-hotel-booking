"use server";

import prisma from "@/lib/prisma";
import { BookingStatus } from "@/lib/generated/prisma/enums";
import { auth } from "@/auth";
import { hotelowner_getBookings as core_hotelowner_getBookings } from "@/lib/generated/prisma/sql";

export async function hotelowner_getBookings(
  timeRange: "past" | "current" | "upcoming" = "upcoming",
  pageSize = 1,
  queryPrevCursor: { checkInDate: Date; id: string } | null = null,
  queryNextCursor: { checkInDate: Date; id: string } | null = null,
  directionIsNext: boolean = true,
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
    directionIsNext,
  ));

  const hasMore = rawResult.length === pageSize + 1;
  const result = (hasMore ? rawResult.slice(0, pageSize) : rawResult)
    .map((booking) => ({
      ...booking,
      totalPrice: booking.totalPrice?.toNumber() || 0,
    }));

  const firstBooking = result[0];
  const lastBooking = result[result.length - 1];

  let nextCursor: { checkInDate: Date; id: string } | null = null;
  let prevCursor: { checkInDate: Date; id: string } | null = null;
  
  if (result.length > 0) {
    if (directionIsNext) {
      if (hasMore && lastBooking) {
        nextCursor = { checkInDate: lastBooking.checkInDate, id: lastBooking.id };
      }
      if (queryNextCursor && firstBooking) {
        prevCursor = { checkInDate: firstBooking.checkInDate, id: firstBooking.id };
      }
    } else {
      if (hasMore && firstBooking) {
        prevCursor = { checkInDate: firstBooking.checkInDate, id: firstBooking.id };
      }
      if (queryPrevCursor && lastBooking) {
        nextCursor = { checkInDate: lastBooking.checkInDate, id: lastBooking.id };
      }
    }
  }

  return {
    items: result,
    nextCursor,
    prevCursor,
  };
};


export type BookingRow = Awaited<ReturnType<typeof hotelowner_getBookings>>["items"][number]

export async function hotelowner_getAvailableRoomsForBooking(bookingId: string) {
  const session = await auth();
  if (session?.user?.role !== "HOTEL_OWNER") {
    throw new Error("Unauthorized");
  }

  const hotel = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      roomTypeId: true,
      checkInDate: true,
      checkOutDate: true,
      numRooms: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (!booking.roomTypeId || !booking.checkInDate || !booking.checkOutDate) {
    throw new Error("Booking is missing room assignment information");
  }

  const roomType = await prisma.roomType.findFirst({
    where: { id: booking.roomTypeId },
    select: { id: true },
  });

  if (!roomType) {
    throw new Error("Booking not found");
  }

  const availableRooms = await prisma.room.findMany({
    where: {
      typeId: booking.roomTypeId,
      bookings: { none: { status: "CHECKED_IN" } },
    },
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });

  if (availableRooms.length < booking.numRooms) {
    throw new Error("Not enough available rooms of the booked type for the booking dates");
  }

  return availableRooms;
}

export async function hotelowner_checkInBooking(bookingId: string, roomIdsToAssign: string[]) {
  const session = await auth();
  if (session?.user?.role !== "HOTEL_OWNER") {
    throw new Error("Unauthorized");
  }

  const hotel = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!hotel) {
    throw new Error("Hotel not found");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      roomTypeId: true,
      checkInDate: true,
      checkOutDate: true,
      numRooms: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (roomIdsToAssign.length !== booking.numRooms) {
    throw new Error(`Must assign exactly ${booking.numRooms} rooms to the booking`);
  }

  if (!booking.roomTypeId) {
    throw new Error("Booking is missing room assignment information");
  }

  const roomType = await prisma.roomType.findFirst({
    where: { id: booking.roomTypeId, hotelId: hotel.id },
    select: { id: true },
  });

  if (!roomType) {
    throw new Error("Booking not found");
  }

  const uniqueRoomIds = Array.from(new Set(roomIdsToAssign));
  if (uniqueRoomIds.length !== roomIdsToAssign.length) {
    throw new Error("Room IDs must be unique");
  }

  
  await prisma.$transaction(async (tx) => {
    const availableRooms = await tx.room.findMany({
      where: {
        id: { in: uniqueRoomIds },
        typeId: booking.roomTypeId,
        bookings: { none: { status: BookingStatus.CHECKED_IN } },
      },
      select: { id: true },
    });

    if (availableRooms.length !== uniqueRoomIds.length) {
      throw new Error("Some rooms are not available or do not match the booked room type");
    }

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CHECKED_IN,
        rooms: {
          set: uniqueRoomIds.map((id) => ({ id })),
        },
      },
    });
  });

  return { assignedRoomIds: uniqueRoomIds };
}

export async function hotelowner_checkOutBooking(bookingId: string) {
  const session = await auth();
  if (session?.user?.role !== "HOTEL_OWNER") {
    throw new Error("Unauthorized");
  }

  const hotel = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!hotel) {
    throw new Error("Hotel not found");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== BookingStatus.CHECKED_IN) {
    throw new Error("Only checked-in bookings can be checked out");
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CHECKED_OUT },
  });

  return { success: true };
}

export async function hotelowner_cancelBooking(bookingId: string) {
  const session = await auth();
  if (session?.user?.role !== "HOTEL_OWNER") {
    throw new Error("Unauthorized");
  }

  const hotel = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!hotel) {
    throw new Error("Hotel not found");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status === BookingStatus.CANCELLED) {
    throw new Error("Booking is already canceled");
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CANCELLED },
  });

  return { success: true };
}