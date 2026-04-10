"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

import { MultiRoomType_FormValues, RoomFormValues } from "@/lib/zod_schemas/create-room";
import { Prisma } from "@/lib/generated/prisma/client";
import { OperationResult } from "@/lib/types/operation-result";

export async function hotelowner_updateRoomById(id: string, data: RoomFormValues): Promise<OperationResult> {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  try {
    const updated = await prisma.room.update({
      where: { id, type: { hotel: { ownerId: session.user.id } } },
      data,
    });
    return { ok: true, data: updated };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return { ok: false, error: "Room not found", status: 404 };
    }
    return { ok: false, error: "Failed to update room" };
  }
}

export async function hotelowner_createManyRoomTypes(formData: MultiRoomType_FormValues): Promise<OperationResult> {
  const session = await auth();
  if (!session) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }
  if (session.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  const hotel = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!hotel) {
    return { ok: false, error: "Hotel not found for the owner", status: 404 };
  }

  // TODO: Handle errors + Revalidate rooms page after creation.
  const result =  prisma.roomType.createMany({ // only need to return the batch count
    data: formData.map(roomType => ({ ...roomType, hotelId: hotel.id })),
  });
  if (!result) {
    return { ok: false, error: "Failed to create room types" };
  }
  return { ok: true, data: result };
}


export async function hotelowner_getRoomById(roomId: string):
  Promise<OperationResult<Prisma.RoomGetPayload<{
    include: {
      type: {
        select: {
          hotel: { select: { name: true } },
          name: true,
          adultCapacity: true,
          childrenCapacity: true,
          imageUrls: true,
          bedType: true,
          price: true,
        },
      },
    },
  }>>> {
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
    include: {
      type: {
        select: {
          hotel: { select: { name: true } },
          name: true,
          adultCapacity: true,
          childrenCapacity: true,
          imageUrls: true,
          bedType: true,
          price: true,
        },
      },
    },
  });
  if (!result) {
    return { ok: false, error: "Room not found", status: 404 };
  }
  return { ok: true, data: result };
}

export async function hotelowner_getRoomTypes():
  Promise<OperationResult<(Omit<Prisma.RoomTypeGetPayload<{
    select: {
      id: true,
      hotelId: true,
      name: true,
      price: true,
      adultCapacity: true,
      childrenCapacity: true,
      imageUrls: true,
      createdAt: true,
      updatedAt: true,
    }
  }>, "price"> & { price: number })[]>>
{
  const session = await auth();
  if (!session) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }
  if (session.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  const result = await prisma.roomType.findMany({
    where: { hotel: { ownerId: session.user.id } },
    select: {
      id: true,
      hotelId: true,
      name: true,
      price: true,
      adultCapacity: true,
      childrenCapacity: true,
      imageUrls: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  }).then((rooms) => rooms.map((room) => ({
    ...room,
    price: room.price.toNumber(),
  })));
  if (!result) {
    return { ok: false, error: "Failed to fetch room types" };
  }
  return { ok: true, data: result };
}

export type RoomType = NonNullable<Extract<Awaited<ReturnType<typeof hotelowner_getRoomTypes>>, { ok: true }>["data"]>[number];

export async function hotelowner_deleteRoomById(id: string) {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    throw new Error("Unauthorized");
  }

  // TODO: handle errors properly.
  const res = await prisma.room.delete({
    where: { id, type: { hotel: { ownerId: session.user.id } } },
  }).then(() => ({ ok: true, message: null })).catch((err) => ({ ok: false, message: err.message }));
  
  if (!res.ok) {
    throw new Error("Failed to delete room");
  }
  return;
}