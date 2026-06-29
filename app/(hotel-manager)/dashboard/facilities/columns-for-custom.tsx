"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Copy, Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hotelowner_deleteCustomFacility, hotelowner_updateCustomFacility } from "@/lib/actions/hotel-manager/facilities";
import { FacilityType } from "@/lib/generated/prisma/enums";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { CACHE_TAGS } from "@/lib/constants";

export type FacilityRow = {
  id: string;
  name: string;
  type: FacilityType;
};

const customFacilityFormSchema = z.object({
  name: z.string().min(1, "Tên tiện nghi không được để trống"),
  type: z.enum(FacilityType),
});

type CustomFacilityFormValues = z.infer<typeof customFacilityFormSchema>;

export const customFacilityColumns: ColumnDef<FacilityRow>[] = [
  {
    accessorKey: "name",
    header: "Tên tiện nghi",
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: "type",
    header: "Loại tiện nghi",
    cell: ({ row }) => row.original.type.charAt(0) + row.original.type.slice(1).toLowerCase().replace(/_/g, " ")
  },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => <CustomFacilityActionsRow facility={row.original} />,
  },
];

function CustomFacilityActionsRow({ facility }: { facility: FacilityRow }) {
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(facility.id);
              toast.success("Đã chép ID vào clipboard");
            }}
          >
            <Copy className="mr-2 h-4 w-4" /> Sao chép ID
          </DropdownMenuItem>
          <EditCustomFacilityDialog facility={facility} />
          <DeleteCustomFacilityDialog facilityId={facility.id} facilityName={facility.name} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function EditCustomFacilityDialog({ facility }: { facility: FacilityRow }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomFacilityFormValues>({
    resolver: zodResolver(customFacilityFormSchema),
    defaultValues: {
      name: facility.name,
      type: facility.type,
    },
  });

  const { mutateAsync, status } = useMutation({
    mutationFn: (values: CustomFacilityFormValues) => hotelowner_updateCustomFacility(facility.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHE_TAGS.hotelowner_common_facilities] });
      setOpen(false);
      toast.success("Cập nhật tiện nghi thành công.");
    },
    onError: () => {
      setError("Cập nhật tiện nghi thất bại.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (value) reset({ name: facility.name, type: facility.type }); }}>
      <DialogTrigger
        data-slot="dropdown-menu-item"
        className="w-full focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        <Edit className="mr-2 h-4 w-4" /> Sửa
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa tiện nghi</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(async (values) => await mutateAsync(values))} className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="facility-edit-name">Tên tiện nghi</Label>
            <Input id="facility-edit-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="facility-edit-type">Loại tiện nghi</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="facility-edit-type" className="w-full">
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
            {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={status === "pending"}>
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCustomFacilityDialog({ facilityId, facilityName }: { facilityId: string, facilityName: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutateAsync, status } = useMutation({
    mutationFn: () => hotelowner_deleteCustomFacility(facilityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHE_TAGS.hotelowner_custom_facilities] });
      setOpen(false);
      toast.success("Xoá tiện nghi thành công.");
    },
    onError: () => {
      toast.error("Xoá tiện nghi thất bại. Vui lòng thử lại.");
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        data-variant="destructive"
        data-slot="dropdown-menu-item"
        className="w-full focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        <Trash2 className="mr-2 h-4 w-4" /> Xoá
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xoá tiện nghi "<strong>{facilityName}</strong>" ?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction disabled={status === "pending"} onClick={async () => await mutateAsync()}>
            Xác nhận
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
