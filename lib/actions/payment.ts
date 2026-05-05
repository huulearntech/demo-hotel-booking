"use server";

import "dotenv/config";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { vnpay } from "@/lib/vnpay";
import { ProductCode, VnpLocale, VnpCurrCode, dateFormat } from "vnpay";

import { schema_bookingForm } from "../zod_schemas/booking";
import prisma from "../prisma";
import { differenceInDays } from "date-fns";
import { auth } from "@/auth";
import { user_getRoomTypeInventoryForUpdate } from "../generated/prisma/sql";
import { schema_searchSpecWithoutLocation, toYYYY_MM_DD } from "../zod_schemas/search-bar";
import z from "zod";


export async function createBookingThenRedirectToVNPay(
  roomTypeId: string,
  checkInDate: Date,
  checkOutDate: Date,
  numAdults: number,
  numChildren: number,
  numRooms: number,
  price: number,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  notes: string | undefined,
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "USER") {
      throw new Error("Unauthorized");
    }

    if (!process.env.VNPAY_RETURN_URL) {
      throw new Error("VNPAY_RETURN_URL is not configured");
    }

    // Validate input
    const parse_spec_result = schema_searchSpecWithoutLocation.safeParse({
      inOutDates: {
        from: checkInDate,
        to: checkOutDate,
      },
      guestsAndRooms: {
        numAdults,
        numChildren,
        numRooms,
      },
    });
    const parse_customer_info_result = schema_bookingForm.safeParse({
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      notes,
    } as z.infer<typeof schema_bookingForm>);
    if (!parse_spec_result.success) {
      throw new Error("Invalid spec: " + parse_spec_result.error.message);
    }
    if (!parse_customer_info_result.success) {
      throw new Error("Invalid customer info: " + parse_customer_info_result.error.message);
    }


    // NOTE: This should be done in the previous step, but just in case.
    const totalPrice = price * numRooms * differenceInDays(checkOutDate, checkInDate); // FIXME: this is just temporary place holder. Do NOT compute in js number.
    if (totalPrice <= 1000) {
      throw new Error("Total price must be greater than 1000 VND to proceed with payment");
    }

    // Check if user has another pending booking
    const userHasAnotherPendingBooking = await prisma.booking.findFirst({
      where: {
        userId: session.user.id,
        status: "PENDING_TO_PAY",
      },
    });

    if (userHasAnotherPendingBooking) {
      throw new Error("You have another pending booking. Please complete or cancel it before creating a new one.");
    }

    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      select: {
        id: true,
        name: true,
        price: true,
        hotel: {
          select: {
            checkInTime: true,
            checkOutTime: true
          }
        }
      },
    });

    if (!roomType) {
      throw new Error("Invalid room type");
    }


    const createdBooking = await prisma.$transaction(async (tx) => {
      // NOTE: This will lock the relevant RoomTypeInventory rows to ensure atomicity.
      // This may also be done by versioning the rows, but for the sake of time doing this project,
      // we will just lock the rows here.
      const inventories = await tx.$queryRawTyped(user_getRoomTypeInventoryForUpdate(
        roomTypeId,
        checkInDate,
        checkOutDate
      ));

      // compute available rooms per day and take the minimum across the date range
      const availablePerDay = inventories.map((inv) => (inv.totalRooms ?? 0) - (inv.bookedRooms ?? 0));
      const available_rooms_count = Math.min(...availablePerDay);

      if (
        available_rooms_count < numRooms ||
        inventories.length < differenceInDays(checkOutDate, checkInDate)) {
        throw new Error("Not enough available rooms for the selected dates");
      }

      // TODO: when on production, this should be create a booking with status "PENDING_TO_PAY" and then redirect to the vnpay page, not the success page.
      return await tx.booking.create({
        data: {
          userId: session.user.id,
          roomTypeId,
          checkInDate,
          checkOutDate,
          numChildren,
          numAdults,
          numRooms,

          snapshotCheckInTime: roomType.hotel.checkInTime,
          snapshotCheckOutTime: roomType.hotel.checkOutTime,
          snapshotRoomPrice: price,
          snapshotRoomTypeName: roomType.name,
          customerName,
          customerEmail,
          customerPhone,
          notes,

          status: "PENDING_TO_PAY"
        },
        select: { id: true },
      });
    });
    

    const orderInfo = `Order ${createdBooking.id}: ${numRooms}x room(s) (${roomTypeId}) from ${toYYYY_MM_DD(checkInDate)} to ${toYYYY_MM_DD(checkOutDate)}, total ${totalPrice} VND`;

    // Build payment URL
    const clientIPAddr = await headers().then(getClientIP);
    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: totalPrice,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_CurrCode: VnpCurrCode.VND,
      vnp_IpAddr: clientIPAddr,
      vnp_Locale: VnpLocale.VN,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: ProductCode.Hotel_Tourism,
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
      vnp_TxnRef: createdBooking.id,
    });

    // Redirect to VNPay
    // Note: redirect() in Server Actions throws a NEXT_REDIRECT error which is expected behavior
    redirect(paymentUrl);
  } catch (error) {
    // Check if this is a Next.js redirect (expected behavior)
    const isRedirect = error instanceof Error && (
      error.message.includes("NEXT_REDIRECT") ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).digest?.includes("NEXT_REDIRECT")
    );

    if (isRedirect) {
      // This is expected behavior for redirect() in Server Actions
      console.log("Redirecting to VNPay payment gateway...");
    } else {
      // Only log actual errors
      console.error("Error creating payment URL:", error);
    }
    throw error;
  }
}


function getClientIP (headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = headers.get("x-real-ip");
  const clientIP = headers.get("x-client-ip");
  return realIP || clientIP || "127.0.0.1";
};