"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import { schema_MultiRoomType, type MultiRoomType_FormInput, MultiRoomType_FormOutput } from "@/lib/zod_schemas/create-room";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { hotelowner_createManyRoomTypes } from "@/lib/actions/hotel-manager/room-types";

type MultiRoomFormType = ReturnType<typeof useForm<MultiRoomType_FormInput, unknown, MultiRoomType_FormOutput>>;

export default function RoomForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<MultiRoomType_FormInput, unknown, MultiRoomType_FormOutput>({
    resolver: zodResolver(schema_MultiRoomType),
    defaultValues: {
      roomTypes: [
        {
          name: "",
          price: 0,
          adultCapacity: 0,
          childrenCapacity: 0,
          areaM2: 0,
          bedType: "SINGLE",
          imageUrls: [],
        },
      ],
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = form;

  const { fields: roomFields, append: appendRoom, remove: removeRoom } = useFieldArray({
    control,
    name: "roomTypes",
  });

  // This is ugly. I wonder if isSubmitting from react hook form is good.
  async function onSubmitLocal(data: MultiRoomType_FormOutput) {
    startTransition(async () => {
      const result = await hotelowner_createManyRoomTypes(data);
      if (result.ok) {
        form.reset();
      } else {
        setError("root", { message: result.error });
      }
    });
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmitLocal)} className="space-y-4">
        {roomFields.map((field, idx) => (
          <RoomFields
            key={field.id}
            index={idx}
            control={control}
            register={register}
            errors={errors}
            // roomFields={roomFields}
            removeRoom={removeRoom}
          />
        ))}

        <div className="flex gap-2">
          <div className="w-1/3"></div>
          <div className="w-1/3 flex justify-center">
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2"
              onClick={() =>
                appendRoom({
                  name: "",
                  price: 0,
                  adultCapacity: 0,
                  childrenCapacity: 0,
                  areaM2: 0,
                  bedType: "SINGLE",
                  imageUrls: [],
                })
              }
              disabled={isPending}
            >
              <PlusIcon className="size-4" />
              Thêm loại phòng
            </Button>
          </div>

          {roomFields.length > 0 &&
            <div className="w-1/3 flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? <> <Loader2Icon className="size-4 animate-spin" /> Đang lưu...  </>
                  : <> <SaveAllIcon className="size-4" /> Lưu tất cả </>
                }
              </Button>
            </div>
          }
        </div>
      </form>
    </FormProvider>
  );
}

/* RoomFields moved out of RoomForm so it keeps a stable identity across renders
  which prevents inputs from being remounted and losing focus. */

import { CldUploadWidget } from "next-cloudinary";
import { CloudUploadIcon, Loader2Icon, PlusIcon, SaveAllIcon, SaveIcon, XIcon } from "lucide-react";
import Image from "next/image";

// Should rename to RoomCard or something. It's not just fields.
export function RoomFields({
  index,
  control,
  register,
  errors,
  // roomFields,
  removeRoom,
}: {
  index: number;
  control: MultiRoomFormType["control"];
  register: MultiRoomFormType["register"];
  errors: MultiRoomFormType["formState"]["errors"];
  // roomFields: FieldArrayWithId<MultiRoomType_FormInput, "roomTypes", "id">[];
  removeRoom: (i: number) => void;
}) {
  // const field = roomFields[index]; // Not used but maybe useful in the future?

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control,
    name: `roomTypes.${index}.imageUrls` as const,
  });

  const roomErrors = (errors.roomTypes && errors.roomTypes[index]) ?? ({} as any);

  const handleUploadSuccess = (result: any) => {
    // result.info may be a single object or an array depending on options
    const infos = Array.isArray(result.info) ? result.info : [result.info];
    infos.forEach((info: any) => {
      const url = info.secure_url ?? info.url;
      if (url) {
        appendImage({ url });
      }
    });
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Loại phòng {index + 1}</CardTitle>
        <CardDescription> Điền thông tin chi tiết cho loại phòng này. </CardDescription>
        <CardAction>
          <Button type="button" variant="ghost" size="sm" onClick={() => removeRoom(index)}>
            <XIcon className="size-4" />
            <span className="sr-only">Bỏ loại phòng này</span>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 flex flex-col gap-1">
          <Label htmlFor={`roomTypes.${index}.name`} className="text-sm font-medium">
            Tên loại phòng
          </Label>
          <Input id={`roomTypes.${index}.name`} className="w-full" {...register(`roomTypes.${index}.name` as const)} />
          {roomErrors?.name && <p className="text-xs text-destructive mt-1">{roomErrors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={`roomTypes.${index}.price`} className="text-sm font-medium">
            Giá mỗi đêm (VND)
          </Label>
          <Input
            id={`roomTypes.${index}.price`}
            type="number"
            step="0.01"
            className="w-full"
            {...register(`roomTypes.${index}.price`, { valueAsNumber: true })}
          />
          {roomErrors?.price && <p className="text-xs text-destructive mt-1">{roomErrors.price.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={`roomTypes.${index}.areaM2`} className="text-sm font-medium">
            Diện tích (m²)
          </Label>
          <Input id={`roomTypes.${index}.areaM2`} type="number" className="w-full" {...register(`roomTypes.${index}.areaM2` as const)} />
          {roomErrors?.areaM2 && <p className="text-xs text-destructive mt-1">{roomErrors.areaM2.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={`roomTypes.${index}.adultCapacity`} className="text-sm font-medium">
            Sức chứa người lớn
          </Label>
          <Input id={`roomTypes.${index}.adultCapacity`} type="number" className="w-full" {...register(`roomTypes.${index}.adultCapacity` as const)} />
          {roomErrors?.adultCapacity && <p className="text-xs text-destructive mt-1">{roomErrors.adultCapacity.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={`roomTypes.${index}.childrenCapacity`} className="text-sm font-medium">
            Sức chứa trẻ em
          </Label>
          <Input id={`roomTypes.${index}.childrenCapacity`} type="number" className="w-full" {...register(`roomTypes.${index}.childrenCapacity` as const)} />
          {roomErrors?.childrenCapacity && <p className="text-xs text-destructive mt-1">{roomErrors.childrenCapacity.message}</p>}
        </div>

        <FormField
          control={control}
          name={`roomTypes.${index}.bedType` as const}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel className="text-sm font-medium">Loại giường</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select bed type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SINGLE">Single</SelectItem>
                  <SelectItem value="DOUBLE">Double</SelectItem>
                  <SelectItem value="QUEEN">Queen</SelectItem>
                  <SelectItem value="KING">King</SelectItem>
                  <SelectItem value="TWIN">Twin</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <div className="md:col-span-2 flex flex-col gap-2">
          <Label className="text-sm font-medium">Hình ảnh</Label>

          <div className="flex flex-wrap gap-2">
            {imageFields.length === 0 && <p className="text-sm text-muted-foreground">Chưa tải ảnh nào lên.</p>}

            {imageFields.map((imgField, imgIndex) => (
              <div key={imgField.id} className="group relative w-48 h-36 rounded-md overflow-hidden">
                <Image
                  src={imgField.url}
                  alt={`Room ${index + 1} image ${imgIndex + 1}`}
                  fill
                  className="absolute inset-0 object-contain"
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="size-6 absolute top-1 right-1 bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(imgIndex)}
                >
                  <XIcon className="size-4" />
                </Button>

                <input
                  type="hidden"
                  {...register(`roomTypes.${index}.imageUrls.${imgIndex}.url` as const)}
                  defaultValue={imgField.url}
                />
              </div>
            ))}
          </div>

          <div>
            <CldUploadWidget
              uploadPreset={process.env.CLOUDINARY_UPLOAD_PRESET}
              signatureEndpoint="/api/sign-cloudinary-params"
              onSuccess={handleUploadSuccess}
              options={{
                maxFiles: 10,
                multiple: true,
                clientAllowedFormats: ["jpg", "jpeg", "png"],
                resourceType: "image",
                maxFileSize: 128 * 1024, // 128KB
              }}
            >
              {({ open }) => (
                <Button type="button" variant="outline" onClick={() => open?.()}>
                  <CloudUploadIcon className="size-4" />
                  Tải ảnh lên
                </Button>
              )}
            </CldUploadWidget>
          </div>

          {roomErrors?.imageUrls && <p className="text-xs text-destructive mt-1">{(roomErrors.imageUrls as any)?.message ?? "Invalid image URLs"}</p>}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center gap-4">
        <div className="text-sm text-destructive">{errors.roomTypes?.[index]?.message}</div>
      </CardFooter>
    </Card>
  );
}