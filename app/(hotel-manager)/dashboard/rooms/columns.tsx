"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schema_Room, type RoomFormValues } from "@/lib/zod_schemas/create-room";
import { hotelowner_updateRoomById, hotelowner_deleteRoomById } from "@/lib/actions/hotel-manager/rooms";


import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Copy, Edit, MoreHorizontalIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hotelowner_getRoomTypesNameAndId } from "@/lib/actions/hotel-manager/room-types";


export const columns: ColumnDef<RoomRow>[] = [
  {
    accessorKey: "name",
    header: "Tên phòng",
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: "typeId",
    header: "Loại phòng",
    cell: ({ row }) => row.original.type.name,
  },
  {
    accessorKey: "actions",
    header: "Hành động",
    cell: ({ row }) => (
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" aria-label="Mở hành động">
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(row.original.id);
                toast("Đã chép ID vào bảng tạm");
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Chép ID
            </DropdownMenuItem>

            <EditRoomDialog room={row.original} />
            <DeleteRoomDialog roomId={row.original.id} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }
];

export type RoomRow = {
  id: string,
  name: string,
  typeId: string,
  type: { name: string },
}


function EditRoomDialog({ room }: { room: RoomRow }) {
  // NOTE: Why dont get roomTypes in here?
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: roomTypes = [], isLoading: isRoomTypesLoading } = useQuery({
    queryKey: ["hotelowner_roomTypes"],
    queryFn: async () => { return hotelowner_getRoomTypesNameAndId(); },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(schema_Room),
    defaultValues: {
      name: room.name,
      typeId: room.typeId,
    },
  });

  const onSubmit = async (values: RoomFormValues) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await hotelowner_updateRoomById(room.id, values);
      if (!result.ok) {
        throw new Error(result.error || "Failed to update room");
      }
      toast.success("Cập nhật phòng thành công.");
      queryClient.invalidateQueries({ queryKey: ["hotelowner_rooms"] });
      setIsOpen(false);
      reset(values);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        data-slot="dropdown-menu-item"
        className="w-full focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        <Edit className="mr-2 h-4 w-4" /> Sửa
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa phòng</DialogTitle>
          <DialogDescription>Cập nhật tên phòng hoặc loại phòng.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="room-name">Tên phòng</Label>
            <Input id="room-name" {...register("name")} placeholder="Nhập tên phòng" />
            {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="room-type">Loại phòng</Label>
            <Controller
              control={control}
              name="typeId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} required>
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
            {errors.typeId ? <p className="text-sm text-destructive">{errors.typeId.message}</p> : null}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter className="mt-4">
            <Button type="button" disabled={isSaving} onClick={handleSubmit(onSubmit)}>
              {isSaving ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteRoomDialog({ roomId }: { roomId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const {
    mutateAsync: deleteRoom,
    status,
  } = useMutation({
    mutationFn: () => hotelowner_deleteRoomById(roomId),
    onSuccess: () => {
      toast.success("Xoá phòng thành công.");
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["hotelowner_rooms"] });
    },
    onError: () => {
      toast.error("Xoá phòng thất bại. Vui lòng thử lại.");
      setIsOpen(false);
    },
  });

  const handleConfirm = async () => {
    await deleteRoom();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger
        data-variant="destructive"
        data-slot="dropdown-menu-item"
        className="w-full focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        <Trash2 className="text-destructive mr-2 h-4 w-4" /> Xoá
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xoá phòng</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xoá phòng này? Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={status === "pending"}>
            Xác nhận
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}