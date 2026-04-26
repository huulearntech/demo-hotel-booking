import { notFound } from "next/navigation";
import {
  hotelowner_getRoomTypeById,
  //  hotelowner_updateRoomById
} from "@/lib/actions/hotel-manager/rooms";

import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import RoomEditFormClient from "../room-edit-client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomTypeId } = await params;
  const result = await hotelowner_getRoomTypeById(roomTypeId);
  if (!result.ok) {
    if (result.status === 404) notFound();
    if (result.status === 403) return <p className="p-6 text-center text-destructive">You do not have permission to view this room.</p>;
    else return <p className="p-6 text-center text-destructive">An error occurred: {result.error}</p>;
  };
  const roomType = result.data;

  const priceNumber = roomType.price && typeof (roomType as any).price?.toNumber === "function"
    ? (roomType as any).price.toNumber()
    : Number((roomType as any).price ?? 0);

  const imageUrls = (roomType.imageUrls ?? []).map((u: any) =>
    typeof u === "string" ? { url: u } : u
  );

  const formValues = {
    name: roomType.name,
    price: priceNumber,
    adultCapacity: roomType.adultCapacity,
    childrenCapacity: roomType.childrenCapacity,
    areaM2: (roomType as any).areaM2 ?? 0,
    bedType: roomType.bedType,
    imageUrls: imageUrls,
    description: roomType.description ?? "",
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