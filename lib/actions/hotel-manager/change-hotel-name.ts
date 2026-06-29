"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { type OperationResult } from "@/lib/types/utils";
import { UserUpdateNameData, userUpdateNameSchema } from "@/lib/zod_schemas/auth";
import { CACHE_TAGS, PATHS } from "@/lib/constants";



export async function hotelowner_updateHotelName(formData_newName: UserUpdateNameData): Promise<OperationResult<{ id: string; name: string }>> {
  const session = await auth();
  if (!session) {
    return { ok: false, error: "Unauthenticated", status: 401 };
  }
  if (session.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Unauthorized", status: 403 };
  }

  const parsed = userUpdateNameSchema.safeParse(formData_newName);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message, status: 400 };
  }

  try {
    const user = await prisma.hotel.update({
      where: { ownerId: session.user.id },
      data: parsed.data,
      select: { id: true, name: true },
    });

    revalidateTag(CACHE_TAGS.hotelName, 'max');
    revalidatePath(PATHS.hotelAccount);
    return { ok: true, data: user };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message, status: 500 };
  }
}

export const hotelowner_getHotelName = unstable_cache(
  async (ownerId: string) => {
    return prisma.hotel.findUnique({
      where: { ownerId },
      select: { name: true },
    });
  },
  [],
  { tags: [CACHE_TAGS.hotelName] }
);