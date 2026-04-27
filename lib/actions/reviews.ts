import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "../generated/prisma/client";
import { getReviewsOfHotel } from "../generated/prisma/sql";
import { OperationResult } from "../types/utils";


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
  cursorCreatedAt?: Date,
  cursorId?: string,
  limit: number = 1
) {
  
  const reviews = await prisma.$queryRawTyped(getReviewsOfHotel(
    hotelId,
    cursorCreatedAt ?? null,
    cursorId ?? null,
    limit
  ));

  // Determine next and previous cursors
  const nextCursor = reviews.length > 0
    ? {
        createdAt: reviews[reviews.length - 1].createdAt,
        id: reviews[reviews.length - 1].reviewId,
      }
    : null;

  const prevCursor = reviews.length > 0
    ? {
        createdAt: reviews[0].createdAt,
        id: reviews[0].reviewId,
      }
    : null;

  return {
    reviews,
    nextCursor,
    prevCursor,
  };
}
