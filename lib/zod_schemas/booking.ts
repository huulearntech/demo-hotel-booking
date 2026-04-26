import { z } from "zod";

export const schema_bookingForm = z.object({
  name: z.string().min(1, "Vui lòng nhập họ và tên"),
  email: z.email("Email không hợp lệ"),
  phone: z.string().regex(/^((\+?84)|0)[0-9]{9}$/, "Số điện thoại không hợp lệ"),
  notes: z.string().max(500, "Ghi chú không được vượt quá 500 ký tự").optional(),
});

export type BookingFormValues = z.infer<typeof schema_bookingForm>;

export const defaultBookingFormValues: BookingFormValues = {
  name: "",
  phone: "",
  email: "",
  notes: "",
};
