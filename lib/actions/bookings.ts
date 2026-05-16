"use server";

import prisma from "@/lib/prisma";
import { SearchSpecWithoutLocation } from "../zod_schemas/search-bar";
import { auth } from "@/auth";
import type { OperationResult } from "../types/utils";

// TODO: Cleanup
export async function user_createBooking(
  roomTypeId: string,
  searchSpecWithoutLocation: SearchSpecWithoutLocation,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
): Promise<OperationResult<string>> {
  const session = await auth();
  if (!session || !session.user) {
    return { ok: false, status: 401, error: "Bạn cần đăng nhập để đặt phòng." };
  }
  
  if (session.user.role !== "USER") {
    return { ok: false, status: 403, error: "Bạn không có quyền thực hiện hành động này." }; 
  }

  const userId = session.user.id;

  const userIsAlreadyBookingOther = await prisma.booking.findFirst({
    where: { userId, status: "PENDING_TO_PAY" },
  });

  if (userIsAlreadyBookingOther) {
    return { ok: false, status: 400, error: "Bạn có một lượt đặt phòng đang chờ. Vui lòng hoàn thành hoặc hủy trước khi tạo mới." };
  }

  const {
    inOutDates: { from: checkInDate, to: checkOutDate },
    guestsAndRooms: { numAdults, numChildren, numRooms }
  } = searchSpecWithoutLocation;

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
    return { ok: false, status: 404, error: "Loại phòng không tồn tại." };
  }

  const {
    price: snapshotRoomPrice,
    name: snapshotRoomTypeName,
    hotel: {
      checkInTime: snapshotCheckInTime,
      checkOutTime: snapshotCheckOutTime,
    }
  } = roomType;

  try {
    const created = await prisma.booking.create({
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
        customerName,
        customerEmail,
        customerPhone,
      },
      select: { id: true },
    });

    return { ok: true, data: created.id };
  } catch (err) {
    return { ok: false, status: 500, error: "Internal Server Error: Failed to create booking" };
  }
}