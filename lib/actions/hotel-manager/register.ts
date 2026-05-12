"use server";

import prisma from "@/lib/prisma";
import { auth, unstable_update } from "@/auth";

import { HotelInfo_FormOutput } from "@/lib/zod_schemas/hotel-register-info";

export async function getProvinces() {
  return prisma.province.findMany({
    select: {
      id: true,
      name: true,
    },
  });
};

export async function getDistrictsByProvinceId(provinceId: string) {
  return prisma.district.findMany({
    where: { provinceId },
    select: {
      id: true,
      name: true,
    },
  });
};

export async function getWardsByDistrictId(districtId: string) {
  return prisma.ward.findMany({
    where: { districtId },
    select: {
      id: true,
      name: true,
    },
  });
};

export async function registerHotel(hotelInfoFormData: HotelInfo_FormOutput) {
  const session = await auth();

  if (session?.user.role !== "HOTEL_OWNER" && session?.user.status !== "HOTEL_OWNER_FILLING_INFORMATION") {
    throw new Error("Unauthorized");
  }

  await prisma.$transaction(async (tx) => {
    await tx.hotel.create({
      data: {
        ...hotelInfoFormData,
        ownerId: session.user.id,
        rating: 0,
        numberOfReviews: 0,
      }
    });

    await tx.user.update({
      where: { id: session.user.id },
      data: { status: "ACTIVE" }, // NOTE: of course in real app, this must be approved by admin or something.
    });

    await unstable_update({ user: { ...session.user, status: "ACTIVE" } })
  });
};