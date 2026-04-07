// User will make a newe draft booking every request
// but only when the user submits the information form,
// the rooms must be recheck for availability. If true,
// then hold the rooms for 15-20 minutes,
// otherwise release the rooms and notify the user that the rooms are no longer available.


// => thus, draft booking only needs to know the number of rooms in that roomtype,
// and doesn't need to know which rooms, because the rooms will be rechecked for availability
// when the user submits the information form anyway.


// If then, should I make a separate table for draft bookings? (Holds the snapshot information)
// => only make it real booking when all steps are done.

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
  ForkKnife,
  ScrollText,
} from "lucide-react";
import { tvlk_logo_text_dark } from "@/public/logos"
import { Prisma } from "@/lib/generated/prisma/client";

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) notFound();
  const { email, name } = session.user;

  // Handle expired booking
  const bookingMetadataAndHotel = await prisma.bookingMetadata.findUnique({
    where: { id, userId: session.user.id },
    select: {
      hotel: {
        select: {
          name: true,
          reviewPoints: true,
          numberOfReviews: true,
          facilities: { select: { name: true, iconUrl: true } }
        }
      },
      numRooms: true,
      numGuests: true,
      snapshotCheckInTime: true,
      snapshotCheckOutTime: true,
      snapshotRoomTypeName: true,
      snapshotRoomPrice: true,
      checkInDate: true,
      checkOutDate: true,
    }
  });
  if (!bookingMetadataAndHotel) notFound();

  const { hotel: { name: hotelName, reviewPoints, numberOfReviews, facilities }, ...bookingMetadata } = bookingMetadataAndHotel;

  return (
    <InformationFormProvider defaultValues={{ name: name || "", email: email || "" }} >
      <header className="w-full h-20 z-60 bg-white shadow-md sticky top-0">
        <div className="flex h-full justify-between items-center content">
          <div className="flex items-center">
            <Image src={tvlk_logo_text_dark} alt="Traveloka Header Logo" />
            <div className="h-10 w-px bg-gray-200 mx-3"></div>
            <div className="flex flex-col gap-y-1 p-4">
              <div className="text-base text-black font-semibold">
                {hotelName}
              </div>
              <div className="flex items-center gap-x-2 text-xs">
                <span className="text-primary font-black">{reviewPoints.toFixed(1) + " / " + MAX_REVIEW_POINTS}</span>
                <span className="text-gray-500 font-semibold">({numberOfReviews} đánh giá)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-16">
            {/** TODO: Stepper */}
            Stepper go here
          </div>
        </div>
      </header>

      <div className="min-h-screen bg-[url('/images/bg-booking-page.webp')] bg-no-repeat bg-bottom">
        <main className="content grid gap-6 pt-6 pb-10 grid-cols-1 lg:grid-cols-[1fr_25rem] lg:items-start">
          <div className="order-2 lg:col-start-2 lg:row-start-1">
            <BookingSummary bookingMetadata={bookingMetadata} facilities={facilities} />
          </div>

          <div className="order-3 row-span-3 lg:col-start-1 flex flex-col gap-y-6 min-w-100">
            <InformationForm />

            <div className="w-full h-fit flex flex-col rounded-4xl bg-white shadow-lg p-4 gap-y-4">
              <div className="flex flex-col gap-y-2">
                <div className="flex gap-x-2 items-center">
                  <ScrollText className="size-5" />
                  <h2 className="text-xl font-semibold"> Chính sách chỗ ở </h2>
                </div>
                <div className="text-sm font-medium text-gray-500">
                  Vui lòng đọc kỹ các chính sách của chỗ ở trước khi hoàn tất đặt chỗ.
                </div>
              </div>
            </div>
          </div>
          <div className="order-4 lg:col-start-2 lg:row-start-2">
            <PriceDetail />
          </div>
        </main>
      </div>
    </InformationFormProvider>
  )
};

async function BookingSummary({
  bookingMetadata,
  facilities,
}: {
  bookingMetadata: Prisma.BookingMetadataGetPayload<{
    select: {
      numRooms: true,
      numGuests: true,
      snapshotCheckInTime: true,
      snapshotCheckOutTime: true,
      snapshotRoomTypeName: true,
      checkInDate: true,
      checkOutDate: true,
    }
  }>,
  facilities: { name: string, iconUrl: string | null }[],
}) {
  const {
    numRooms,
    numGuests,
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
            Trước {new Intl.DateTimeFormat('vi-VN', {
              hour: '2-digit',
              minute: '2-digit'
            }).format(snapshotCheckOutTime)}
          </div>
        </div>
      </div>

      <div className="flex gap-x-2 items-center">
        <DoorOpen className="size-4" />
        <div className="text-sm font-semibold">{numGuests} khách</div>
        <div className="w-px bg-gray-500 h-3 mx-1"></div>
        <BedDouble className="size-4" />
        <ForkKnife className="size-4" />
      </div>
      <div className="flex gap-x-2 flex-wrap text-sm text-gray-500">
        {facilities.filter(facility => facility.iconUrl).map((facility, index) => (
          <div key={index} className="flex items-center gap-x-2">
            <Image
              src={facility.iconUrl!}
              alt=""
              className="size-4"
              width={16}
              height={16}
            />
            {facility.name}
          </div>
        ))}
      </div>
    </div>
  )
}