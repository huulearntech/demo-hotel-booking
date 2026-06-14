"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

import { MultiRoomType_FormValues, RoomType_FormOutput } from "@/lib/zod_schemas/create-room";
import { Prisma } from "@/lib/generated/prisma/client";
import { OperationResult, Override } from "@/lib/types/utils";
import { revalidatePath } from "next/cache";
import { PATHS } from "@/lib/constants";

export async function hotelowner_updateRoomTypeById(id: string, data: RoomType_FormOutput): Promise<OperationResult> {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  try {
    const updated = await prisma.roomType.update({
      where: { id, hotel: { ownerId: session.user.id } },
      data,
      // select: {},
    }).then((roomType) => ({
      ...roomType,
      price: roomType.price.toNumber(),
    }));
    return { ok: true, data: updated };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return { ok: false, error: "Room type not found", status: 404 };
    }
    return { ok: false, error: "Failed to update room type" };
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

  const result =  prisma.roomType.createMany({ // only need to return the batch count
    data: formData.map(roomType => ({ ...roomType, hotelId: hotel.id })),
  });
  if (!result) {
    return { ok: false, error: "Failed to create room types" };
  }
  revalidatePath(PATHS.hotelRoomTypes);
  return { ok: true, data: result };
}


// TODO: Move to rooms.ts
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


export async function hotelowner_getRoomTypeById(roomTypeId: string):
  Promise<OperationResult<Prisma.RoomTypeGetPayload<{
    select: {
      hotel: { select: { name: true, id: true } },
      name: true,
      adultCapacity: true,
      childrenCapacity: true,
      imageUrls: true,
      areaM2: true,
      bedType: true,
      price: true,
      description: true,
      _count: { select: { rooms: true } },
    }
  }>>> {
  const session = await auth();
  if (!session) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }
  if (session.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  const result = await prisma.roomType.findUnique({
    where: {
      hotel: { ownerId: session.user.id },
      id: roomTypeId,
    },
    select: {
      hotel: { select: { name: true, id: true } },
      name: true,
      adultCapacity: true,
      childrenCapacity: true,
      imageUrls: true,
      bedType: true,
      areaM2: true,
      price: true,
      description: true,
      _count: { select: { rooms: true } },
    }
  });
  if (!result) {
    return { ok: false, error: "Room Type not found", status: 404 };
  }
  return { ok: true, data: result };
}

// TODO: name this better
export type RoomType = Override<Prisma.RoomTypeGetPayload<{
  select: {
    id: true,
    hotelId: true,
    name: true,
    price: true,
    adultCapacity: true,
    childrenCapacity: true,
    imageUrls: true,
    createdAt: true,
    bedType: true,
  }
}>, { price: number }>;

export async function hotelowner_getRoomTypes():
  Promise<OperationResult<RoomType[]>>
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
      bedType: true,
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


export async function hotelowner_getRoomTypesNameAndId(): Promise<{ id: string; name: string }[]> {
  const session = await auth();
  if (!session || session.user.role !== "HOTEL_OWNER") {
    throw new Error("Unauthorized");
  }

  const roomTypes = await prisma.roomType.findMany({
    where: {
      hotel: {
        ownerId: session.user.id,
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  return roomTypes;
}

export async function hotelowner_deleteRoomTypeById(id: string):
  Promise<OperationResult<{ id: string }>>
{
  const session = await auth();
  if (!session) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }
  if (session.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  const response = await prisma.roomType.delete({
    where: { id, hotel: { ownerId: session.user.id } },
    select: { id: true },
  })
  if (!response) {
    return { ok: false, error: "Failed to delete room type" };
  }

  return { ok: true, data: response };
}