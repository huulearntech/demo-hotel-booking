"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Copy, Edit, Ellipsis, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BedType } from "@/lib/generated/prisma/browser";
import { PATHS } from "@/lib/constants";

export function createColumns(handleDelete: (id: string) => void):
  ColumnDef<{
    id: string,
    name: string,
    adultCapacity: number,
    childrenCapacity: number,
    imageUrls: string[],
    bedType: BedType,
    price: number,
    createdAt: Date,
  }>[] {
  return [
    {
      accessorKey: "name",
      header: "Tên loại phòng",
      cell: ({ row }) => row.original.name,
    },
    {
      accessorKey: "price",
      header: "Giá",
      cell: ({ row }) => new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(row.original.price),
    },
    {
      accessorKey: "adultCapacity",
      header: "Sức chứa người lớn",
      cell: ({ row }) => row.original.adultCapacity,
    },
    {
      accessorKey: "childrenCapacity",
      header: "Sức chứa trẻ em",
      cell: ({ row }) => row.original.childrenCapacity,
    },
    {
      accessorKey: "bedType",
      header: "Loại giường",
      cell: ({ row }) => row.original.bedType,
    },
    {
      accessorKey: "createdAt",
      header: "Được tạo vào",
      cell: ({ row }) =>
        Intl.DateTimeFormat("vi-VN", {
          day: "numeric",
          month: "numeric",
          year: "numeric",
        }).format(row.original.createdAt),
    },
    {
      id: "actions",
      header: "Hành động",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" aria-label="Mở hành động">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(r.id);
                    toast("Đã chép ID vào bảng tạm", { description: r.id });
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" /> Chép ID
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href={`${PATHS.hotelRoomTypes}/${r.id}/edit`} className="flex items-center gap-2">
                    <Edit className="h-4 w-4" /> Sửa
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => handleDelete(r.id)}
                  className="text-destructive"
                >
                  <Trash2 className="text-destructive mr-2 h-4 w-4" /> Xoá
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}