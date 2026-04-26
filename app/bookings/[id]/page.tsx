import Image from "next/image";
import { notFound } from "next/navigation";
import { differenceInDays } from "date-fns";
import { auth } from "@/auth";

import prisma from "@/lib/prisma";
import { MAX_REVIEW_POINTS } from "@/lib/constants";

import InformationForm from "./information-form";
import { InformationFormProvider } from "./information-form-context";
import PriceDetail from "./price-details";

import {
  ArrowRight,
  BedDouble,
  DoorOpen,
} from "lucide-react";
import { tvlk_logo_text_dark } from "@/public/logos"
import { BedType } from "@/lib/generated/prisma/client";
import { schema_searchSpec, SearchSpec } from "@/lib/zod_schemas/search-bar";

const getHHMMFromDate = (date: Date) => {
  console.log(date);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export default async function BookingPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchSpec>;
}) {
  const session = await auth();
  if (!session || !session.user) notFound(); // already handled by proxy.
  const { email, name } = session.user;
  
  const { id } = await params;
  const awaitedSearchParams = await searchParams;
  const candidates = {
    inOutDates: {
      from: new Date(awaitedSearchParams.checkInDate.concat("T00:00:00Z")), // Ensure it's treated as UTC to avoid timezone issues
      to: new Date(awaitedSearchParams.checkOutDate.concat("T00:00:00Z")),
    },
    guestsAndRooms: {
      numAdults: Number(awaitedSearchParams.numAdults),
      numChildren: Number(awaitedSearchParams.numChildren),
      numRooms: Number(awaitedSearchParams.numRooms),
    },
  }
  const searchSpec = schema_searchSpec.safeParse(candidates);
  if (!searchSpec.success) notFound();


  const roomType = await prisma.roomType.findUnique({
    where: { id },
    select: {
      hotel: {
        select: {
          name: true,
          type: true,
          rating: true,
          numberOfReviews: true,
          checkInTime: true,
          checkOutTime: true,
        }
      },
      facilities: {
        select: {
          id: true,
          name: true,
          iconUrl: true,
        }
      },
      name: true,
      price: true,
      adultCapacity: true,
      childrenCapacity: true,
      bedType: true,
    },
  });

  if (!roomType) notFound();
  const { hotel } = roomType;

  const nights = differenceInDays(searchSpec.data.inOutDates.to, searchSpec.data.inOutDates.from);

  return (
    <InformationFormProvider defaultValues={{ name: name || "", email: email || "" }} >
      <header className="w-full h-20 z-60 bg-white shadow-md sticky top-0">
        <div className="flex h-full justify-between items-center content">
          <div className="flex items-center">
            <Image src={tvlk_logo_text_dark} alt="" />
            <div className="h-10 w-px bg-gray-200 mx-3"></div>
            <div className="flex flex-col gap-y-1 p-4">
              <div className="flex items-center gap-x-2">
                <span className="text-base text-black font-semibold"> {hotel.name} </span>
                <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-primary lowercase first-letter:capitalize">
                  {hotel.type}
                </span>
              </div>
              <div className="flex items-center gap-x-2 text-xs">
                <span className="text-primary font-black">{hotel.rating.toFixed(1) + " / " + MAX_REVIEW_POINTS}</span>
                <span className="text-gray-500 font-semibold">({hotel.numberOfReviews} đánh giá)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-16">
            <Stepper step={1} />
          </div>
        </div>
      </header>

      <div className="bg-[url('/images/bg-booking-page.webp')] bg-no-repeat bg-bottom">
        <main className="content grid gap-6 pt-6 grid-cols-1 lg:grid-cols-[1fr_25rem] lg:items-start">
          <div className="order-2 lg:col-start-2 lg:row-start-1">
            <BookingSummary
              numRooms={searchSpec.data.guestsAndRooms.numRooms}
              numAdults={searchSpec.data.guestsAndRooms.numAdults}
              numChildren={searchSpec.data.guestsAndRooms.numChildren}
              checkInDate={searchSpec.data.inOutDates.from}
              checkOutDate={searchSpec.data.inOutDates.to}

              checkInTime={roomType.hotel.checkInTime}
              checkOutTime={roomType.hotel.checkOutTime}
              roomTypeName={roomType.name}
              facilities={roomType.facilities}
              bedType={roomType.bedType}
            />
          </div>

          <div className="order-3 row-span-3 lg:col-start-1 min-w-100">
            <InformationForm />
          </div>
          <div className="order-4 lg:col-start-2 lg:row-start-2">
            <PriceDetail
              roomTypeId={id}
              checkInDate={searchSpec.data.inOutDates.from}
              checkOutDate={searchSpec.data.inOutDates.to}
              numAdults={searchSpec.data.guestsAndRooms.numAdults}
              numChildren={searchSpec.data.guestsAndRooms.numChildren}
              numRooms={searchSpec.data.guestsAndRooms.numRooms}
              snapshotRoomTypeName={roomType.name}
              snapshotRoomPrice={roomType.price.toNumber()}
              nights={nights}
              totalPrice={roomType.price.mul(searchSpec.data.guestsAndRooms.numRooms).mul(nights).toNumber()}
            />
          </div>
        </main>
      </div>
    </InformationFormProvider>
  )
};

async function BookingSummary({
  numRooms,
  numAdults,
  numChildren,
  checkInTime,
  checkOutTime,
  roomTypeName,
  checkInDate,
  checkOutDate,
  facilities,
  bedType,
}: {
  numRooms: number;
  numAdults: number;
  numChildren: number;
  checkInTime: Date;
  checkOutTime: Date;
  roomTypeName: string;
  checkInDate: Date;
  checkOutDate: Date;
  facilities: { id: string, name: string, iconUrl: string | null }[],
  bedType: BedType,
}) {
  return (
    <div className="flex flex-col rounded-4xl bg-white shadow-lg p-4 gap-y-2">
      <div className="flex flex-col gap-y-1">
        <h2 className="text-[1.25rem] font-semibold">({numRooms}x) {roomTypeName}</h2>
      </div>

      <div className="flex bg-blue-50 rounded-[10px] p-1 gap-x-1">
        <div className="flex flex-col p-2 gap-y-1 flex-1">
          <div className="text-xs">Nhận phòng</div>
          <div className="text-sm font-bold">
            {new Intl.DateTimeFormat('vi-VN', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }).format(checkInDate)}
          </div>
          <div className="text-xs">
            Từ {getHHMMFromDate(checkInTime)}
          </div>
        </div>

        <div className="flex flex-col justify-center items-center min-w-fit">
          <span className="text-xs font-semibold">{differenceInDays(checkOutDate, checkInDate)} đêm</span>
          <ArrowRight className="size-4" />
        </div>

        <div className="flex flex-col p-2 gap-y-1 flex-1">
          <div className="text-xs">Trả phòng</div>
          <div className="text-sm font-bold">
            {new Intl.DateTimeFormat('vi-VN', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }).format(checkOutDate)}
          </div>
          <div className="text-xs">
            Trước {getHHMMFromDate(checkOutTime)}
          </div>
        </div>
      </div>

      <div className="flex gap-x-2 items-center">
        <DoorOpen className="size-4" />
        <div className="text-sm font-semibold">
          <span>{numAdults} người lớn</span>
          {numChildren > 0 && <span>, {numChildren} trẻ em</span>}
        </div>
        <div className="w-px bg-gray-500 h-3 mx-1" />
        <div className="flex items-center gap-x-1">
          <BedDouble className="size-4" />
          <span className="text-sm font-semibold lowercase first-letter:capitalize">Giuờng {bedType}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-2 text-sm text-gray-500">
        {facilities
          .filter((facility) => facility.iconUrl)
          .map(facility => (
        <div
          key={facility.id}
          className="flex items-center gap-x-2 flex-1 min-w-32"
        >
          <Image
            src={facility.iconUrl!}
            alt={facility.name}
            className="w-4 h-4"
            width={16}
            height={16}
          />
          <span className="text-xs truncate">{facility.name}</span>
        </div>
          ))}
      </div>
    </div>
  )
}

// Just a stepper for this specific booking flow.
function Stepper({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-x-3">
      <div className="flex items-center">
        <div
          className={`flex items-center justify-center w-6 h-6 rounded-full ${
            step === 1 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
          }`}
        >
          <span className="text-xs font-semibold">1</span>
        </div>
        <span className={`ml-2 text-sm ${step === 1 ? "text-primary font-medium" : "text-gray-500"}`}>
          Điền thông tin
        </span>
      </div>

      <div className={`h-px w-10 mx-3 ${step === 2 ? "bg-primary" : "bg-gray-200"}`} />

      <div className="flex items-center">
        <div
          className={`flex items-center justify-center w-6 h-6 rounded-full ${
            step === 2 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
          }`}
        >
          <span className="text-xs font-semibold">2</span>
        </div>
        <span className={`ml-2 text-sm ${step === 2 ? "text-primary font-medium" : "text-gray-500"}`}>
          Thanh toán
        </span>
      </div>
    </div>
  );
}