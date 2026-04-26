import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import RoomsGrid from "./rooms-grid";
export default async function RoomsPage() {
  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Quản lý phòng khách sạn</h1>
          <p className="text-sm text-muted-foreground">
            Xem, chỉnh sửa hoặc xoá phân loại phòng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/rooms/new">
            <Button variant="default" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Thêm loại phòng mới
            </Button>
          </Link>
        </div>
      </div>

      <RoomsGrid />
    </div>
  );
}