import RoomEditSingle from "./room-edit-single.client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomTypeId } = await params;

  return (
    <RoomEditSingle roomTypeId={roomTypeId} />
  );
}