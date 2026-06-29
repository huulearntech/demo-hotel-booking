"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudUploadIcon, SaveIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";
import { schema_RoomType, type RoomType_FormInput, type RoomType_FormOutput } from "@/lib/zod_schemas/create-room";
import { hotelowner_updateRoomTypeById } from "@/lib/actions/hotel-manager/room-types";
import { toast } from "sonner";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { FacilityType } from "@/lib/generated/prisma/enums";
import CreateFacilityDialog from "../create-facility-dialog";

export default function RoomEditSingle({
  roomTypeId,
  defaultValues
}: {
  roomTypeId: string;
  defaultValues: RoomType_FormInput
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<RoomType_FormInput, unknown, RoomType_FormOutput>({
    resolver: zodResolver(schema_RoomType),
    defaultValues,
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = form;

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: "imageUrls",
  });

  // inside RoomFields before return
  const {
    fields: facilityFields,
    append: appendFacility,
    remove: removeFacility,
  } = useFieldArray({
    control,
    name: "facilities",
  });

  const handleUploadSuccess = (result: any) => {
    const infos = Array.isArray(result.info) ? result.info : [result.info];
    infos.forEach((info: any) => {
      const url = info.secure_url ?? info.url;
      if (url) appendImage({ url });
    });
  };

  const onSubmit = (data: RoomType_FormOutput) => {
    startTransition(async () => {
      const response = await hotelowner_updateRoomTypeById(roomTypeId, data);
      if (!response.ok) {
        if (response.status === 404) {
          setError("root", { message: "Loại phòng không tồn tại." });
        } else if (response.status === 403) {
          setError("root", { message: "Bạn không có quyền chỉnh sửa loại phòng này." });
        } else if (response.status === 409) {
          setError("name", { message: "Tên loại phòng phải là duy nhất trong khách sạn này." });
        } else {
          toast.error(response.error || "Đã xảy ra lỗi khi cập nhật loại phòng.");
        }
      } else {
        toast.success("Cập nhật loại phòng thành công!");
      }
    });
  };

  return (
    <FormProvider {...form}>
      <form className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Chỉnh sửa loại phòng</CardTitle>
            <CardDescription>Điền thông tin cơ bản cho loại phòng này.</CardDescription>
            <CardAction>
              <Button
                disabled={isPending}
                onClick={handleSubmit(onSubmit)}
              >
                <SaveIcon className="size-4" />
                Lưu thay đổi
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex flex-col gap-1">
              <Label htmlFor="name" className="text-sm font-semibold">Tên loại phòng</Label>
              <Input id="name" className="w-full" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="price" className="text-sm font-semibold">Giá mỗi đêm (VND)</Label>
              <Input id="price" type="number" step="0.01" className="w-full" {...register("price", { valueAsNumber: true })} />
              {errors.price && <p className="text-xs text-destructive mt-1">{errors.price.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="areaM2" className="text-sm font-semibold">Diện tích (m²)</Label>
              <Input id="areaM2" type="number" className="w-full" {...register("areaM2", { valueAsNumber: true })} />
              {errors.areaM2 && <p className="text-xs text-destructive mt-1">{errors.areaM2.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="adultCapacity" className="text-sm font-semibold">Sức chứa người lớn</Label>
              <Input id="adultCapacity" type="number" className="w-full" {...register("adultCapacity", { valueAsNumber: true })} />
              {errors.adultCapacity && <p className="text-xs text-destructive mt-1">{errors.adultCapacity.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="childrenCapacity" className="text-sm font-semibold">Sức chứa trẻ em</Label>
              <Input id="childrenCapacity" type="number" className="w-full" {...register("childrenCapacity", { valueAsNumber: true })} />
              {errors.childrenCapacity && <p className="text-xs text-destructive mt-1">{errors.childrenCapacity.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-sm font-semibold">Loại giường</Label>
              <Select value={form.getValues("bedType")} onValueChange={(value) => form.setValue("bedType", value as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Single</SelectItem>
                  <SelectItem value="DOUBLE">Double</SelectItem>
                  <SelectItem value="QUEEN">Queen</SelectItem>
                  <SelectItem value="KING">King</SelectItem>
                  <SelectItem value="TWIN">Twin</SelectItem>
                </SelectContent>
              </Select>
              {errors.bedType && <p className="text-xs text-destructive mt-1">{errors.bedType.message}</p>}
            </div>


            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Tiện nghi</Label>
                <CreateFacilityDialog
                  roomTypeId={roomTypeId} // FIX: Putting business logic in UI. Shame.
                  onCreate={(facility) => {
                    appendFacility({
                      facility: {
                        id: facility.id,
                        name: facility.name,
                        type: facility.type,
                      },
                    });
                  }}
                />
              </div>

              <div className="flex flex-col gap-y-3">
                {facilityFields.map((facility, facilityIndex) => {
                  const facilityError = errors?.facilities?.[facilityIndex] as any;
                  return (
                    <div
                      key={facility.id}
                      className="w-full flex gap-3"
                    >
                      <div className="w-full flex flex-col gap-1">
                        <Label
                          htmlFor={`facilities.${facilityIndex}.name`}
                          className="text-sm font-medium"
                        >
                          Tên tiện nghi
                        </Label>
                        <Input
                          id={`facilities.${facilityIndex}.name`}
                          className="w-full"
                          {...register(`facilities.${facilityIndex}.facility.name` as const)}
                        />
                        {facilityError?.name && (
                          <p className="text-xs text-destructive mt-1">
                            {facilityError.name.message}
                          </p>
                        )}
                      </div>

                      <FormField
                        control={control}
                        name={`facilities.${facilityIndex}.facility.type` as const}
                        render={({ field }) => (
                          <FormItem className="flex flex-col gap-1 w-1/3">
                            <FormLabel className="text-sm font-medium">Loại tiện nghi</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Chọn loại tiện nghi" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(FacilityType).map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, " ")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 w-10 self-end"
                        onClick={() => removeFacility(facilityIndex)}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              {errors?.facilities && typeof (errors.facilities as any).message === "string" && (
                <p className="text-xs text-destructive mt-1">
                  {(errors.facilities as any).message}
                </p>
              )}
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <Label className="text-sm font-semibold">Mô tả</Label>
              <Textarea {...register("description")} rows={4} />
              {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
            </div>

            <div className="md:col-span-2 flex flex-col gap-2">
              <Label className="text-sm font-semibold">Hình ảnh</Label>
              <div className="flex flex-wrap gap-2">
                {imageFields.length === 0 && <p className="text-sm text-muted-foreground">Chưa tải ảnh nào lên.</p>}
                {imageFields.map((imgField, imgIndex) => (
                  <div key={imgField.id} className="group relative w-48 h-36 rounded-md overflow-hidden">
                    <Image src={imgField.url} alt={`Image ${imgIndex + 1}`} fill className="absolute inset-0 object-contain" />
                    <Button
                      type="button"
                      variant="ghost"
                      className="size-6 absolute top-1 right-1 bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(imgIndex)}
                    >
                      <XIcon className="size-4" />
                    </Button>
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
                    maxFileSize: 128 * 1024,
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
              {errors.imageUrls && <p className="text-xs text-destructive mt-1">{(errors.imageUrls as any)?.message ?? "Invalid image URLs"}</p>}
            </div>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  );
}
