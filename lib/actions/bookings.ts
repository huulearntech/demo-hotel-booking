"use server";

import prisma from "@/lib/prisma";
import { SearchBar_FormOutput } from "../zod_schemas/search-bar";
import { auth } from "@/auth";
import type { OperationResult } from "../types/operation-result";

// TODO: Don't throw error.
export async function user_createBookingMetadata(
  roomTypeId: string,
  searchBarFormData: SearchBar_FormOutput,
): Promise<OperationResult<string>> {
  const session = await auth();
  if (!session || !session.user) {
    return { ok: false, status: 401, error: "Bạn cần đăng nhập để đặt phòng." };
  }
  
  if (session.user.role !== "USER") {
    return { ok: false, status: 403, error: "Bạn không có quyền thực hiện hành động này." }; 
  }

  const userId = session.user.id;

  const mayExistedBookingMetadata = await prisma.bookingMetadata.findFirst({
    where: { userId, status: "DRAFT" },
  });

  if (mayExistedBookingMetadata) {
    return { ok: false, status: 400, error: "Bạn có một lượt đặt phòng đang chờ. Vui lòng hoàn thành hoặc hủy trước khi tạo mới." };
  }

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
    return { ok: false, status: 404, error: "Room type not found" };
  }

  const {
    price: snapshotRoomPrice,
    name: snapshotRoomTypeName,
    hotel: {
      checkInTime: snapshotCheckInTime,
      checkOutTime: snapshotCheckOutTime,
    }
  } = roomType;

  // Temporarily ignore stricter data validation per request

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

    return { ok: true, data: created.id };
  } catch (err) {
    console.error("Failed to create booking metadata", err);
    return { ok: false, status: 500, error: "Internal Server Error: Failed to create booking metadata" };
  }
}