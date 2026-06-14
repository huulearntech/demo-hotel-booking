"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { reviewSchema, type ReviewFormValues } from "@/lib/zod_schemas/review";
import { revalidatePath } from "next/cache";

export async function submitReview(reviewData: ReviewFormValues) {
  const parsed = reviewSchema.parse(reviewData);

  const session = await auth();
  if (!session) {
    throw new Error("Unauthenticated");
  }
  if (session.user.role !== "USER") {
    throw new Error("Unauthorized");
  }

  await prisma.review.upsert({
    where: { bookingId: parsed.bookingId, booking: { userId: session.user.id } },
    create: {
      bookingId: parsed.bookingId,
      rating: parsed.rating,
      comment: parsed.review,
    },
    update: {
      rating: parsed.rating,
      comment: parsed.review,
    },
  });
  revalidatePath(`/account/bookings/${parsed.bookingId}`);
}
