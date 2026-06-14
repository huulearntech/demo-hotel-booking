"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "../generated/prisma/client";
import { getReviewsOfHotel } from "../generated/prisma/sql";
import { OperationResult } from "../types/utils";
import { DEFAULT_PAGE_SIZE } from "../constants";

export type ReviewCursor = { createdAt: Date; id: string };

export async function user_createReviewForBooking(
  bookingId: string,
  data: Prisma.ReviewUncheckedCreateInput,
): Promise<OperationResult<{ reviewId: string }>> {
  const session = await auth();
  if (!session) {
    return { ok: false, status: 401, error: "Unauthenticated" };
  }
  if (session.user.role !== "USER") {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  // Ensure the current user is the author of the booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, userId: true },
  });
  if (!booking) {
    return { ok: false, status: 404, error: "Booking not found" };
  }
  if (booking.userId !== session.user.id) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  // Create the review for the booking (ensure one review per booking and user)
  try {
    const existing = await prisma.review.findFirst({
      where: { booking: { id: bookingId, userId: session.user.id } },
    });
    if (existing) {
      return { ok: false, status: 409, error: "Review already exists for this booking" };
    }

    const created = await prisma.review.create({
      data: {
        ...data,
        bookingId,
      },
    });

    return { ok: true, data: { reviewId: created.id } };
  } catch (err) {
    return { ok: false, status: 500, error: "Failed to create review" };
  }
}

export async function user_getReviewsOfHotel(
  hotelId: string,
  limit: number = DEFAULT_PAGE_SIZE,
  queryPrevCursor: ReviewCursor | null = null,
  queryNextCursor: ReviewCursor | null = null,
  directionIsNext: boolean = true,
) {
  const fetchedReviews = await prisma.$queryRawTyped(getReviewsOfHotel(
    hotelId,
    queryPrevCursor?.createdAt ?? null,
    queryPrevCursor?.id ?? null,
    queryNextCursor?.createdAt ?? null,
    queryNextCursor?.id ?? null,
    directionIsNext,
    limit + 1,
  ));

  const hasMore = fetchedReviews.length === limit + 1;
  const reviews = hasMore ? fetchedReviews.slice(0, limit) : fetchedReviews;

  const first = reviews[0];
  const last = reviews[reviews.length - 1];

  let nextCursor: ReviewCursor | null = null;
  let prevCursor: ReviewCursor | null = null;

  if (reviews.length > 0) {
    if (directionIsNext) {
      // When moving forward: hasMore means there's a next page.
      if (hasMore && last) {
        nextCursor = { createdAt: last.createdAt, id: last.id };
      }
      // prevCursor exists if this is not the very first page (we had a queryNextCursor)
      if (queryNextCursor && first) {
        prevCursor = { createdAt: first.createdAt, id: first.id };
      }
    } else {
      // When moving backward: hasMore means there's a previous page.
      if (hasMore && first) {
        prevCursor = { createdAt: first.createdAt, id: first.id };
      }
      // nextCursor exists if this is not the very last page (we had a queryPrevCursor)
      if (queryPrevCursor && last) {
        nextCursor = { createdAt: last.createdAt, id: last.id };
      }
    }
  }

  return {
    items: reviews,
    nextCursor,
    prevCursor,
  };
}
