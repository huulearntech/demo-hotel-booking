import { z } from "zod";

export const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.preprocess(val => Number(val), z.number().min(1, "Vui lòng chọn đánh giá").max(5)),
  // rating: z.number().min(1, "Vui lòng chọn đánh giá").max(5),
  review: z.string().min(10, "Vui lòng nhập ít nhất 10 ký tự").max(1000, "Nội dung quá dài"),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
export type ReviewFormInput  = z.input<typeof reviewSchema>;
export type ReviewFormOutput = z.output<typeof reviewSchema>;