"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import z from "zod";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { randomInt } from "crypto";
import { addMinutes } from "date-fns";
import nodemailer from "nodemailer";


import { Prisma, VerificationType } from "@/lib/generated/prisma/client";
import { SignUpData, SignInData, schemaSignUp, schemaSignIn } from "@/lib/zod_schemas/auth";
import { MAX_OTP_ATTEMPTS, MIN_RESEND_OTP_MS } from "../constants";


type Response__SignUp = {
  success: false;
  errors: {
    fieldErrors: Partial<Record<keyof SignUpData, string[]>>;
    formErrors: string[];
  };
} | {
  success: true;
  errors: {
    fieldErrors: {};
    formErrors: [];
  };
  data: {
    id: string;
  }
}


export async function signUpUser(userData: SignUpData, isSigningUpForHotelOwner = false): Promise<Response__SignUp> {
  const safeParsedUserData = schemaSignUp.safeParse(userData);

  if (!safeParsedUserData.success) {
    const { fieldErrors, formErrors } = z.flattenError(safeParsedUserData.error);
    return {
      success: false,
      errors: { fieldErrors, formErrors },
    };
  }

  const isDevelopment = process.env.NODE_ENV === "development";
  let hashedPassword = safeParsedUserData.data.password;
  if (isDevelopment) {
    console.warn("Running in development mode, storing password in plaintext. DO NOT USE THIS IN PRODUCTION!");
  } else {
    // Hash the password before storing it in the database
    const saltRounds = 10;
    hashedPassword = await bcrypt.hash(safeParsedUserData.data.password, saltRounds);
  }
  const otpCode = generateOTP();

  try {
    const verificationId = await prisma.$transaction(async (tx) => {
      const { id: userId } = await tx.user.create({
        data: {
          ...safeParsedUserData.data,
          password: hashedPassword,
          role: isSigningUpForHotelOwner ? "HOTEL_OWNER" : "USER",
          status: isSigningUpForHotelOwner ? "HOTEL_OWNER_FILLING_INFORMATION" : "ACTIVE",
        },
        select: { id: true },
      });
      const { id: verificationId } = await tx.verificationToken.create({
        data: {
          userId,
          code: otpCode,
          type: "REGISTRATION",
          expiresAt: addMinutes(new Date(), 5), // OTP expires in 5 minutes
        },
      });

      return verificationId;
    });

    await sendOtpToEmail(safeParsedUserData.data.name, safeParsedUserData.data.email, otpCode);

    return {
      success: true,
      errors: { fieldErrors: {}, formErrors: [] },
      data: { id: verificationId },
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        errors: {
          fieldErrors: {
            email: ["Email đã được sử dụng!"],
          },
          formErrors: [],
        }
      };
    }
    return {
      success: false,
      errors: {
        fieldErrors: {},
        formErrors: ["Đã có lỗi xảy ra, vui lòng thử lại."]
      },
    };
  }
}

// NOTE: signing in with google requires google cloud accout, which requires credit card.
export async function signInUserWithOptionalCallback(
  formData: SignInData,
  callbackUrl?: string
) {
  const safeParsedSignInData = schemaSignIn.safeParse(formData);
  if (!safeParsedSignInData.success) {
    const { fieldErrors, formErrors } = z.flattenError(safeParsedSignInData.error);
    return {
      success: false,
      errors: { fieldErrors, formErrors },
    };
  }

  try {
    await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirectTo: callbackUrl, // Auth.js sẽ xử lý redirect phía server khi có tham số này
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Thông tin đăng nhập không chính xác!" }
        default:
          return { error: "Đã có lỗi xảy ra, vui lòng thử lại." }
      }
    }
    throw error; // Cần throw error để Next.js thực hiện redirect
  }
}


// TODO: lots of edge cases.
export async function user_verifyOTP(id: string, code: string, verificationType: VerificationType) {
  return await prisma.$transaction(async (tx) => {
    const tokenRecord = await tx.verificationToken.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        code: true,
        attempts: true,
        expiresAt: true,
        used: true,
        type: true,
        user: { select: { role: true } },
      },
    });

    if (
      !tokenRecord ||
      tokenRecord.used ||
      tokenRecord.type !== verificationType ||
      tokenRecord.expiresAt < new Date()
    ) {
      return { success: false, message: "Mã OTP không hợp lệ hoặc đã hết hạn." };
    }

    if (tokenRecord.attempts >= MAX_OTP_ATTEMPTS) {
      // Already exhausted attempts
      await tx.verificationToken.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      });
      return { success: false, message: "Bạn đã vượt quá số lần thử. Vui lòng yêu cầu mã mới." };
    }

    if (tokenRecord.code === code) {
      // Correct code
      if (verificationType === "REGISTRATION") {
        await tx.user.update({
          where: { id: tokenRecord.userId },
          data: {
            status:
              tokenRecord.user.role === "HOTEL_OWNER"
                ? "HOTEL_OWNER_FILLING_INFORMATION"
                : "ACTIVE",
          },
        });
      }

      await tx.verificationToken.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      });

      return { success: true };
    } else {
      // Incorrect code -> increment attempts
      const newAttempts = tokenRecord.attempts + 1;
      await tx.verificationToken.update({
        where: { id: tokenRecord.id },
        data: {
          attempts: newAttempts,
          used: newAttempts >= MAX_OTP_ATTEMPTS ? true : false,
        },
      });

      if (newAttempts >= MAX_OTP_ATTEMPTS) {
        return { success: false, message: "Bạn đã vượt quá số lần thử. Vui lòng yêu cầu mã mới." };
      }

      const remaining = MAX_OTP_ATTEMPTS - newAttempts;
      return { success: false, message: `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.` };
    }
  });
}


function generateOTP() {
  const otp = randomInt(100000, 999999).toString();
  return otp;
}

async function sendOtpToEmail(name: string, email: string, otpCode: string) {
  if (process.env.NODE_ENV === "development") {
    console.log(`Development mode: OTP for ${email} is ${otpCode}`);
    return;
  }
  
  if (!email) {
    throw new Error("Recipient email must be provided to send OTP.");
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    throw new Error("GMAIL_USER and GMAIL_PASS must be set in environment variables to send OTP emails");
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });

  const htmlContent = `
      <div style="font-family: Arial, sans-serif; background:#f6f9fc; padding:24px;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px; box-shadow:0 2px 6px rgba(0,0,0,0.08);">
          <h2 style="margin:0 0 8px 0; color:#333;">Mã xác thực (OTP)</h2>
          <p style="margin:0 0 16px 0; color:#555;">
            Xin chào ${name || 'khách hàng'},<br />
            Hệ thống đã gửi cho bạn mã OTP gồm 6 chữ số để xác thực.
          </p>

          <div style="display:flex; align-items:center; justify-content:center; margin:18px 0;">
            <span style="font-size:28px; letter-spacing:4px; font-weight:700; background:#f1f5f9; padding:12px 20px; border-radius:6px; color:#111;">
              ${otpCode}
            </span>
          </div>

          <p style="margin:0 0 8px 0; color:#555;">
            Mã có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.
          </p>

          <hr style="border:none; border-top:1px solid #eee; margin:18px 0;" />

          <p style="margin:0; font-size:12px; color:#999;">
            Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
          </p>
        </div>
      </div>
    `;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: `Mã OTP của bạn`,
    text: `Mã OTP của bạn là ${otpCode}. Mã có hiệu lực trong 5 phút.`,
    html: htmlContent,
  });
}

export async function resendOtpToEmail(referenceId: string, verificationType: VerificationType) {

  const existingToken = await prisma.verificationToken.findFirst({
    where: {
      id: referenceId,
      type: verificationType,
      expiresAt: { gte: new Date() },
      used: false,
      attempts: { lt: MAX_OTP_ATTEMPTS },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!existingToken) {
    throw new Error("Không tìm thấy mã OTP hợp lệ để gửi lại. Vui lòng thử lại sau.");
  }

  // throttle by creation time to avoid rapid repeated requests
  if (Date.now() - existingToken.createdAt.getTime() < MIN_RESEND_OTP_MS) {
    throw new Error(`Vui lòng đợi ít nhất ${MIN_RESEND_OTP_MS / 1000} giây trước khi gửi lại mã OTP.`);
  }

  const user = await prisma.user.findUnique({
    where: { id: existingToken.userId },
    select: { email: true, name: true },
  });

  if (!user) {
    throw new Error("Không tìm thấy người dùng liên quan đến mã OTP. Vui lòng thử lại sau.");
  }

  const newOtpCode = generateOTP();

  // Use a transaction so the previous token is consumed and a new token is created atomically
  const created = await prisma.$transaction(async (tx) => {
    await tx.verificationToken.update({
      where: { id: existingToken.id },
      data: { used: true },
    });

    return tx.verificationToken.create({
      data: {
        userId: existingToken.userId,
        code: newOtpCode,
        type: verificationType,
        expiresAt: addMinutes(new Date(), 5),
        attempts: (existingToken.attempts ?? 0) + 1, // increment attempts
      },
      select: { id: true },
    });
  });

  try {
    await sendOtpToEmail(user.name, user.email, newOtpCode);
    return { success: true, data: created };
  } catch (sendErr) {
    // rollback DB changes if sending failed so the attempt isn't consumed
    await prisma.$transaction([
      prisma.verificationToken.delete({ where: { id: created.id } }),
      prisma.verificationToken.update({ where: { id: existingToken.id }, data: { used: false } }),
    ]);
    throw sendErr;
  }
}