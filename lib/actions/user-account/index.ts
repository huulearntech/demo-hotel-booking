"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { type OperationResult } from "@/lib/types/operation-result";
import { differenceInDays } from "date-fns";

// This is paid bookings, not count the draft ones.
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
    where: { metadata: { userId: session.user.id } },
    orderBy: { createdAt: "desc" },
    ...pagination,
    include: {
      metadata: {
        select: {
          hotel: { select: { name: true } },
          snapshotRoomPrice: true,
          checkInDate: true,
          checkOutDate: true,
          numRooms: true,
          numGuests: true,
        },
      },
    },
  });

  const items = bookings.map((booking) => {
    const checkIn = booking.metadata.checkInDate;
    const checkOut = booking.metadata.checkOutDate;
    const days = differenceInDays(checkOut, checkIn);
    const totalPrice = booking.metadata.snapshotRoomPrice.mul(days).toNumber();

    const { snapshotRoomPrice, ...metadataWithoutPrice } = booking.metadata;
    return {
      ...booking,
      metadata: metadataWithoutPrice,
      totalPrice,
    } as RecentBookingType;
  });

  const nextCursor = bookings.length === limit ? bookings[bookings.length - 1].id : null;

  return { items, nextCursor };
}

type BookingWithMeta = Prisma.BookingGetPayload<{
  include: {
    metadata: {
      select: {
        hotel: { select: { name: true } };
        snapshotRoomPrice: true;
        checkInDate: true;
        checkOutDate: true;
        numRooms: true;
        numGuests: true;
      };
    };
  };
}>;

export type RecentBookingType = Omit<BookingWithMeta, "metadata"> & {
  metadata: Omit<BookingWithMeta["metadata"], "snapshotRoomPrice">;
  totalPrice: number;
};


import { userUpdateNameSchema } from "@/lib/zod_schemas/auth";

export async function user_updateName(newName: string): Promise<OperationResult<{ id: string; name: string }>> {
  const session = await auth();
  if (!session) {
    return { ok: false, error: "Unauthenticated", status: 401 };
  }
  if ( session.user.role !== "USER") {
    return { ok: false, error: "Unauthorized", status: 403 };
  }

  const parsed = userUpdateNameSchema.safeParse(newName);
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
import { Prisma } from "@/lib/generated/prisma/client";

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