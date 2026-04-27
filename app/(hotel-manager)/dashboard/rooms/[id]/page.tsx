import { notFound } from "next/navigation";
import {
  hotelowner_getRoomTypeById,
  //  hotelowner_updateRoomById
} from "@/lib/actions/hotel-manager/rooms";

import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import RoomEditFormClient from "../room-edit-client";

// TODO: repeated. Cleanup. Fix there is no roomsname
import type { BedType } from "@/lib/generated/prisma/enums";
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

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomTypeId } = await params;
  const result = await hotelowner_getRoomTypeById(roomTypeId);
  if (!result.ok) {
    if (result.status === 404) notFound();
    if (result.status === 403) return <p className="p-6 text-center text-destructive">You do not have permission to view this room.</p>;
    else return <p className="p-6 text-center text-destructive">An error occurred: {result.error}</p>;
  };
  const roomType = result.data;


  const formValues: RoomType = {
    ...roomType,
    price: roomType.price.toNumber(),
    imageUrls: roomType.imageUrls.map(url => ({ url })),
  };


  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{roomType.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{roomType.hotel.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Edit className="size-4" />
            Chỉnh sửa
          </Button>
          <Button size="sm" variant="destructive" className="flex items-center gap-2">
            <Trash className="size-4" />
            Xóa
          </Button>
        </div>
      </header>

      <RoomEditFormClient defaultValues={formValues} />
    </div>
  );
}