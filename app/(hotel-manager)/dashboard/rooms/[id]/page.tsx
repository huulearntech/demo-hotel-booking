import { notFound } from "next/navigation";
import { hotelowner_getRoomTypeById } from "@/lib/actions/hotel-manager/rooms";
import RoomEditSingle from "./room-edit-single.client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomTypeId } = await params;
  const result = await hotelowner_getRoomTypeById(roomTypeId);
  if (!result.ok) {
    if (result.status === 404) notFound();
    if (result.status === 403) return <p className="p-6 text-center text-destructive">You do not have permission to view this room.</p>;
    else return <p className="p-6 text-center text-destructive">An error occurred: {result.error}</p>;
  };


  // TODO: Cleanup
  const roomType = result.data;
  const clientDefaults = {
    name: roomType.name,
    price: roomType.price.toNumber(),
    areaM2: roomType.areaM2,
    adultCapacity: roomType.adultCapacity,
    childrenCapacity: roomType.childrenCapacity,
    bedType: roomType.bedType,
    description: roomType.description ?? "",
    imageUrls: roomType.imageUrls.map(url => ({ url })),
  };

  return (
    <RoomEditSingle roomTypeId={roomTypeId} defaultValues={clientDefaults} />
  );
}