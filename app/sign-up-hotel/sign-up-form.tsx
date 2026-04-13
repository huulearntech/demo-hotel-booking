"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { HotelType } from "@/lib/generated/prisma/enums";
import { FormField } from "@/components/ui/form";
import LocationSelect from "./location-select";

const formSchema = z.object({
  name:         z.string().trim().min(1, "Tên cơ sở lưu trú là bắt buộc."),
  wardId:       z.string().trim().min(1, "Địa chỉ là bắt buộc."),
  longitude:    z.string().trim().min(1, "bla").pipe(z.coerce.number()).refine((val) => val >= -180 && val <= 180),
  latitude:     z.string().trim().min(1, "bla").pipe(z.coerce.number()).refine((val) => val >= -90 && val <= 90),
  type:         z.enum(Object.values(HotelType)),
  description:  z.string().optional(),
  checkInTime:  z.iso.time({ precision: -1, error: "Check-in time must be a valid time." }),
  checkOutTime: z.iso.time({ precision: -1, error: "Check-out time must be a valid time." }),
  imageUrls:    z.object({ url: z.url() }).array().transform((arr) => arr.map((item) => item.url)),
});

type FormSchemaInput  = z.input<typeof formSchema>;
type FormSchemaOutput = z.output<typeof formSchema>;

export default function HotelSignUpForm({
  defaultValues,
  onSubmit = (data) => {
    console.log("Submitted data:", data);
  },
}: {
  defaultValues?: FormSchemaInput;
  onSubmit?: (data: FormSchemaOutput) => Promise<void> | void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormSchemaInput, unknown, FormSchemaOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? {
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

  async function handleSubmit(values: FormSchemaOutput) {
    startTransition(async () => {
      await onSubmit(values);
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6"
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
              onValueChange={(val) => field.onChange(val as FormSchemaOutput["type"])}
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
        {(form.formState.errors.latitude ||form.formState.errors.longitude)  && (
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

      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Create hotel"}
      </Button>
    </form>
  );
}