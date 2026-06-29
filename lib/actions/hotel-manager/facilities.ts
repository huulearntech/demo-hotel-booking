"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

import { FacilityType } from "@/lib/generated/prisma/client";
import { OperationResult } from "@/lib/types/utils";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
// import { revalidateTag } from "next/cache";

export async function hotelowner_createCustomFacility(name: string, type: FacilityType, roomTypeId?: string) : Promise<{
  ok: false;
  error: string;
  status: number;
} | {
  ok: true;
  data: { id: string; name: string; type: FacilityType };
  status: number;
}> {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const hotel = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });
  if (!hotel) {
    return { ok: false, error: "Hotel not found for the owner", status: 404 };
  }

  if (!name || !type) {
    return { ok: false, error: "Name and type are required", status: 400 };
  }


  try {
    const newFacility = await prisma.customFacility.create({
      data: {
        name,
        type,
        hotelId: hotel.id,
        ...( roomTypeId && {roomTypes: {
          connect: {
            id: roomTypeId
          }
        }})
      },
      select: { id: true, name: true, type: true }
    });

    // revalidateTag("hotelowner_getCustomFacilities", "max");
    return { ok: true, data: newFacility, status: 201 };
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "Đã có tiện nghi này", status: 409 };
    }
    return { ok: false, error: "Failed to create facility", status: 500 };
  }
}


export async function hotelowner_connectCustomFacilityToRoomType(customFacilityId: string, roomTypeId: string) : Promise<{
  ok: false;
  error: string;
  status: number;
} | {
  ok: true;
  data: { id: string; name: string; type: FacilityType };
  status: number;
}> {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const hotel = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });
  if (!hotel) {
    return { ok: false, error: "Hotel not found for the owner", status: 404 };
  }

  if (!customFacilityId) {
    return { ok: false, error: "Facility ID is required", status: 400 };
  }


  try {
    const newFacility = await prisma.customFacility.update({
      where: { id: customFacilityId },
      data: {
        roomTypes: {
          connect: {
            id: roomTypeId
          },
        },
      },
      select: { id: true, name: true, type: true }
    });

    return { ok: true, data: newFacility, status: 201 };
  } catch (err) {
    return { ok: false, error: "Failed to connect facility to hotel or room type", status: 500 };
  }
}


export async function hotelowner_connectCommonFacility(commonFacilityId: string, roomTypeId?: string) : Promise<{
  ok: false;
  error: string;
  status: number;
} | {
  ok: true;
  data: { id: string; name: string; type: FacilityType };
  status: number;
}> {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const hotel = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });
  if (!hotel) {
    return { ok: false, error: "Hotel not found for the owner", status: 404 };
  }

  if (!commonFacilityId) {
    return { ok: false, error: "Facility ID is required", status: 400 };
  }


  try {
    const newFacility = await prisma.commonFacility.update({
      where: { id: commonFacilityId },
      data: {
        hotels: {
          connect: { id: hotel.id },
        },
        ...(roomTypeId
          ? {
              roomTypes: {
                connect: { id: roomTypeId },
              },
            }
          : {}),
      },
      select: { id: true, name: true, type: true }
    });

    // revalidateTag("hotelowner_getFacilities", "max");
    return { ok: true, data: newFacility, status: 201 };
  } catch (err) {
    return { ok: false, error: "Failed to connect facility to hotel or room type", status: 500 };
  }
}



export async function hotelowner_getCustomFacilities(): Promise<OperationResult<{
  id: string,
  name: string,
  type: FacilityType
}[]>> {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  try {
    const facilities = await prisma.customFacility.findMany({
      where: { hotel: { ownerId: session.user.id } },
      select: { id: true, name: true, type: true }
    });

    return { ok: true, data: facilities };
  } catch (err) {
    return { ok: false, error: "Failed to fetch facilities" };
  }
}

export async function getAllCommonFacilities() {
  try {
    const facilities = await prisma.commonFacility.findMany({
      select: { id: true, name: true, type: true },
    });

    return { ok: true, data: facilities };
  } catch (err) {
    return { ok: false, error: "Failed to fetch facilities" };
  }
}

export async function hotelowner_getCommonFacilitiesThatHisHotelHas() {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  try {
    const facilities = await prisma.commonFacility.findMany({
      where : {
        hotels: {
          some: {
            ownerId: session.user.id,
          },
        },
      },
      select: { id: true, name: true, type: true },
    });

    return { ok: true, data: facilities };
  } catch (err) {
    return { ok: false, error: "Failed to fetch facilities" };
  }
}

export async function hotelowner_getCommonFacilitiesOfRoomType(roomTypeId: string) {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  try {
    const facilities = await prisma.commonFacility.findMany({
      where : {
        roomTypes: {
          some: {
            id: roomTypeId,
            hotel: {
              ownerId: session.user.id
            }
          }
        }
      },
      select: { id: true, name: true, type: true },
    });

    return { ok: true, data: facilities };
  } catch (err) {
    return { ok: false, error: "Failed to fetch facilities" };
  }
}

// NOTE: Only update or delete on WHAT THIS HOTEL OWNER CREATED, not all facilities in the system. So we need to check if the facility belongs to the hotel of this owner before updating or deleting.
// For that, there should be another field in the Facility model: isCommon: boolean, which indicates if this facility is a common facility (like "Free Wi-Fi") or a custom facility created by this hotel owner. If it's a common facility, the hotel owner should not be able to update or delete it. If it's a custom facility, the hotel owner can update or delete it.
// then that field is also an index for the table.
// For updating, if the facility is common, do nothing and notify hotel owner that he can't do that
export async function hotelowner_updateCustomFacility(id: string, data: { name: string; type: FacilityType }) {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  try {
    const updated = await prisma.customFacility.update({
      where: { id, hotel: { ownerId: session.user.id } },
      data,
      select: { id: true, name: true, type: true },
    });
    // revalidateTag("hotelowner_getFacilities", "max");
    return { ok: true, data: updated, status: 200 };
  } catch (err) {
    return { ok: false, error: "Failed to update facility", status: 500 };
  }
}
// For deleting, only "unsubscribe" the hotel out of that facility. (In the implicit key table "_FacilityToHotel" created by Prisma)
export async function hotelowner_deleteCustomFacility(id: string) {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  try {
    await prisma.customFacility.delete({ where: { id, hotel: { ownerId: session.user.id }} });
    return { ok: true, status: 200 };
  } catch (err) {
    return { ok: false, error: "Failed to delete facility", status: 500 };
  }
}


export async function hotelowner_disconnectCommonFacility(id: string) {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  try {
    await prisma.commonFacility.update({
      where: { id },
      data: {
        hotels: {
          disconnect: { ownerId: session.user.id },
        },
      },
    });
    return { ok: true, status: 200 };
  } catch (err) {
    return { ok: false, error: "Failed to delete facility", status: 500 };
  }
}

// NOTE: Custom facility should be N-to-N room types