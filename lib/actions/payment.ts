"use server";

import "dotenv/config";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { vnpay } from "@/lib/vnpay";
import { ProductCode, VnpLocale, VnpCurrCode, dateFormat } from "vnpay";

import { schema_bookingForm, type BookingFormValues } from "../zod_schemas/booking";
import prisma from "../prisma";
import { differenceInDays } from "date-fns";

function getClientIP (headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = headers.get("x-real-ip");
  const clientIP = headers.get("x-client-ip");
  return realIP || clientIP || "127.0.0.1";
};

export async function fake_payment_just_for_testing(
  metadataId: string,
  bookingForm: BookingFormValues
) {
  // THIS IS JUST FOR TESTING, DO NOT USE THIS IN PRODUCTION.
  const safeParsedBookingForm = schema_bookingForm.safeParse(bookingForm);
  if (!safeParsedBookingForm.success) {
    throw new Error("Invalid booking form data");
  }

  try {
    // TODO: handle expire.
    const booking_draft = await prisma.bookingMetadata.findUnique({
      where: { id: metadataId, status: "DRAFT" },
      select: {
        numRooms: true,
        roomType: {
          select: {
            id: true,
            price: true,
          }
        },
        checkInDate: true,
        checkOutDate: true,
      },
    });
    
    if (!booking_draft) {
      throw new Error("Booking draft not found");
    }

    const totalPrice = booking_draft.roomType.price.mul(booking_draft.numRooms).toNumber();
    if (totalPrice <= 1000) {
      throw new Error("Total price must be greater than 1000 VND to proceed with payment");
    }

    const inventories = await prisma.roomTypeInventory.findMany({
      where: {
        roomTypeId: booking_draft.roomType.id,
        date: {
          gte: booking_draft.checkInDate,
          lt: booking_draft.checkOutDate,
        },
      },
      select: {
        date: true,
        totalRooms: true,
        bookedRooms: true,
      },
    });

    console.log("Inventories for selected dates:", inventories);

    // compute available rooms per day and take the minimum across the date range
    const availablePerDay = inventories.map((inv) => (inv.totalRooms ?? 0) - (inv.bookedRooms ?? 0));
    const available_rooms_count = Math.min(...availablePerDay);

    if (available_rooms_count < booking_draft.numRooms || inventories.length < differenceInDays(booking_draft.checkOutDate, booking_draft.checkInDate)) {
      throw new Error("Not enough available rooms for the selected dates");
    }

    // TODO: merge booking with bookingmetadata.
    const result = await prisma.$transaction(async (tx) => {
      const meta = await tx.bookingMetadata.update({
        where: { id: metadataId, status: "DRAFT" },
        data: { status: "SUCCESS" },
        select: { id: true },
      });

      const booking = await tx.booking.create({
        data: {
          metadataId,
          customerName: safeParsedBookingForm.data.name,
          customerEmail: safeParsedBookingForm.data.email,
          customerPhone: safeParsedBookingForm.data.phone,
          notes: safeParsedBookingForm.data.note,
          status: "PENDING_TO_PAY",
        },
        select: { id: true },
      });

      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "PAID" },
      });

      return { meta, booking };
    });

    redirect(`/payment/tmp/success?id=${result.booking.id}&message=${"hello"}`); // TODO: Replace with actual success page
  } catch (error) {
    console.error("Error in fake payment:", error);
    throw error;
  }
}

export async function createPaymentUrlThenRedirectToVNPay(metadataId: string, bookingForm: BookingFormValues) {
  try {
    if (!process.env.VNPAY_RETURN_URL) {
      throw new Error("VNPAY_RETURN_URL is not configured");
    }

    const safeParsedBookingForm = schema_bookingForm.safeParse(bookingForm);
    if (!safeParsedBookingForm.success) {
      throw new Error("Invalid booking form data");
    }

    // TODO: handle expire.
    const booking_draft = await prisma.bookingMetadata.findUnique({
      where: { id: metadataId, status: "DRAFT" },
      select: {
        numRooms: true,
        roomType: {
          select: {
            id: true,
            price: true,
          }
        },
        checkInDate: true,
        checkOutDate: true,
      },
    });
    
    if (!booking_draft) {
      throw new Error("Booking draft not found");
    }

    const totalPrice = booking_draft.roomType.price.mul(booking_draft.numRooms).toNumber();
    if (totalPrice <= 1000) {
      throw new Error("Total price must be greater than 1000 VND to proceed with payment");
    }

    const inventories = await prisma.roomTypeInventory.findMany({
      where: {
        roomTypeId: booking_draft.roomType.id,
        date: {
          gte: booking_draft.checkInDate,
          lt: booking_draft.checkOutDate,
        },
      },
      select: {
        date: true,
        totalRooms: true,
        bookedRooms: true,
      },
    });

    if (inventories.length === 0) {
      throw new Error("No inventory data for the selected dates");
    }

    // compute available rooms per day and take the minimum across the date range
    const availablePerDay = inventories.map((inv) => (inv.totalRooms ?? 0) - (inv.bookedRooms ?? 0));
    const available_rooms_count = Math.min(...availablePerDay);

    if (available_rooms_count < booking_draft.numRooms) {
      throw new Error("Not enough available rooms for the selected dates");
    }

    // TODO: This is not what i want.
    // TODO: This also should have trigger to update inventory and booking metadata status to "PENDING_TO_PAY"
    const booking = await prisma.booking.create({
      data: {
        metadataId,
        customerName: safeParsedBookingForm.data.name,
        customerEmail: safeParsedBookingForm.data.email,
        customerPhone: safeParsedBookingForm.data.phone,
        notes: safeParsedBookingForm.data.note,
        status: "PENDING_TO_PAY",
      },
      select: { id: true },
    });

    const orderInfo = `Booking ID: ${booking.id}, Room Type ID: ${booking_draft.roomType.id}, Check-in: ${booking_draft.checkInDate.toISOString()}, Check-out: ${booking_draft.checkOutDate.toISOString()}, Num Rooms: ${booking_draft.numRooms}`;

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
      vnp_TxnRef: booking.id,
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