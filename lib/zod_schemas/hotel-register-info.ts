import { z } from "zod";
import { HotelType } from "@/lib/generated/prisma/enums";

export const schema_HotelInfoForm = z.object({
  name:         z.string().trim().min(1, "Tên cơ sở lưu trú là bắt buộc."),
  wardId:       z.string().trim().min(1, "Địa chỉ là bắt buộc."),
  longitude:    z.string().trim().min(1, "Kinh độ là bắt buộc").pipe(z.coerce.number()).refine((val) => val >= -180 && val <= 180),
  latitude:     z.string().trim().min(1, "Vĩ độ là bắt buộc").pipe(z.coerce.number()).refine((val) => val >= -90 && val <= 90),
  type:         z.enum(Object.values(HotelType)),
  description:  z.string().optional(),
  checkInTime:  z
    .iso.time({ precision: -1, error: "Thời gian nhận phòng không hợp lệ" })
    .transform((str) => `1970-01-01T${str}:00Z`),

  checkOutTime: z
    .iso.time({ precision: -1, error: "Thời gian trả phòng không hợp lệ" })
    .transform((str) => `1970-01-01T${str}:00Z`),

  imageUrls: z.object({ url: z.url() }).array()
    .nonempty("Phải có ít nhất một hình ảnh.")
    .transform((arr) => arr.map((item) => item.url)),
});

export type HotelInfo_FormInput  = z.input<typeof schema_HotelInfoForm>;
export type HotelInfo_FormOutput = z.output<typeof schema_HotelInfoForm>;

