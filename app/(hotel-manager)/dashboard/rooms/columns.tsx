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
import { Prisma } from "@/lib/generated/prisma/client";

export function createColumns(handleDelete: (id: string) => void):
 ColumnDef<Prisma.RoomGetPayload<{
    include: {
      type: {
        select: {
          hotel: { select: { name: true } },
          name: true,
          adultCapacity: true,
          childrenCapacity: true,
          imageUrls: true,
          bedType: true,
          price: true,
        },
      },
    },
  }>>[] {
  return [
    {
      accessorKey: "name",
      header: "Tên phòng",
      cell: ({ row }) => row.original.name,
    },
    {
      accessorKey: "type",
      header: "Loại phòng",
      cell: ({ row }) => row.original.type ?? "—",
    },
    {
      accessorKey: "price",
      header: "Giá",
      cell: ({ row }) => row.original.type.price.toString() ?? "—",
    },
    {
      accessorKey: "adultCapacity",
      header: "Sức chứa người lớn",
      cell: ({ row }) => row.original.type.adultCapacity ?? "—",
    },
    {
      accessorKey: "childrenCapacity",
      header: "Sức chứa trẻ em",
      cell: ({ row }) => row.original.type.childrenCapacity ?? "—",
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
                    toast("Copied room ID to clipboard", { description: r.id });
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" /> Chép ID
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/rooms/${r.id}/edit`} className="flex items-center gap-2">
                    <Edit className="h-4 w-4" /> Sửa
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => handleDelete(r.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Xoá
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}