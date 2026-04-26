import { user_getAvailableRoomTypeOfHotel } from "@/lib/actions/hotel";

import Image from "next/image";
import {
  ExternalLink,
  RulerDimensionLineIcon,
  BedDoubleIcon,
  DoorOpenIcon,
  UserIcon,
} from "lucide-react";
import { formatVND } from "@/lib/utils";
import { type UserGetAvailableRoomTypeOfHotelResult } from "@/lib/actions/hotel";
import { type SearchSpec } from "@/lib/zod_schemas/search-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PATHS } from "@/lib/constants";

export default async function AvailableRoomsSection({
  hotelName,
  roomTypes,
  searchSpecWithoutLocation
}: {
  hotelName: string;
  roomTypes: Awaited<ReturnType<typeof user_getAvailableRoomTypeOfHotel>>;
  searchSpecWithoutLocation: SearchSpec;
}) {
  const searchParams = new URLSearchParams(searchSpecWithoutLocation).toString();

  return (
    <section id="available_rooms" className="w-full flex flex-col">
      <div className="rounded-4xl px-4 py-5 flex flex-col gap-y-5 shadow-xl">
        <h2 className="font-bold text-[1.25rem]">Những phòng còn trống tại {hotelName}</h2>
        {roomTypes.length === 0 && (
          <div className="w-full h-48 flex items-center justify-center bg-muted rounded-lg">
            <span className="text-muted-foreground">Không có phòng nào còn trống thoả yêu cầu của bạn trong khoảng thời gian này</span>
          </div>
        )}
        {roomTypes.map(type => (
          <AvailableRoomTypeCard
            key={type.id}
            roomType={type}
            searchParams={searchParams}
          />
        ))}
      </div>
    </section>
  )
};

// TODO: On click room type card. -> not create a booking immediately, but just show a more detailed page and information form.
function AvailableRoomTypeCard({
  roomType,
  searchParams
}: {
  roomType: UserGetAvailableRoomTypeOfHotelResult[number];
  searchParams: string;
}) {
  const {
    imageUrls,
    name,
    facilities,
    areaM2,
    adultCapacity,
    childrenCapacity,
    price,
    bedType
  } = roomType;

  return (
    <div
      className="flex flex-col md:flex-row lg:flex-row bg-white rounded-xl p-4 shadow-md overflow-hidden bg-linear-to-b from-primary/15 to-transparent to-80%"
    >
      <div className="w-full md:w-2/5 lg:w-1/3 shrink-0">
        {imageUrls && imageUrls.length > 0
          ? <Image
            src={imageUrls[0]}
            alt={name}
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

      <div className="w-full md:w-3/5 lg:w-2/3 flex flex-col justify-between gap-y-4 mt-4 md:mt-0 md:ml-4 lg:ml-6">
        <header className="flex items-start justify-between gap-x-4">
          <div className="min-w-0">
            <h2 className="text-lg lg:text-xl font-bold line-clamp-2">
              {name}
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
            <span>{areaM2} m²</span>
          </div>

          <div className="flex items-center gap-x-2 text-sm">
            <BedDoubleIcon className="size-4" />
            <span className="lowercase first-letter:capitalize">Giường {bedType}</span>
          </div>

          <div className="flex items-center gap-x-2 text-sm">
            <UserIcon className="size-4" />
            <span>{adultCapacity} người lớn</span>
          </div>

          {childrenCapacity > 0 && (
            <div className="flex items-center gap-x-2 text-sm">
              <UserIcon className="size-4" />
              <span>{childrenCapacity} trẻ em</span>
            </div>
          )}
        </section>

        <section className="mt-3">
          <h3 className="text-sm font-semibold mb-2">Tiện nghi</h3>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
            {Array.isArray(facilities) ? (
              (facilities as { id: string; iconUrl?: string; name: string }[]).map((facility) => (
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

        <footer className="mt-4 flex items-center justify-end gap-x-4">
          <div className="text-primary inline-flex gap-x-1 items-baseline">
            <span className="text-base lg:text-lg font-extrabold" >
              {formatVND(price)}
            </span>
            <span className="text-sm text-muted-foreground">
              / phòng / đêm
            </span>
          </div>

          <Button
            // TODO: this should toast if user is not logged in.
            className="font-bold"
            aria-label={`Đặt phòng ${name} với giá ${price} VND`}
            asChild
          >
            <Link href={`${PATHS.bookings}/${roomType.id}?${searchParams}`}>
              Chọn
            </Link>
          </Button>
        </footer>
      </div>
    </div>
  );
}