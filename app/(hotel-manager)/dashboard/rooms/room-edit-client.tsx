// FIXME: Fix this AI generated shit.
"use client";

import { useForm, FormProvider } from "react-hook-form";
import { RoomFields } from "./form-bulk-room-types";
import { Button } from "@/components/ui/button";

type BedType = "SINGLE" | "DOUBLE" | "QUEEN" | "KING" | "TWIN";

type RoomType = {
  name: string;
  adultCapacity: number;
  childrenCapacity: number;
  areaM2: number;
  bedType: BedType;
  price: number;
  imageUrls: { url: string }[];
  roomsName?: { name: string }[];
  description: string | null;
};

type FormValues = {
  // keep same shape as before but with a single element in the array
  roomTypes: RoomType[];
};

export default function RoomEditFormClient({ defaultValues }: { defaultValues: RoomType }) {
  const form = useForm<FormValues>({
    // wrap the single room in an array so existing RoomFields that expect roomTypes[index] keep working
    defaultValues: { roomTypes: [defaultValues] },
    mode: "onChange",
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit((data) => {
        console.log("Submitting single-room edit form:", data);
      })}>
        <RoomFields
          index={0}
          // TODO: fix any
          control={form.control as any}
          register={form.register as any}
          errors={form.formState.errors as any}
          // no-op remove since there's only one room here
          removeRoom={() => { }}
        />

        <div className="flex items-center gap-2 mt-4">
          <Button type="submit">Lưu thay đổi</Button>
          <Button variant="outline" type="button">Hủy</Button>
        </div>
      </form>
    </FormProvider>
  );
}
