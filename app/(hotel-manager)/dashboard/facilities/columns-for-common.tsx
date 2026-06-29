"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hotelowner_disconnectCommonFacility } from "@/lib/actions/hotel-manager/facilities";
import { FacilityType } from "@/lib/generated/prisma/enums";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CACHE_TAGS } from "@/lib/constants";

export type FacilityRow = {
  id: string;
  name: string;
  type: FacilityType;
};

export const commonFacilityColumns: ColumnDef<FacilityRow>[] = [
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
    cell: ({ row }) => <CommonFacilityActionsRow facility={row.original} />,
  },
];

function CommonFacilityActionsRow({ facility }: { facility: FacilityRow }) {
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
          <DeleteCommonFacilityDialog facilityId={facility.id} facilityName={facility.name} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}


function DeleteCommonFacilityDialog({ facilityId, facilityName }: { facilityId: string, facilityName: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutateAsync, status } = useMutation({
    mutationFn: () => hotelowner_disconnectCommonFacility(facilityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHE_TAGS.hotelowner_common_facilities] });
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
