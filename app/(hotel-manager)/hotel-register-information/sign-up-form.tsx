"use client";

import { useTransition } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { registerHotel } from "@/lib/actions/hotel-manager/register";

import {
  schema_HotelInfoForm,
  type HotelInfo_FormInput,
  type HotelInfo_FormOutput
} from "@/lib/zod_schemas/hotel-register-info";


import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import LocationSelect from "./location-select";
import { CldUploadWidget } from "next-cloudinary";
import { CloudUploadIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";


export default function HotelSignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<HotelInfo_FormInput, unknown, HotelInfo_FormOutput>({
    resolver: zodResolver(schema_HotelInfoForm),
    defaultValues: {
      name: "",
      wardId: "",
      longitude: "",
      latitude: "",
      type: "HOTEL",
      checkInTime: "14:00",
      checkOutTime: "12:00",
      imageUrls: [],
    },
    mode: "onSubmit",
  });

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: "imageUrls",
  });

  async function onSubmit(values: HotelInfo_FormOutput) {
    startTransition(async () => {
      await registerHotel(values);
      router.refresh(); // re-run proxy.
    });
  }

  const handleUploadSuccess = (result: any) => {
    const infos = Array.isArray(result.info) ? result.info : [result.info];
    infos.forEach((info: any) => {
      const url = info.secure_url ?? info.url;
      if (url) appendImage({ url });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Đăng ký làm đối tác lưu trú với chúng tôi
        </CardTitle>

        <CardDescription>
          Điền vào mẫu dưới đây để bắt đầu quá trình đăng ký và trở thành một phần của mạng lưới lưu trú của chúng tôi. Chúng tôi sẽ liên hệ với bạn sớm nhất có thể để hoàn tất thủ tục và hỗ trợ bạn trong việc thiết lập cơ sở lưu trú của mình trên nền tảng.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-y-6"
          noValidate
        >
          {form.formState.errors.root && (
            <div className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </div>
          )}

          <div className="grid gap-2">
            <Label>Tên cơ sở lưu trú</Label>
            <Input
              {...form.register("name")}
              className="mt-1"
              autoFocus
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Loại hình lưu trú</Label>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => field.onChange(val as HotelInfo_FormOutput["type"])}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOTEL">Hotel</SelectItem>
                    <SelectItem value="MOTEL">Motel</SelectItem>
                    <SelectItem value="RESORT">Resort</SelectItem>
                    <SelectItem value="APARTMENT">Apartment</SelectItem>
                    <SelectItem value="HOSTEL">Hostel</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-2">
            <Label>Địa chỉ</Label>
            <FormField
              control={form.control}
              name="wardId"
              render={({ field: { value, onChange, ...props } }) => (
                <LocationSelect wardId={value} onWardIdChange={(wardId) => onChange(wardId)} {...props} />
              )}
            />
            {form.formState.errors.wardId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.wardId.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex flex-col md:flex-row gap-x-4 gap-y-6 md:gap-y-0">
              <div className="grid gap-2">
                <Label>Kinh độ</Label>
                <Input
                  type="number"
                  step="any"
                  {...form.register("longitude")}
                  className="mt-1"
                />
              </div>
              <div className="grid gap-2">
                <Label>Vĩ độ</Label>
                <Input
                  type="number"
                  step="any"
                  {...form.register("latitude")}
                  className="mt-1"
                />
              </div>
            </div>
            {(form.formState.errors.latitude || form.formState.errors.longitude) && (
              <p className="text-sm text-destructive"> Toạ độ không hợp lệ. </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Mô tả (không bắt buộc)</Label>
            <Textarea {...form.register("description")} className="mt-1" rows={4} />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="grid gap-2">
              <Label>Thời gian nhận phòng</Label>
              <Input
                type="time"
                {...form.register("checkInTime")}
                className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
              {form.formState.errors.checkInTime && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.checkInTime.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Thời gian trả phòng</Label>
              <Input
                type="time"
                {...form.register("checkOutTime")}
                className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
              {form.formState.errors.checkOutTime && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.checkOutTime?.message}
                </p>
              )}
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col gap-2">
            <Label className="text-sm font-medium">Hình ảnh</Label>
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

          <Button type="submit" disabled={isPending} className="w-fit self-end">
            {isPending ? "Đang đăng ký..." : "Đăng ký"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}