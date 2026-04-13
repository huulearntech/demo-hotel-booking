"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

// TODO: Handle error and consider using sql.
export async function hotelowner_getBookings() {
  const session = await auth();
  if (session?.user?.role !== "HOTEL_OWNER") {
    throw new Error("Unauthorized");
  }

  const whereByOwner = { metadata: { hotel: { ownerId: session.user.id } }, };

    const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where: whereByOwner,
      orderBy: { metadata: { checkInDate: "desc" } },
      include: {
        metadata: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    }),
    prisma.booking.count({
      where: whereByOwner,
    }),
  ]);

  return {
    bookings: bookings.map((booking) => {
      const md = booking.metadata;
      // defensive guards in case metadata is missing
      const snapshotStr = md?.snapshotRoomPrice?.toString?.() ?? md?.snapshotRoomPrice ?? "0";
      const snapshotNum = Number(snapshotStr) || 0;
      const roomsCount = md?.numRooms ?? 1;
      const totalPrice = (snapshotNum * roomsCount).toFixed(2);

      return {
        ...booking,
        // flatten some useful metadata for the caller
        metadata: md ?? null,
        customerName: md?.user?.name ?? booking.customerName,
        checkInDate: md?.checkInDate ?? null,
        checkOutDate: md?.checkOutDate ?? null,
        totalPrice, // string
      };
    }),
    total,
  };
};

export type BookingSerialized = Awaited<ReturnType<typeof hotelowner_getBookings>>['bookings'][number];


// TODO: Rename and make a consistent output shape, so that the table columns can be shared
export async function hotelowner_getUpcomingBookings() {
  const session = await auth();
  // TODO: Clarify this
  if (session?.user?.role !== "HOTEL_OWNER") {
    throw new Error("Unauthorized");
  }

  const today = new Date();

  const bookings = await prisma.booking.findMany({
    where: {
      metadata: {
        hotel: { ownerId: session.user.id },
        checkInDate: { gte: today },
      },
    },
    orderBy: {
      metadata: { checkOutDate: "desc" },
    },
    take: 10, // limit to 10 upcoming bookings
    include: {
      metadata: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  return bookings.map((booking) => {
    const md = booking.metadata;
    const snapshotStr = md?.snapshotRoomPrice?.toString?.() ?? md?.snapshotRoomPrice ?? "0";
    const snapshotNum = Number(snapshotStr) || 0;
    const roomsCount = md?.numRooms ?? 1;
    const totalPrice = (snapshotNum * roomsCount).toFixed(2);

    return {
      ...booking,
      metadata: md ?? null,
      customerName: md?.user?.name ?? booking.customerName,
      checkInDate: md?.checkInDate ?? null,
      checkOutDate: md?.checkOutDate ?? null,
      totalPrice, // string
    };
  });
}

export type UpcomingBooking = Awaited<ReturnType<typeof hotelowner_getUpcomingBookings>>[number];