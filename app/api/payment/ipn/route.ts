import { NextRequest, NextResponse } from "next/server";
import { vnpay } from "@/lib/vnpay";

// Typo? Lmao. Inp -> Ipn
import {
  VerifyIpnCall,
  IpnFailChecksum,
  IpnOrderNotFound,
  IpnInvalidAmount,
  InpOrderAlreadyConfirmed,
  IpnSuccess,
  IpnUnknownError,
} from "vnpay";
import prisma from "@/lib/prisma";
import { differenceInDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    // Verify the IPN call
    const verify = vnpay.verifyIpnCall(queryParams as unknown as VerifyIpnCall);

    // Check if the verification is successful
    if (!verify.isVerified) {
      return NextResponse.json(IpnFailChecksum);
    }

    if (!verify.isSuccess) {
      return NextResponse.json(IpnUnknownError);
    }

    // Find the order in the database
    const booking = await findBookingById(verify.vnp_TxnRef);

    // Check if order exists
    if (!booking || verify.vnp_TxnRef !== booking.id) {
      return NextResponse.json(IpnOrderNotFound);
    }

    // Check if the payment amount matches
    if (verify.vnp_Amount !== booking.amount) {
      return NextResponse.json(IpnInvalidAmount);
    }

    // Check if the order has already been confirmed
    if (booking.status !== "PENDING_TO_PAY") {
      return NextResponse.json(InpOrderAlreadyConfirmed);
    }

    // Update the order status to paid
    await updateBookingStatusToPaid(booking.id);

    // Return success response to VNPay
    return NextResponse.json(IpnSuccess);
  } catch (error) {
    return NextResponse.json(IpnUnknownError);
  }
}

// VNPay may also send POST requests, so handle both methods
export async function POST(request: NextRequest) {
  return GET(request);
}


async function findBookingById(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      numRooms: true,
      roomType: {
        select: {
          price: true,
        },
      },
      status: true,
      checkInDate: true,
      checkOutDate: true,
    },
  }).then((booking) => {
    if (!booking) return null;

    const amount = booking.roomType.price
      .mul(booking.numRooms)
      .mul(differenceInDays(booking.checkOutDate, booking.checkInDate))
      .toNumber();
    return { id: booking.id, amount, status: booking.status };
  });
}

async function updateBookingStatusToPaid(
  bookingId: string,
) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: "PAID"},
    select: { id: true, status: true },
  });
}