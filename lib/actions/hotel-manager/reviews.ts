"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { hotelowner_getReviews as core_hotelowner_getReviews } from "@/lib/generated/prisma/sql";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

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

export async function hotelowner_getReviews(
  limit: number = DEFAULT_PAGE_SIZE,
  replied: boolean | null,
  cursor: {
    createdAt: Date,
    id: string,
  } | null,
) {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    throw new Error("Unauthorized");
  }

  const hotel = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!hotel) {
    throw new Error("Hotel not found for the current owner.");
  }

  const reviews = await prisma.$queryRawTyped(core_hotelowner_getReviews(
    hotel.id,
    limit,
    cursor ? cursor.createdAt : null,
    cursor ? cursor.id : null,
    replied
  ))

  const nextCursor = reviews.length === limit
    ? {
      createdAt: reviews[reviews.length - 1].createdAt,
      id: reviews[reviews.length - 1].id,
    }
    : null;


  return {
    items: reviews,
    nextCursor
  }

}