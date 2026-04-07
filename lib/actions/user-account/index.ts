"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { type OperationResult } from "@/lib/types/operation-result";
import { differenceInDays } from "date-fns";

// This is paid bookings, not count the draft ones.
export async function user_getRecentBookings(): Promise<OperationResult<RecentBookingType[]>> {
  const session = await auth();
  if (!session) {
    return { ok: false, error: "Unauthenticated", status: 401 };
  }
  if (session.user.role !== "USER") {
    return { ok: false, error: "Unauthorized", status: 403 };
  }

  // Why the fuck does this show a random day for both dates on all bookings?
  const bookings = await prisma.booking.findMany({
    where: { metadata: { userId: session.user.id } },
    orderBy: { createdAt: "desc" },
    include: {
      metadata: {
        select: {
          hotel: { select: { name: true } },
          snapshotRoomPrice: true,
          checkInDate: true,
          checkOutDate: true,
        }
      }
    },
  });
  console.log('Fetched bookings:', bookings);

  const result = bookings.map(booking => {
    const days = differenceInDays(booking.metadata.checkOutDate, booking.metadata.checkInDate);
    console.log('checkInDate:', booking.metadata.checkInDate);
    console.log('checkOutDate:', booking.metadata.checkOutDate);
    console.log('days:', days);
    const totalPrice = booking.metadata.snapshotRoomPrice.mul(days).toNumber();

    // remove the non-serializable snapshotRoomPrice before returning
    const { snapshotRoomPrice, ...metadataWithoutPrice } = booking.metadata;
    return {
      ...booking,
      metadata: metadataWithoutPrice,
      totalPrice,
    };
  });

  result.forEach(b => console.log(b.totalPrice));

  return { ok: true, data: result };
}

type BookingWithMeta = Prisma.BookingGetPayload<{
  include: {
    metadata: {
      select: {
        hotel: { select: { name: true } };
        snapshotRoomPrice: true;
        checkInDate: true;
        checkOutDate: true;
      }
    }
  }
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

export const user_getInfoById = unstable_cache(
  async (userId: string | null) => {
    if (!userId) { return null; }

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