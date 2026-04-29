// TODO: decomplicate things.
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { Prisma } from "@/lib/generated/prisma/client";

const reviewSelect = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  reply: true,
  repliedAt: true,
  booking: {
    select: {
      id: true,
      user: { select: { name: true, email: true, profileImageUrl: true } },
      checkInDate: true,
      checkOutDate: true,
      numRooms: true,
      snapshotRoomPrice: true,
      snapshotRoomTypeName: true,
      roomTypeId: true,
      roomType: { select: { name: true } },
    },
  },
} satisfies Prisma.ReviewSelect;

function baseWhere(ownerId: string) {
  return {
    booking: {
      roomType: {
        hotel: {
          ownerId,
        },
      },
    },
  };
}

// TODO: Clean up
export async function fetchUnrepliedReviews() {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") return [];

  return prisma.review.findMany({
    where: {
      ...baseWhere(session.user.id),
      reply: null,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: reviewSelect,
  }).then((reviews) => reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    repliedAt: r.repliedAt ? r.repliedAt.toISOString() : null,
    // Safely extract snapshotRoomPrice and convert Decimal -> number if needed
    booking: r.booking
      ? {
        ...r.booking,
        snapshotRoomPrice: r.booking.snapshotRoomPrice.toNumber()
      }
      : null,
  })));
}

export type RepliedReviewType = Awaited<ReturnType<typeof fetchUnrepliedReviews>>[number];

export async function fetchRepliedReviews() {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") return [];

  return prisma.review.findMany({
    where: {
      ...baseWhere(session.user.id),
      NOT: { reply: null },
    },
    orderBy: { repliedAt: "desc" },
    take: 100,
    select: reviewSelect,
  }).then((reviews) => reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    repliedAt: r.repliedAt ? r.repliedAt.toISOString() : null,
    // Safely extract snapshotRoomPrice and convert Decimal -> number if needed
    booking: r.booking
      ? {
        ...r.booking,
        snapshotRoomPrice: r.booking.snapshotRoomPrice.toNumber()
      }
      : null,
  })));
}

export type UnrepliedReviewType = Awaited<ReturnType<typeof fetchUnrepliedReviews>>[number];
// TODO: these types are identical.


export async function hotelowner_replyToReview(reviewId: string, replyContent: string) {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    throw new Error("Unauthorized");
  }

  // Ensure the review belongs to a booking that ultimately belongs to a hotel owned by the current user
  const existing = await prisma.review.findFirst({
    where: {
      id: reviewId,
      booking: {
        roomType: {
          hotel: {
            ownerId: session.user.id,
          },
        },
      },
    },
  });

  if (!existing) {
    throw new Error("Review not found or you do not have permission to modify it.");
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      reply: replyContent,
      repliedAt: new Date(),
    },
  });

  return {
    id: updated.id,
    reply: updated.reply,
    repliedAt: updated.repliedAt ? updated.repliedAt.toISOString() : null,
  };
}