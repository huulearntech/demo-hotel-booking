import Image from "next/image";

import {
  ExternalLink,
  RulerDimensionLineIcon,
  BedDoubleIcon,
  DoorOpenIcon,
  UserIcon,
} from "lucide-react";

import { PATHS } from "@/lib/constants";
import { formatVND } from "@/lib/utils";

import { user_getAvailableRoomTypeOfHotel, type UserGetAvailableRoomTypeOfHotelResult } from "@/lib/actions/hotel";
import { SearchBar_FormInput } from "@/lib/zod_schemas/search-bar.draft";

export default async function AvailableRoomsSection({
  hotelId,
  hotelName,
  searchBarFormData,
}: {
  hotelId: string;
  hotelName: string;
  searchBarFormData: SearchBar_FormInput
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
            <span className="text-sm text-muted-foreground">Không có phòng nào còn trống cho khoảng thời gian này</span>
          </div>
        )}
        {roomTypes.map((type) => <RoomTypeCard key={type.id} roomType={type} />)}
      </div>
    </section>
  )
};

function RoomTypeCard({ roomType }: { roomType: UserGetAvailableRoomTypeOfHotelResult[number] }) {
  const { imageUrls } = roomType;
  return (
    <div
      className="flex flex-col md:flex-row lg:flex-row bg-white rounded-xl p-4 shadow-md overflow-hidden"
      style={{
        backgroundImage: "url('/images/bg-room-card.svg')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right top",
        backgroundSize: "220px"
      }}
    >
      {/* Image column */}
      <div className="w-full md:w-2/5 lg:w-1/3 shrink-0">
        {imageUrls && imageUrls.length > 0
          ? <Image
            src={imageUrls[0]}
            alt={roomType.name}
            width={400}
            height={300}
            className="w-full h-64 lg:h-full rounded-lg object-cover"
            loading="lazy"
          />
          : <div className="w-full h-64 lg:h-full bg-muted rounded-lg flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Không có hình ảnh cho phòng này</span>
          </div>
        }
      </div>

      {/* Details column */}
      <div className="w-full md:w-3/5 lg:w-2/3 flex flex-col justify-between gap-y-4 mt-4 md:mt-0 md:ml-4 lg:ml-6">
        <header className="flex items-start justify-between gap-x-4">
          <div className="min-w-0">
            <h2 className="text-lg lg:text-xl font-bold line-clamp-2">
              {roomType.name}
            </h2>
          </div>

          <div className="flex items-center gap-x-2 text-sm text-primary font-bold">
            <ExternalLink className="size-4 shrink-0" aria-hidden />
            <span>Xem chi tiết phòng</span>
          </div>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
          <div className="flex items-center gap-x-2 text-sm">
            <RulerDimensionLineIcon className="size-4" />
            <span>{roomType.areaM2} m²</span>
          </div>

          <div className="flex items-center gap-x-2 text-sm">
            <DoorOpenIcon className="size-4" />
            <span>1 phòng</span>
          </div>

          <div className="flex items-center gap-x-2 text-sm">
            <UserIcon className="size-4" />
            <span>{roomType.adultCapacity} người lớn</span>
          </div>

          {roomType.childrenCapacity > 0 && (
            <div className="flex items-center gap-x-2 text-sm">
              <UserIcon className="size-4" />
              <span>{roomType.childrenCapacity} trẻ em</span>
            </div>
          )}
        </section>

        <section className="mt-3">
          <h3 className="text-sm font-semibold mb-2">Tiện nghi</h3>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
            <li className="flex items-center gap-x-2 text-sm">
              <BedDoubleIcon className="size-4" />
              <span className="lowercase first-letter:capitalize">Giường {roomType.bedType}</span>
            </li>
            {Array.isArray(roomType.facilities) ? (
              (roomType.facilities as { id: string; iconUrl?: string; name: string }[]).map((facility) => (
              <li
                key={facility.id}
                className="flex items-center gap-x-2 text-sm"
              >
                {facility.iconUrl ? (
                  <Image
                    src={facility.iconUrl}
                    alt={facility.name}
                    width={16}
                    height={16}
                    className="object-contain"
                  />
                ) : null}
                <span>{facility.name}</span>
              </li>
              ))
            ) : null}
          </ul>
        </section>

        <footer className="mt-4 flex items-center justify-between">
          <div className="text-base lg:text-lg font-extrabold text-orange-600">
            {formatVND(roomType.price.toNumber())}
          </div>

          <div>
            <a
            // TODO: link to booking page (onclick must handle create booking metadata)
              href={PATHS.bookings + "/1"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center bg-primary text-white text-sm font-bold px-4 py-2 rounded-md"
              aria-label={`Đặt phòng ${roomType.name} với giá ${roomType.price.toNumber()} VND`}
            >
              Chọn
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}