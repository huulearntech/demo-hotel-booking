import { user_getAvailableRoomTypeOfHotel } from "@/lib/actions/hotel";

import Image from "next/image";
import {
  RulerDimensionLineIcon,
  BedDoubleIcon,
  UserIcon,
} from "lucide-react";
import { formatVND } from "@/lib/utils";
import { type UserGetAvailableRoomTypeOfHotelResult } from "@/lib/actions/hotel";
import { codec_SearchSpecWithoutLocation_Params, type SearchSpecWithoutLocation_Params } from "@/lib/zod_schemas/search-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PATHS } from "@/lib/constants";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Skeleton } from "@/components/ui/skeleton";

export default async function AvailableRoomsSection({
  hotelId,
  searchSpecWithoutLocation
}: {
  hotelId: string;
  searchSpecWithoutLocation: SearchSpecWithoutLocation_Params;
}) {
  const searchParams = new URLSearchParams(searchSpecWithoutLocation).toString();
  const session = await auth();


  const safeDecodedParams = codec_SearchSpecWithoutLocation_Params.safeParse(searchSpecWithoutLocation);
  if (!safeDecodedParams.success) return null;

  const {
    inOutDates: { from: checkInDate, to: checkOutDate },
    guestsAndRooms: { numAdults, numChildren, numRooms }
  } = safeDecodedParams.data;

  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { name: true }
  })

  if (!hotel) return null;

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
        <h2 className="font-bold text-[1.25rem]">Những phòng còn trống tại {hotel.name}</h2>
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
            userIsAuthenticated={!!session}
          />
        ))}
      </div>
    </section>
  )
};


function AvailableRoomTypeCard({
  roomType,
  searchParams,
  userIsAuthenticated
}: {
  roomType: UserGetAvailableRoomTypeOfHotelResult[number];
  searchParams: string;
  userIsAuthenticated: boolean;
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
    <div className="w-full h-fit flex flex-col md:flex-row
      gap-y-4 md:gap-y-0 md:gap-x-6
     bg-white rounded-xl p-4 shadow-md overflow-hidden
      bg-linear-to-b from-primary/15 to-transparent to-80%"
    >
      <div className="w-full md:w-2/5 lg:w-1/3 h-48 md:h-full shrink-0">
        {imageUrls && imageUrls.length > 0
          ? <Image
            src={imageUrls[0]}
            alt={name}
            width={400}
            height={300}
            className="w-full h-48 rounded-lg object-cover"
            loading="lazy"
          />
          : <div className="w-full h-48 sm:h-full bg-muted rounded-lg flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Không có hình ảnh cho phòng này</span>
          </div>
        }
      </div>

      <div className="w-full md:w-3/5 lg:w-2/3 flex flex-col justify-between gap-y-4
        [&>section]:flex [&>section]:flex-col [&>section]:gap-y-2 [&>section]:text-sm
        [&>section>ul]:grid [&>section>ul]:grid-cols-2 [&>section>ul]:sm:grid-cols-3 [&>section>ul]:md:grid-cols-3 [&>section>ul]:lg:grid-cols-4 [&>section>ul]:gap-3
        [&>section>ul>li]:flex [&>section>ul>li]:items-center [&>section>ul>li]:gap-x-2
        [&>section>h3]:font-semibold
      ">
        <header className="flex items-start justify-between gap-x-4">
          <h2 className="text-lg font-bold line-clamp-2"> {name} </h2>

          {/* <div className="flex items-center gap-x-2 text-sm text-primary font-bold">
            <ExternalLink className="size-4 shrink-0" aria-hidden />
            <span>Xem chi tiết phòng</span>
          </div> */}
        </header>

        <section>
          <h3>Thông tin chung</h3>
          <ul>
            <li>
              <RulerDimensionLineIcon className="size-4" />
              <span>{areaM2} m²</span>
            </li>

            <li>
              <BedDoubleIcon className="size-4" />
              <span className="lowercase first-letter:capitalize">Giường {bedType}</span>
            </li>

            <li>
              <UserIcon className="size-4" />
              <span>{adultCapacity} người lớn</span>
            </li>

            {childrenCapacity > 0 && (
              <li>
                <UserIcon className="size-4" />
                <span>{childrenCapacity} trẻ em</span>
              </li>
            )}
          </ul>
        </section>

        <section>
          <h3>Tiện nghi</h3>
          <ul>
            {Array.isArray(facilities) ? (
              (facilities as { id: string; iconUrl?: string; name: string }[])
                // .filter(f => f.iconUrl)
                .map((facility) => (
                  <li key={facility.id}>
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

        <footer className="flex flex-col sm:flex-row sm:items-center justify-end gap-x-4">
          <div className="text-primary inline-flex gap-x-1 items-baseline">
            <span className="text-base lg:text-lg font-extrabold" >
              {formatVND(price)}
            </span>
            <span className="text-sm text-muted-foreground">
              / phòng / đêm
            </span>
          </div>

          <Button
            className="font-bold"
            aria-label={`Đặt phòng ${name} với giá ${price} VND`}
            asChild
          >
            {userIsAuthenticated ?
              <Link href={`${PATHS.bookings}/${roomType.id}?${searchParams}`}>
                Chọn
              </Link>
              : <Link href={PATHS.signIn}>
                Đăng nhập để đặt phòng
              </Link>
            }
          </Button>
        </footer>
      </div>
    </div>
  );
}

export function AvailableRoomsSectionSkeleton() {
  return (
    <section id="available_rooms" className="w-full flex flex-col" aria-hidden="true">
      <div className="rounded-4xl px-4 py-5 flex flex-col gap-y-5 shadow-xl">
        <Skeleton className="h-8 w-72" />

        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="w-full h-fit flex flex-col md:flex-row gap-y-4 md:gap-y-0 md:gap-x-6 bg-white rounded-xl p-4 shadow-md overflow-hidden"
            >
              <Skeleton className="w-full md:w-2/5 lg:w-1/3 h-48 md:h-56 rounded-lg shrink-0" />

              <div className="w-full md:w-3/5 lg:w-2/3 flex flex-col justify-between gap-y-4">
                <header className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </header>

                <section className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, itemIndex) => (
                      <Skeleton key={itemIndex} className="h-4 w-full" />
                    ))}
                  </div>
                </section>

                <section className="space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, itemIndex) => (
                      <Skeleton key={itemIndex} className="h-4 w-full" />
                    ))}
                  </div>
                </section>

                <footer className="flex flex-col sm:flex-row sm:items-center justify-end gap-x-4 gap-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-10 w-28 rounded-md" />
                </footer>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}