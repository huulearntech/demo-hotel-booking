"use client";

import { Fragment, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudUploadIcon, Loader2Icon, RotateCcwIcon, SaveIcon, Trash2Icon, XIcon } from "lucide-react";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";
import { schema_RoomType, type RoomType_FormInput, type RoomType_FormOutput } from "@/lib/zod_schemas/create-room";
import { hotelowner_deleteRoomTypeById, hotelowner_getRoomTypeById, hotelowner_updateRoomTypeById } from "@/lib/actions/hotel-manager/room-types";
import { toast } from "sonner";
import CreateFacilityDialog from "../create-facility-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ComboboxFindCommonFacilities, ComboboxFindCustomFacilities } from "./combobox-find-common-facilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CACHE_TAGS, PATHS } from "@/lib/constants";
import Link from "next/link";
import { redirect } from "next/navigation";


export default function RoomEditSingle({ roomTypeId }: { roomTypeId: string }) {

  const {
    data: roomType,
    // isLoading,
    // isError,
    // error,
  } = useQuery({
    queryKey: [CACHE_TAGS.hotelowner_custom_facilities_of_room_type],
    queryFn: async () => { return await hotelowner_getRoomTypeById(roomTypeId) },
    select: (res) => {
      if (!res?.ok) throw new Error(res?.error ?? "Failed to load revenue data");
      return res.data
    },
  });

  // if (!roomType) notFound();

  const [isPending, startTransition] = useTransition();

  const form = useForm<RoomType_FormInput, unknown, RoomType_FormOutput>({
    resolver: zodResolver(schema_RoomType),
    mode: "onChange",
    values: roomType
  });

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isLoading },
  } = form;

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: "imageUrls",
  });

  const {
    fields: facilityFields,
    append: appendFacility,
    remove: removeFacility,
  } = useFieldArray({
    control,
    name: "facilities",
  });

  const {
    fields: customFacilityFields,
    append: appendCustomFacility,
    remove: removeCustomFacility,
  } = useFieldArray({
    control,
    name: "customFacilities",
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
    <div className="flex flex-col gap-y-6">
      <FormProvider {...form}>
        <form className="flex flex-col gap-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chỉnh sửa loại phòng</CardTitle>
              <CardDescription>Điền thông tin cơ bản cho loại phòng này.</CardDescription>
              <CardAction className="flex gap-x-4">
                <Button
                  disabled={isPending}
                  asChild
                  variant="outline"
                >
                  <Link href={PATHS.hotelRoomTypes}>
                    <RotateCcwIcon className="size-4" />
                    Huỷ
                  </Link>
                </Button>

                <Button
                  type="button"
                  disabled={isPending}
                  onClick={handleSubmit(onSubmit)}
                >
                  <SaveIcon className="size-4" />
                  Lưu thay đổi
                </Button>
              </CardAction>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ?
                <div className="w-full h-full">
                  <Loader2Icon className="animate-spin size-4 mr-2" />
                  <span> Đang tải... </span>
                </div>
                :
                <Fragment>
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
                      <Label className="text-sm font-semibold">Tiện nghi phổ biến</Label>
                      <ComboboxFindCommonFacilities
                        roomTypeId={roomTypeId}
                        onItemSelect={facility => appendFacility({ facility })}
                      />
                    </div>

                    {facilityFields.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có tiện nghi nào được thêm.</p> :
                      <div className="overflow-hidden rounded-md border">
                        <Table>
                          <TableHeader className="bg-muted">
                            <TableRow>
                              <TableHead>Tên tiện nghi</TableHead>
                              <TableHead>Loại tiện nghi</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {facilityFields.map((facility, facilityIndex) => (
                              <TableRow key={facility.id}>
                                <TableCell>{facility.facility.name ?? form.getValues(`facilities.${facilityIndex}.facility.name`)}</TableCell>
                                <TableCell>{
                                  form.getValues(`facilities.${facilityIndex}.facility.type`).charAt(0) +
                                  form.getValues(`facilities.${facilityIndex}.facility.type`).slice(1).toLowerCase().replace(/_/g, " ")
                                }</TableCell>
                                <TableCell>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button type="button" variant="outline" size="sm">
                                        <Trash2Icon className="size-4" />
                                        Xoá
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Xác nhận xoá tiện nghi "<strong>{facility.facility.name}</strong>" ?</AlertDialogTitle>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                                        <AlertDialogAction
                                          variant="destructive"
                                          onClick={() => {
                                            removeFacility(facilityIndex);
                                          }}
                                        >
                                          Xác nhận
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    }

                  </div>


                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold">Tiện nghi của riêng khách sạn</Label>
                      <div className="flex gap-x-2 items-center">
                        {/* <ComboboxFindCommonFacilities roomTypeId={roomTypeId} /> */}
                        <ComboboxFindCustomFacilities
                          roomTypeId={roomTypeId}
                          onItemSelect={(facility) => appendCustomFacility({ facility })}
                        />

                        <CreateFacilityDialog
                          roomTypeId={roomTypeId}
                          onCreate={(facility) => {
                            appendCustomFacility({
                              facility: {
                                id: facility.id,
                                name: facility.name,
                                type: facility.type,
                              },
                            });
                          }}
                        />
                      </div>
                    </div>

                    {customFacilityFields.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có tiện nghi nào được thêm.</p> :
                      <div className="overflow-hidden rounded-md border">
                        <Table>
                          <TableHeader className="bg-muted">
                            <TableRow>
                              <TableHead>Tên tiện nghi</TableHead>
                              <TableHead>Loại tiện nghi</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customFacilityFields.map((facility, facilityIndex) => (
                              <TableRow key={facility.id}>
                                <TableCell>{facility.facility.name ?? form.getValues(`customFacilities.${facilityIndex}.facility.name`)}</TableCell>
                                <TableCell>{
                                  form.getValues(`customFacilities.${facilityIndex}.facility.type`).charAt(0) +
                                  form.getValues(`customFacilities.${facilityIndex}.facility.type`).slice(1).toLowerCase().replace(/_/g, " ")
                                }</TableCell>
                                <TableCell>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button type="button" variant="outline" size="sm">
                                        <Trash2Icon className="size-4" />
                                        Xoá
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Xác nhận xoá tiện nghi "<strong>{facility.facility.name}</strong>" ?</AlertDialogTitle>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                                        <AlertDialogAction
                                          variant="destructive"
                                          onClick={() => {
                                            removeCustomFacility(facilityIndex);
                                          }}
                                        >
                                          Xác nhận
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    }

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
                </Fragment>
              }
            </CardContent>
          </Card>
        </form>
      </FormProvider>

      <div className="w-full flex items-center gap-x-6">
        <span className="text-sm font-semibold">Xoá loại phòng</span>
        <DeleteRoomDialog roomTypeId={roomTypeId} roomTypeName={roomType?.name ?? ""} />
      </div>
    </div>
  );
}

function DeleteRoomDialog({ roomTypeId, roomTypeName } : { roomTypeId: string, roomTypeName: string }) {
  const [pending, setPending] = useState(false);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        data-variant="destructive"
        data-slot="dropdown-menu-item"
        className="border border-destructive focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        <Trash2Icon className="h-4 w-4" /> Xoá
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xoá loại phòng "<strong>{roomTypeName}</strong>" ?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={async () => {
              const result = await hotelowner_deleteRoomTypeById(roomTypeId);
              if (result.ok) {
                setPending(false);
                toast.success("Xoá loại phòng thành công.");
                redirect(PATHS.hotelRoomTypes);
              } else {
                setPending(false);
                toast.error("Xoá loại phòng thất bại. Vui lòng thử lại.");
              }
            }}
            variant="destructive"
          >
            Xác nhận
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}