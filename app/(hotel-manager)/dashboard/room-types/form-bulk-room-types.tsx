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
import CreateFacilityDialog from "./create-facility-dialog";


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

  async function onSubmitLocal(data: MultiRoomType_FormOutput) {
    startTransition(async () => {
      const result = await hotelowner_createManyRoomTypes(data);
      if (result.ok) {
        form.reset();
        toast.success("Tạo mới loại phòng thành công!");
        redirect(PATHS.hotelRoomTypes);
      } else {
        if (result.status === 409) {
          setError("root", { message: "Tên loại phòng phải là duy nhất trong khách sạn này." });
        } else {
          setError("root", { message: result.error || "Đã xảy ra lỗi khi tạo loại phòng." });
        }
      }
    });
  }

  return (
    <FormProvider {...form}>
      <form className="space-y-4">
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
                  facilities: [],
                  customFacilities: [],
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
              <Button
                type="submit"
                disabled={isPending}
                onClick={handleSubmit(onSubmitLocal)} 
              >
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
import { CloudUploadIcon, Loader2Icon, PlusIcon, SaveAllIcon, Trash2Icon, XIcon } from "lucide-react";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { FacilityType } from "@/lib/generated/prisma/enums";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
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
import { ComboboxFindCommonFacilities, ComboboxFindCustomFacilities } from "./combobox-find-common-facilities";
import { redirect } from "next/navigation";
import { PATHS } from "@/lib/constants";

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

  // inside RoomFields before return
  const {
    fields: facilityFields,
    append: appendFacility,
    remove: removeFacility,
  } = useFieldArray({
    control,
    name: `roomTypes.${index}.facilities` as const,
  });

  const {
    fields: customFacilityFields,
    append: appendCustomFacility,
    remove: removeCustomFacility,
  } = useFieldArray({
    control,
    name: `roomTypes.${index}.customFacilities` as const,
  });

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
          <Label htmlFor={`roomTypes.${index}.name`} className="text-sm font-semibold">
            Tên loại phòng
          </Label>
          <Input id={`roomTypes.${index}.name`} className="w-full" {...register(`roomTypes.${index}.name` as const)} />
          {roomErrors?.name && <p className="text-xs text-destructive mt-1">{roomErrors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={`roomTypes.${index}.price`} className="text-sm font-semibold">
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
          <Label htmlFor={`roomTypes.${index}.areaM2`} className="text-sm font-semibold">
            Diện tích (m²)
          </Label>
          <Input id={`roomTypes.${index}.areaM2`} type="number" className="w-full" {...register(`roomTypes.${index}.areaM2` as const)} />
          {roomErrors?.areaM2 && <p className="text-xs text-destructive mt-1">{roomErrors.areaM2.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={`roomTypes.${index}.adultCapacity`} className="text-sm font-semibold">
            Sức chứa người lớn
          </Label>
          <Input id={`roomTypes.${index}.adultCapacity`} type="number" className="w-full" {...register(`roomTypes.${index}.adultCapacity` as const)} />
          {roomErrors?.adultCapacity && <p className="text-xs text-destructive mt-1">{roomErrors.adultCapacity.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={`roomTypes.${index}.childrenCapacity`} className="text-sm font-semibold">
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
              <FormLabel className="text-sm font-semibold">Loại giường</FormLabel>
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

        <div className="md:col-span-2">
          {/* <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold">Tiện nghi</Label>
            <CreateFacilityDialog
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
          </div> */}


                {/* <div className="md:col-span-2"> */}
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold">Tiện nghi phổ biến</Label>
                    <ComboboxFindCommonFacilities
                      // roomTypeId={roomTypeId}
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
                              <TableCell>{facility.facility.name}</TableCell>
                              <TableCell>{
                                facility.facility.type.charAt(0) +
                                facility.facility.type.slice(1).toLowerCase().replace(/_/g, " ")
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

                {/* </div> */}


                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold">Tiện nghi của riêng khách sạn</Label>
                    <div className="flex gap-x-2 items-center">
                      {/* <ComboboxFindCommonFacilities roomTypeId={roomTypeId} /> */}
                      <ComboboxFindCustomFacilities
                        // roomTypeId={roomTypeId}
                        onItemSelect={(facility) => appendCustomFacility({ facility })}
                      />

                      <CreateFacilityDialog
                        // roomTypeId={roomTypeId}
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
                              <TableCell>{facility.facility.name}</TableCell>
                              <TableCell>{
                                facility.facility.type.charAt(0) +
                                facility.facility.type.slice(1).toLowerCase().replace(/_/g, " ")
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






            {/* {facilityFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có tiện nghi nào được thêm.</p>
          ) : (
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
                      <TableCell>{facility.facility.name ?? "Chưa đặt tên"}</TableCell>
                      <TableCell>
                        {facility.facility.type
                          .charAt(0)
                          .concat(facility.facility.type.slice(1).toLowerCase().replace(/_/g, " "))
                        }
                      </TableCell>
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
                              <AlertDialogTitle>
                                Xác nhận xoá tiện nghi "<strong>{facility.facility?.name}</strong>" ?
                              </AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => removeFacility(facilityIndex)}
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
          )} */}

          {/* <div className="flex flex-col gap-y-3">
            {facilityFields.map((facility, facilityIndex) => {
              const facilityError = roomErrors?.facilities?.[facilityIndex] as any;
              return (
                <div
                  key={facility.id}
                  className="w-full flex gap-3"
                >
                  <div className="w-full flex flex-col gap-1">
                    <Label
                      htmlFor={`roomTypes.${index}.facilities.${facilityIndex}.name`}
                      className="text-sm font-medium"
                    >
                      Tên tiện nghi
                    </Label>
                    <Input
                      id={`roomTypes.${index}.facilities.${facilityIndex}.name`}
                      className="w-full"
                      {...register(`roomTypes.${index}.facilities.${facilityIndex}.facility.name` as const)}
                    />
                    {facilityError?.name && (
                      <p className="text-xs text-destructive mt-1">
                        {facilityError.name.message}
                      </p>
                    )}
                  </div>

                  <FormField
                    control={control}
                    name={`roomTypes.${index}.facilities.${facilityIndex}.facility.type` as const}
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
          </div> */}

          {roomErrors?.facilities && typeof (roomErrors.facilities as any).message === "string" && (
            <p className="text-xs text-destructive mt-1">
              {(roomErrors.facilities as any).message}
            </p>
          )}
        </div>

        <div className="md:col-span-2 flex flex-col gap-1">
          <Label className="text-sm font-semibold">Mô tả</Label>
          <Textarea {...register(`roomTypes.${index}.description` as const)} rows={4} />
          {roomErrors?.description && <p className="text-xs text-destructive mt-1">{roomErrors?.description.message}</p>}
        </div>


        <div className="md:col-span-2 flex flex-col gap-2">
          <Label className="text-sm font-semibold">Hình ảnh</Label>

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