// BUG: Somehow there is a bug where user enter on blank "name" field,
// The page get redirected and be added "?name=". Have no idea.
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FacilityType } from "@/lib/generated/prisma/enums";
import { hotelowner_createCustomFacility } from "@/lib/actions/hotel-manager/facilities";
import { PlusIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { CACHE_TAGS } from "@/lib/constants";

export type FacilityCreateFormValues = {
  name: string;
  type: FacilityType;
};

export default function CreateFacilityDialog({
  roomTypeId
}: {
  roomTypeId?: string
}) {
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FacilityCreateFormValues>({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Tên tiện nghi không được để trống"),
        type: z.enum(FacilityType),
      })
    ),
    defaultValues: {
      name: "",
      type: FacilityType.HOTEL_SERVICES,
    },
  });

  const onSubmit = async (values: FacilityCreateFormValues) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await hotelowner_createCustomFacility(values.name, values.type, roomTypeId);
      if (!result.ok) {
        throw new Error(result.error || "Không thể tạo tiện nghi");
      }
      qc.invalidateQueries({ queryKey: [CACHE_TAGS.hotelowner_custom_facilities] });
      toast.success("Tạo tiện nghi thành công.");
      reset({ name: "", type: FacilityType.HOTEL_SERVICES });
      setOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <PlusIcon className="size-4" />
          Tạo tiện nghi mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo tiện nghi mới</DialogTitle>
        </DialogHeader>
        <form className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="facility-name">Tên tiện nghi</Label>
            <Input id="facility-name" {...register("name")} placeholder="Nhập tên tiện nghi" />
            {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="facility-type">Loại tiện nghi</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="facility-type" className="w-full">
                    <SelectValue placeholder="Chọn loại tiện nghi" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FacilityType).map((facilityType) => (
                      <SelectItem key={facilityType} value={facilityType}>
                        {facilityType.charAt(0) + facilityType.slice(1).toLowerCase().replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type ? <p className="text-sm text-destructive">{errors.type.message}</p> : null}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              disabled={isSaving}
              onClick={handleSubmit(onSubmit)}
            >
              {isSaving ? "Đang tạo..." : "Xác nhận"}
            </Button>
          </DialogFooter>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}
