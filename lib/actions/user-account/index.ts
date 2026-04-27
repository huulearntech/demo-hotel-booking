"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { type OperationResult } from "@/lib/types/utils";
import { differenceInDays } from "date-fns";

// TODO: categorize by status.
export async function user_getRecentBookingsPaginated(
  lastCursor: string | null = null,
  limit = 10
) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthenticated");
  }
  if (session.user.role !== "USER") {
    throw new Error("Unauthorized");
  }

  const pagination: {
    take: number;
    cursor?: { id: string };
    skip?: number;
  } = { take: limit };

  if (lastCursor) {
    pagination.cursor = { id: lastCursor };
    pagination.skip = 1;
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    ...pagination,
    select: {
      id: true,
      roomType: {
        select: {
          name: true,
          hotel: {
            select: {
              name: true,
              type: true,
              owner: {
                select: {
                  profileImageUrl: true,
                }
              }
            },
          },
        },
      },
      checkInDate: true,
      checkOutDate: true,
      numRooms: true,
      numAdults: true,
      numChildren: true,
      snapshotRoomTypeName: true,
      snapshotRoomPrice: true,
      status: true,
      createdAt: true,
    }
  });

  const items = bookings.map((booking) => {
    const checkIn = booking.checkInDate;
    const checkOut = booking.checkOutDate;
    const days = differenceInDays(checkOut, checkIn);
    const totalPrice = booking.snapshotRoomPrice.mul(days).toNumber();

    return {
      ...booking,
      totalPrice,
      snapshotRoomPrice: booking.snapshotRoomPrice.toNumber(),
    };
  });

  const nextCursor = bookings.length === limit ? bookings[bookings.length - 1].id : null;

  return { items, nextCursor };
}

export type RecentBookingType = Awaited<ReturnType<typeof user_getRecentBookingsPaginated>>["items"][number];


import { UserUpdateNameData, userUpdateNameSchema } from "@/lib/zod_schemas/auth";

export async function user_updateName(formData_newName: UserUpdateNameData): Promise<OperationResult<{ id: string; name: string }>> {
  const session = await auth();
  if (!session) {
    return { ok: false, error: "Unauthenticated", status: 401 };
  }
  if ( session.user.role !== "USER") {
    return { ok: false, error: "Unauthorized", status: 403 };
  }

  const parsed = userUpdateNameSchema.safeParse(formData_newName);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message, status: 400 };
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: parsed.data,
      select: { id: true, name: true },
    });

    revalidateTag(CACHE_TAGS.userInfo, 'max');
    revalidatePath(PATHS.account);
    return { ok: true, data: user };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message, status: 500 };
  }
}

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { CACHE_TAGS, PATHS } from "@/lib/constants";

// Can't use session = auth() in here.
export const user_getInfoById = unstable_cache(
  async (userId: string) => {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, profileImageUrl: true, email: true },
    });
  },
  [],
  { tags: [CACHE_TAGS.userInfo] }
);

export async function user_createOrUpdateAvatarUrl(avatarUrl: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return prisma.user.update({
    where: { id: session.user.id },
    data: { profileImageUrl: avatarUrl },
    select: { profileImageUrl: true },
  }).then(result => {
    revalidateTag(CACHE_TAGS.userInfo, 'max');
    revalidatePath(PATHS.account);
    return result;
  });
}