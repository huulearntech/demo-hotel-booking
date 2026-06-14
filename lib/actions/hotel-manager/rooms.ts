"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

import { Prisma } from "@/lib/generated/prisma/client";
import { OperationResult } from "@/lib/types/utils";
import { revalidatePath } from "next/cache";
import { PATHS } from "@/lib/constants";
import {
  schema_Room,
  type RoomFormOutput,
} from "@/lib/zod_schemas/create-room";


export async function hotelowner_createRoom(formData: RoomFormOutput) {
  const session = await auth();
  if (!session) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }
  if (session.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  const validData = schema_Room.safeParse(formData);
  if (!validData.success) {
    return { ok: false, error: "Thông tin không hợp lệ.", status: 400 };
  }

  const hotel = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!hotel) {
    return { ok: false, error: "Hotel not found for the owner", status: 404 };
  }

  const result = prisma.room.create({ data: formData });
  if (!result) {
    return { ok: false, error: "Failed to create rooms" };
  }
  return { ok: true, data: result };
}

export async function hotelowner_getRoomById(roomId: string) {
  const session = await auth();
  if (!session) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }
  if (session.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  const result = await prisma.room.findUnique({
    where: {
      type: { hotel: { ownerId: session.user.id } },
      id: roomId,
    },
    select: {
      name: true,
      type: {
        select: {
          id: true,
          name: true,
        }
      }
    }
  });
  if (!result) {
    return { ok: false, error: "Room not found", status: 404 };
  }
  return { ok: true, data: result };
}


export async function hotelowner_getRoomsOfType(typeId?: string, cursorId?: string):
  Promise<OperationResult<{ id: string, name: string, typeId: string, type: { name: string } }[]>> {
  const session = await auth();
  if (!session) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }
  if (session.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  const result = await prisma.room.findMany({
    where: { type: { id: typeId, hotel: { ownerId: session.user.id } } },
    select: {
      id: true,
      name: true,
      typeId: true,
      type: { select: { name: true } }
    },
    cursor: cursorId ? { id: cursorId } : undefined,
    orderBy: { id: "asc" },
  });
  if (!result) {
    return { ok: false, error: `Failed to fetch rooms of type ${typeId}` };
  }
  return { ok: true, data: result };
}


export async function hotelowner_updateRoomById(id: string, data: RoomFormOutput) {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  try {
    const updated = await prisma.room.update({
      where: { id, type: { hotel: { ownerId: session.user.id } } },
      data,
      select: { id: true }
    });
    return { ok: true, data: updated };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return { ok: false, error: "Room not found", status: 404 };
    }
    return { ok: false, error: "Failed to update room" };
  }
}



export async function hotelowner_deleteRoomById(id: string):
  Promise<OperationResult<{ id: string }>>
{
  const session = await auth();
  if (!session) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }
  if (session.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  const response = await prisma.room.delete({
    where: { id, type: { hotel: { ownerId: session.user.id } } },
    select: { id: true },
  })
  if (!response) {
    return { ok: false, error: "Failed to delete room" };
  }

  return { ok: true, data: response };
}