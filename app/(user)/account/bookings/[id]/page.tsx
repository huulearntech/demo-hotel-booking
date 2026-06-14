import { notFound, redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { BookingStatus } from "@/lib/generated/prisma/enums";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRightIcon, DoorOpenIcon, UserIcon } from "lucide-react";
import { BOOKING_STATUS_BADGE_COLORS, MAX_RATING, PATHS } from "@/lib/constants";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import ReviewForm from "./review-form";
import Image from "next/image";
import { tvlk_favicon } from "@/public/logos";
import { vi } from "date-fns/locale";

const fmtCurrency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format;
const fmtDate = (d: Date) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
const fmtDateTime = (d: Date) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);

async function getBooking(id: string) {
  const session = await auth();
  if (!session) return null;

  const booking = await prisma.booking.findUnique({
    where: {
      id,
      //userId: session.user.id
    },
    select: {
      id: true,
      roomType: {
        select: {
          name: true,
          hotel: {
            select: {
              name: true,
              type: true,
              owner: {
                select: {
                  profileImageUrl: true,
                }
              }
            },
          },
        },
      },
      checkInDate: true,
      checkOutDate: true,
      numRooms: true,
      numAdults: true,
      numChildren: true,
      snapshotRoomTypeName: true,
      snapshotRoomPrice: true,
      status: true,
      createdAt: true,
      review: {
        select: {
          rating: true,
          comment: true,
          createdAt: true,
        }
      }
    }
  });

  if (!booking) return null;

  const totalPrice = booking.snapshotRoomPrice.mul(differenceInDays(booking.checkOutDate, booking.checkInDate)).toNumber();

  return { ...booking, totalPrice };
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;
  const booking = await getBooking(bookingId);
  // if (!booking) redirect(PATHS.notFound);
  if (!booking) notFound();

  const hotelName = booking.roomType.hotel.name;
  const hotelType = booking.roomType.hotel.type;
  const totalPrice = booking.totalPrice;
  const createdAt = booking.createdAt;
  const checkInDate = booking.checkInDate;
  const checkOutDate = booking.checkOutDate;
  const nights = differenceInDays(checkOutDate, checkInDate);
  const roomTypeName = booking.snapshotRoomTypeName;


  return (
    <main className="content py-6">
      <div className="space-y-6">
        <Card className="rounded-xl border bg-card/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <Avatar>
                <AvatarFallback>
                  {hotelName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate font-semibold leading-5">{hotelName}</div>
                  {hotelType ? (
                    <span className="ml-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {hotelType}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground truncate">
                  <span className="truncate">Mã: {booking.id}</span>
                  <span className="hidden sm:inline">- Đặt lúc {fmtDateTime(createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold">{fmtCurrency(totalPrice)}</div>
                <StatusBadge status={booking.status} />
              </div>
              <div className="text-sm text-muted-foreground">
                {fmtDate(checkInDate)} <ArrowRightIcon className="inline h-4 w-4 align-middle" /> {fmtDate(checkOutDate)}
                {nights ? <span className="ml-2">· {nights} đêm</span> : null}
              </div>
            </div>
          </CardHeader>

          <CardFooter className="flex items-center justify-between gap-x-4">
            <div className="flex text-sm items-center gap-4">
              <div className="flex items-center gap-2">
                <DoorOpenIcon className="size-4 text-muted-foreground" />
                <span>{booking.numRooms} phòng</span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-sm text-muted-foreground">
                  {roomTypeName}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <UserIcon className="size-4 text-muted-foreground" />
                <span>
                  {booking.numAdults} người lớn{booking.numChildren ? ` & ${booking.numChildren} trẻ em` : ""}
                </span>
              </div>
            </div>
          </CardFooter>

          {booking.status === BookingStatus.CHECKED_OUT ? (
            <CardContent>
              {booking.review?.comment ? (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-0.5 rounded-full bg-blue-50 flex items-center justify-center space-x-1">
                      <Image src={tvlk_favicon} alt="" aria-hidden className="size-4.5" />
                      <div className="flex items-end gap-x-0.5">
                        <div className="text-primary font-bold">{booking.review.rating}</div>
                        <div className="text-sm font-medium">/</div>
                        <div className="text-sm font-medium">{MAX_RATING}</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Đã đánh giá {formatDistanceToNow(booking.review?.createdAt, { addSuffix: true, locale: vi }) } </p>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{booking.review.comment}</p>
                </div>
              ) : (
                <ReviewForm bookingId={booking.id} />
              )}
            </CardContent>
          ) : null}
        </Card>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const s = BOOKING_STATUS_BADGE_COLORS[status];
  return <span className={`px-2 py-1 rounded-md text-xs font-medium ${s.variant}`}>{s.text}</span>;
}