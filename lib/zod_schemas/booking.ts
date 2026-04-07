import { z } from "zod";

// TODO: edit the phone regex to fit the vietnamese phone number format
export const schema_bookingForm = z.object({
  name: z.string().min(1, "Vui lòng nhập họ và tên"),
  email: z.email("Email không hợp lệ"),
  phone: z.string().regex(/^[0-9()+-\s]{6,20}$/, "Số điện thoại không hợp lệ"),
  note: z.string().max(500, "Ghi chú không được vượt quá 500 ký tự").optional(),
});

export type BookingFormValues = z.infer<typeof schema_bookingForm>;

export const defaultBookingFormValues: BookingFormValues = {
  name: "",
  phone: "",
  email: "",
  note: "",
};
