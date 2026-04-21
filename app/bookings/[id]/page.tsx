// User will make a new draft booking every request
// but only when the user submits the information form,
// the rooms must be recheck for availability. If true,
// then hold the rooms for 15-20 minutes,
// otherwise release the rooms and notify the user that the rooms are no longer available.


// => thus, draft booking only needs to know the number of rooms in that roomtype,
// and doesn't need to know which rooms, because the rooms will be rechecked for availability
// when the user submits the information form anyway.

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
import { BedType, Prisma } from "@/lib/generated/prisma/client";

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) notFound();
  const { email, name } = session.user;

  // Handle expired booking
  const bookingMetadataAndHotel = await prisma.bookingMetadata.findUnique({
    where: { id, userId: session.user.id, status: "DRAFT" }, // TODO: Handle expired, or paid.
    select: {
      roomType: {
        select: {
          hotel: {
            select: {
              name: true,
              type: true,
              rating: true,
              numberOfReviews: true,
              facilities: { select: { id: true, name: true, iconUrl: true } }
            }
          },
          bedType: true,
        }
      },
      numRooms: true,
      numAdults: true,
      numChildren: true,
      snapshotCheckInTime: true,
      snapshotCheckOutTime: true,
      snapshotRoomTypeName: true,
      snapshotRoomPrice: true,
      checkInDate: true,
      checkOutDate: true,
    }
  });
  if (!bookingMetadataAndHotel) notFound();

  const {
    roomType: {
      hotel: {
        name: hotelName,
        type: hotelType,
        rating,
        numberOfReviews,
        facilities
      },
      bedType,
    },
    ...bookingMetadata
  } = bookingMetadataAndHotel;

  return (
    <InformationFormProvider defaultValues={{ name: name || "", email: email || "" }} >
      <header className="w-full h-20 z-60 bg-white shadow-md sticky top-0">
        <div className="flex h-full justify-between items-center content">
          <div className="flex items-center">
            <Image src={tvlk_logo_text_dark} alt="" />
            <div className="h-10 w-px bg-gray-200 mx-3"></div>
            <div className="flex flex-col gap-y-1 p-4">
              <div className="flex items-center gap-x-2">
                <span className="text-base text-black font-semibold"> {hotelName} </span>
                <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-primary lowercase first-letter:capitalize">{hotelType}</span>
              </div>
              <div className="flex items-center gap-x-2 text-xs">
                <span className="text-primary font-black">{rating.toFixed(1) + " / " + MAX_REVIEW_POINTS}</span>
                <span className="text-gray-500 font-semibold">({numberOfReviews} đánh giá)</span>
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
            <BookingSummary bookingMetadata={bookingMetadata} facilities={facilities} bedType={bedType} />
          </div>

          <div className="order-3 row-span-3 lg:col-start-1 min-w-100">
            <InformationForm />
          </div>
          <div className="order-4 lg:col-start-2 lg:row-start-2">
            <PriceDetail
              snapshotRoomTypeName={bookingMetadata.snapshotRoomTypeName}
              snapshotRoomPrice={bookingMetadata.snapshotRoomPrice.toNumber()}
              nights={differenceInDays(bookingMetadata.checkOutDate, bookingMetadata.checkInDate)}
              numRooms={bookingMetadata.numRooms}
              // FIXME: temporary total price calculation, must be calculated in Decimal on server.
              totalPrice={bookingMetadata.snapshotRoomPrice.toNumber() * bookingMetadata.numRooms * differenceInDays(bookingMetadata.checkOutDate, bookingMetadata.checkInDate)}
              metadataId={id}
            />
          </div>
        </main>
      </div>
    </InformationFormProvider>
  )
};

async function BookingSummary({
  bookingMetadata,
  facilities,
  bedType,
}: {
  bookingMetadata: Prisma.BookingMetadataGetPayload<{
    select: {
      numRooms: true,
      numAdults: true,
      numChildren: true,
      snapshotCheckInTime: true,
      snapshotCheckOutTime: true,
      snapshotRoomTypeName: true,
      checkInDate: true,
      checkOutDate: true,
    }
  }>,
  facilities: { id: string, name: string, iconUrl: string | null }[],
  bedType: BedType,
}) {
  const {
    numRooms,
    numAdults,
    numChildren,
    snapshotCheckInTime,
    snapshotCheckOutTime,
    snapshotRoomTypeName,
    checkInDate,
    checkOutDate,
  } = bookingMetadata;

  return (
    <div className="flex flex-col rounded-4xl bg-white shadow-lg p-4 gap-y-2">
      <div className="flex flex-col gap-y-1">
        <h2 className="text-[1.25rem] font-semibold">({numRooms}x) {snapshotRoomTypeName}</h2>
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
            Từ {new Intl.DateTimeFormat('vi-VN', {
              hour: '2-digit',
              minute: '2-digit'
            }).format(snapshotCheckInTime)}
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
            {/* Trước {new Intl.DateTimeFormat('vi-VN', {
              hour: '2-digit',
              minute: '2-digit'
            }).format(snapshotCheckOutTime)} */}
            {snapshotCheckOutTime.toISOString()}
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