import RoomsTable from "./rooms-table";
import { CreateRoomDialog } from "./create-room-dialog";
import { hotelowner_getRoomTypesNameAndId } from "@/lib/actions/hotel-manager/room-types";
export default async function RoomsPage() {
  const roomTypes = await hotelowner_getRoomTypesNameAndId();

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex justify-between">
        <header>
          <h1 className="font-semibold">Quản lý phòng khách sạn</h1>
          <p className="text-sm text-muted-foreground">
            Thêm, chỉnh sửa hoặc xoá phòng.
          </p>
        </header>

        <CreateRoomDialog roomTypes={roomTypes} />
      </div>

      <RoomsTable />
    </div>
  );
}