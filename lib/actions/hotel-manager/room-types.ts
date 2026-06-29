"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

import { MultiRoomType_FormValues, RoomType_FormInput, RoomType_FormOutput } from "@/lib/zod_schemas/create-room";
import { FacilityType, Prisma } from "@/lib/generated/prisma/client";
import { OperationResult, Override } from "@/lib/types/utils";
import { revalidatePath } from "next/cache";
import { PATHS } from "@/lib/constants";

export async function hotelowner_updateRoomTypeById(id: string, data: RoomType_FormOutput): Promise<OperationResult> {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  try {
    const { facilities, customFacilities, ...restData } = data;
    const updated = await prisma.roomType.update({
      where: { id, hotel: { ownerId: session.user.id } },
      data: {
        ...restData,
        facilities: {
          set: facilities.map((facility) => ({ id: facility.id })),
        },
        customFacilities: {
          set: customFacilities.map((facility) => ({ id: facility.id })),
        }
      },
      select: { id: true },
    });
    return { ok: true, data: updated };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return { ok: false, error: "Room type not found", status: 404 };
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        ok: false,
        error: "Room type name already exists",
        status: 409,
      };
    }
    return { ok: false, error: (err as Error).message ?? "Failed to update room type" };
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

  const nameToFacilities = new Map<string, {
    facilities: { id: string }[],
    customFacilities: { id: string }[],
  }>()
  formData.forEach(data => {
    if (nameToFacilities.has(data.name)) {
      return { ok: false, error: "Room type names must be unique", status: 409 };
    }

    nameToFacilities.set(data.name, {
      facilities: data.facilities,
      customFacilities: data.customFacilities
    });
  })

  try {
    const result = await prisma.$transaction(async tx => {
      const roomTypeNamesAndIDs = await tx.roomType.createManyAndReturn({
        data: formData.map((roomType) => {
          const { facilities, customFacilities, ...rest } = roomType;
          return { ...rest, hotelId: hotel.id };
        }),
        select: { id: true, name: true }
      });

      await Promise.all(
        roomTypeNamesAndIDs.map(({id, name}) => {
          return tx.roomType.update({
          where: {id},
          data: {
            facilities: {
              connect: nameToFacilities.get(name)?.facilities ?? []
            },
            customFacilities: {
              connect: nameToFacilities.get(name)?.customFacilities ?? []
            }
          },
          select: {
            facilities: true,
            customFacilities: true,
          }
        })
      })
    );

      return roomTypeNamesAndIDs;
    });

    console.log(result);

    revalidatePath(PATHS.hotelRoomTypes);
    return { ok: true, data: result };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        ok: false,
        error: "Room type name must be unique for this hotel",
        status: 409,
      };
    }
    return { ok: false, error: "Failed to create room types" };
  }
}


export async function hotelowner_getRoomTypeById (roomTypeId: string):
  Promise<OperationResult<RoomType_FormInput>> {
  const session = await auth();
  if (!session) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }
  if (session.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  // 'use cache'
  // cacheTag("hotelowner_getRoomTypeById");

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
      facilities: { select: { id: true, name: true, type: true } },
      customFacilities: { select: { id: true, name: true, type: true } },
      _count: { select: { rooms: true } },
    }
  });
  if (!result) {
    return { ok: false, error: "Room Type not found", status: 404 };
  }
  return {
    ok: true, data: {
      ...result,
      price: result.price.toNumber(),
      imageUrls: result.imageUrls.map(url => ({ url })),
      facilities: result.facilities.map(facility => ({ facility })),
      customFacilities: result.customFacilities.map(facility => ({ facility })),
      description: result.description ?? undefined
    }
  };
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

  revalidatePath(PATHS.hotelRoomTypes);
  return { ok: true, data: response };
}