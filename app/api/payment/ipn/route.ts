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
import type { BookingStatus } from "@/lib/generated/prisma/enums";

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
    },
  }).then((booking) => {
    if (!booking) return null;

    const amount = booking.roomType.price.mul(booking.numRooms).toNumber();
    return { id: booking.id, amount, status: booking.status };
  });
}

async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    console.log("IPN received:", queryParams);

    // Verify the IPN call
    const verify = vnpay.verifyIpnCall(queryParams as unknown as VerifyIpnCall);

    // Check if the verification is successful
    if (!verify.isVerified) {
      console.log("IPN verification failed: Invalid checksum");
      return NextResponse.json(IpnFailChecksum);
    }

    if (!verify.isSuccess) {
      console.log("IPN verification failed: Payment was not successful");
      return NextResponse.json(IpnUnknownError);
    }

    // Find the order in the database
    const booking = await findBookingById(verify.vnp_TxnRef);

    // Check if order exists
    if (!booking || verify.vnp_TxnRef !== booking.id) {
      console.log("IPN verification failed: Order not found");
      return NextResponse.json(IpnOrderNotFound);
    }

    // Check if the payment amount matches
    if (verify.vnp_Amount !== booking.amount) {
      console.log("IPN verification failed: Amount mismatch");
      return NextResponse.json(IpnInvalidAmount);
    }

    // Check if the order has already been confirmed
    if (booking.status !== "PENDING_TO_PAY") {
      console.log("IPN verification: Order already confirmed");
      return NextResponse.json(InpOrderAlreadyConfirmed);
    }

    // Update the order status to completed
    await updateBookingStatus(booking.id, "PAID");

    console.log("IPN verification successful: Order completed", {
      bookingId: booking.id,
      amount: booking.amount,
      transactionNo: verify.vnp_TransactionNo,
    });

    // Return success response to VNPay
    return NextResponse.json(IpnSuccess);
  } catch (error) {
    console.error("IPN processing error:", error);
    return NextResponse.json(IpnUnknownError);
  }
}

// VNPay may also send POST requests, so handle both methods
export async function POST(request: NextRequest) {
  return GET(request);
}