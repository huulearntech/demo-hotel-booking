import { z } from "zod";
import { BedType, FacilityType } from "@/lib/generated/prisma/browser";

export const schema_RoomType = z.object({
  name: z.string().min(1, "Tên loại phòng không được để trống"),
  adultCapacity:    z.coerce.number("Trường này là bắt buộc").int().gt(0, "Phải có sức chứa > 0"),
  childrenCapacity: z.coerce.number().int(),
  areaM2:           z.coerce.number("Trường này là bắt buộc").gt(0, "Phải có diện tích > 0"),
  bedType:          z.enum(Object.values(BedType)),
  price:            z.coerce.number("Trường này là bắt buộc").gt(1000, "Phải có giá > 1000 VND"),
  imageUrls:        z.object({ url: z.url() }).array().nonempty("Cần có ít nhất 1 ảnh").transform((arr) => arr.map((item) => item.url)),
  description:      z.string().optional(),

  facilities: z.object({
    facility: z.object({
      id  : z.string(),
      name: z.string(),
      type: z.enum(Object.values(FacilityType)),
    })
  }).array()
    .transform((arr) => arr.map((item) => item.facility)),

  customFacilities: z.object({
    facility: z.object({
      id  : z.string(),
      name: z.string(),
      type: z.enum(Object.values(FacilityType)),
    })
  }).array()
    .transform((arr) => arr.map((item) => item.facility)),
  
  roomsName: z.array(z.object({
    name: z.string().min(1, "Tên phòng không được để trống"),
  })).transform(arr => arr.map(item => item.name)).optional(),
})

export type RoomType_FormInput  = z.input<typeof schema_RoomType>;
export type RoomType_FormOutput = z.output<typeof schema_RoomType>;
export type RoomType_FormValues = z.infer<typeof schema_RoomType>;

export const schema_Room = z.object({
  name: z.string().min(1, "Tên phòng không được để trống"),
  typeId: z.string().min(1, "Loại phòng không được để trống"),
})

export type RoomFormInput = z.input<typeof schema_Room>;
export type RoomFormOutput = z.output<typeof schema_Room>;
export type RoomFormValues = z.infer<typeof schema_Room>;


export const schema_MultiRoomType = z.object({
  roomTypes: schema_RoomType.array().min(1, "Phải có ít nhất một phòng"),
}).transform((data) => data.roomTypes);

export type MultiRoomType_FormInput = z.input<typeof schema_MultiRoomType>;
export type MultiRoomType_FormOutput = z.output<typeof schema_MultiRoomType>;
export type MultiRoomType_FormValues = z.infer<typeof schema_MultiRoomType>;