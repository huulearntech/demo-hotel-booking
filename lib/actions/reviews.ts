import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "../generated/prisma/client";
import { getReviewsOfHotel } from "../generated/prisma/sql";

type CreateReviewForBookingData = Prisma.ReviewUncheckedCreateInput;

// TODO: handle permission and errors more robustly.
export async function user_createReviewForBooking(
  bookingId: string,
  data: CreateReviewForBookingData
) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Ensure the current user is the author of the booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, userId: true },
  });
  if (!booking) {
    throw new Error("Booking not found");
  }
  if (booking.userId !== session.user.id) {
    throw new Error("Forbidden");
  }

  // Upsert the review for the booking (Review has a unique constraint on bookingId)
  return prisma.review.upsert({
    where: { bookingId },
    create: {
      ...data,
      bookingId,
    },
    update: {}, // No update allowed, or you can specify fields to update if you want to allow editing the review
  });
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
        createdAt: reviews[reviews.length - 1].created_at,
        id: reviews[reviews.length - 1].review_id,
      }
    : null;

  const prevCursor = reviews.length > 0
    ? {
        createdAt: reviews[0].created_at,
        id: reviews[0].review_id,
      }
    : null;

  return {
    reviews,
    nextCursor,
    prevCursor,
  };
}
