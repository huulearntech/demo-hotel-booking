"use server";

import prisma from "@/lib/prisma";
import { SearchBar_FormOutput } from "../zod_schemas/search-bar";
import { auth } from "@/auth";

// TODO: Don't throw error.
export async function user_createBookingMetadata(
  roomTypeId: string,
  searchBarFormData: SearchBar_FormOutput,
) {
  const session = await auth();
  if (session?.user.role !== "USER") {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const { inOutDates: { from: checkInDate, to: checkOutDate }, guestsAndRooms: { numAdults, numChildren, numRooms } } = searchBarFormData;

  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    select: {
      price: true,
      name: true,
      hotel: {
        select: {
          checkInTime: true,
          checkOutTime: true,
        }
      },
    },
  });

  if (!roomType) {
    // TODO: Handle properly.
    throw new Error("Invalid roomTypeId");
  }

  const {
    price: snapshotRoomPrice,
    name: snapshotRoomTypeName,
    hotel: {
      checkInTime: snapshotCheckInTime,
      checkOutTime: snapshotCheckOutTime,
    }
  } = roomType;

  if (!userId || !roomTypeId) {
    throw new Error("userId, hotelId and roomTypeId are required");
  }

  // Basic validation
  if (numRooms <= 0 || numAdults <= 0) { // TODO: strict validation.
    throw new Error("numRooms and numGuests must be positive");
  }

  // validate check-in and check-out dates

  try {
    const created = await prisma.bookingMetadata.create({
      data: {
        userId,
        roomTypeId,
        checkInDate,
        checkOutDate,
        numRooms,
        numAdults,
        numChildren,
        snapshotRoomPrice,
        snapshotRoomTypeName,
        snapshotCheckInTime,
        snapshotCheckOutTime,
      },
      select: { id: true },
    });

    return created.id;
  } catch (err) {
    // Re-throw a clearer error for server-side handling
    console.error("Failed to create booking metadata", err);
    throw new Error("Failed to create booking metadata");
  }
}