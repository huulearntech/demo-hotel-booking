"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { RoomFormValues, schema_Room } from "@/lib/zod_schemas/create-room";
import { hotelowner_createRoom } from "@/lib/actions/hotel-manager/rooms";
import { useQueryClient } from "@tanstack/react-query";

type RoomType = {
  id: string;
  name: string;
};



export function CreateRoomDialog({ roomTypes }: { roomTypes: RoomType[] }) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const defaultRoomTypeId = roomTypes[0]?.id ?? "";

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(schema_Room),
    defaultValues: {
      name: "",
      typeId: defaultRoomTypeId,
    },
  });

  useEffect(() => {
    reset({ name: "", typeId: roomTypes[0]?.id ?? "" });
  }, [roomTypes, reset]);

  const onSubmit = async (values: RoomFormValues) => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await hotelowner_createRoom(
        { name: values.name, typeId: values.typeId },
      );

      if (!result.ok) {
        throw new Error(result.error || "Failed to create room");
      }

      toast.success("Tạo phòng thành công.");
      queryClient.invalidateQueries({ queryKey: ["hotelowner_rooms"] });
      setOpen(false);
      reset({ name: "", typeId: roomTypes[0]?.id ?? "" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          reset({ name: "", typeId: roomTypes[0]?.id ?? "" });
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Tạo phòng
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo phòng mới</DialogTitle>
          <DialogDescription>
            Điền thông tin để tạo phòng mới cho khách sạn của bạn.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="room-name">Tên phòng</Label>
            <Input
              id="room-name"
              {...register("name")}
              placeholder="Nhập tên phòng"
            />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="room-type">Loại phòng</Label>
            <Controller
              control={control}
              name="typeId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  required
                >
                  <SelectTrigger id="room-type" className="w-full">
                    <SelectValue placeholder="Chọn loại phòng" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((roomType) => (
                      <SelectItem key={roomType.id} value={roomType.id}>
                        {roomType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.typeId ? (
              <p className="text-sm text-destructive">
                {errors.typeId.message}
              </p>
            ) : null}
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Đang tạo..." : "Tạo phòng"}
            </Button>
          </DialogFooter>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}