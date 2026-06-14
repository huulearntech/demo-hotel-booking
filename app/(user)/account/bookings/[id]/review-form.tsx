"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { reviewSchema, ReviewFormInput, ReviewFormOutput } from "@/lib/zod_schemas/review";
import { submitReview } from "@/lib/actions/user-account/review";
import { cn } from "@/lib/utils";

export default function ReviewForm({ bookingId }: { bookingId: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ReviewFormInput, unknown, ReviewFormOutput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      bookingId,
      rating: 5,
      review: "",
    },
  });

  const selectedRating = form.watch("rating");

  const onSubmit = async (values: ReviewFormOutput) => {
    // console.log("Submitting review with values:", values);
    setServerError(null);

    try {
      await submitReview(values);
      setSubmitted(true);
    } catch (error) {
      setServerError("Không thể gửi đánh giá. Vui lòng thử lại.");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...form.register("bookingId")} />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Đánh giá</span>
        <div className="flex gap-2">
          {["1", "2", "3", "4", "5"].map((value) => (
            <label
              key={value}
              className={cn("cursor-pointer rounded-full border size-10 flex items-center justify-center text-sm transition",
                selectedRating === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-muted border-muted text-muted-foreground"
              )}
            >
              <input
                type="radio"
                value={value}
                {...form.register("rating")}
                className="sr-only"
              />
              {value}
            </label>
          ))}
        </div>
        {form.formState.errors.rating ? (
          <p className="text-sm text-destructive">{form.formState.errors.rating.message}</p>
        ) : null}
      </div>

      <Textarea
        {...form.register("review")}
        placeholder="Viết phản hồi về trải nghiệm của bạn..."
        rows={5}
        required
      />
      {form.formState.errors.review ? (
        <p className="text-sm text-destructive">{form.formState.errors.review.message}</p>
      ) : null}
      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

      <Button type="submit" disabled={form.formState.isSubmitting || submitted}>
        {submitted ? "Đã gửi đánh giá" : form.formState.isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
      </Button>
    </form>
  );
}