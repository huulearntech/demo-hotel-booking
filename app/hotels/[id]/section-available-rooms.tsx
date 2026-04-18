import { user_getAvailableRoomTypeOfHotel, } from "@/lib/actions/hotel";
import { SearchBar_FormOutput } from "@/lib/zod_schemas/search-bar";
import AvailableRoomTypeCard from "./available-room-type-card";

export default async function AvailableRoomsSection({
  hotelId,
  hotelName,
  searchBarFormData,
}: {
  hotelId: string;
  hotelName: string;
  searchBarFormData: SearchBar_FormOutput
}) {
  const { inOutDates: { from: checkInDate, to: checkOutDate }, guestsAndRooms: { numAdults, numChildren, numRooms } } = searchBarFormData;

  const roomTypes = await user_getAvailableRoomTypeOfHotel(
    hotelId,
    checkInDate,
    checkOutDate,
    numAdults,
    numChildren,
    numRooms
  );

  return (
    <section id="available_rooms" className="w-full flex flex-col">
      <div className="rounded-4xl px-4 py-5 flex flex-col gap-y-5 shadow-xl">
        <h2 className="font-bold text-[1.25rem]">Những phòng còn trống tại {hotelName}</h2>
        {roomTypes.length === 0 && (
          <div className="w-full h-48 flex items-center justify-center bg-muted rounded-lg">
            <span className="text-muted-foreground">Không có phòng nào còn trống thoả yêu cầu của bạn trong khoảng thời gian này</span>
          </div>
        )}
        {roomTypes.map((type) => <AvailableRoomTypeCard key={type.id} roomType={type} searchBarFormData={searchBarFormData}/>)}
      </div>
    </section>
  )
};