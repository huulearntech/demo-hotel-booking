"use server";

import { auth, signIn } from "@/auth";
import { AuthError } from "next-auth";
import z from "zod";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { randomInt } from "crypto";
import { addMinutes } from "date-fns";


import { Prisma, VerificationType } from "@/lib/generated/prisma/client";
import { sendOtpToEmail } from "@/lib/mailgun";
import { SignUpData, SignInData, schemaSignUp, schemaSignIn } from "@/lib/zod_schemas/auth";
import { MAX_OTP_ATTEMPTS, MIN_RESEND_OTP_MS, PATHS } from "../constants";
import { redirect } from "next/navigation";


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
  const session = await auth();
  if (session && session.user) {
    return {
      success: false,
      errors: {
        fieldErrors: {},
        formErrors: ["Bạn đã đăng nhập, vui lòng đăng xuất để tạo tài khoản mới."],
      },
    };
  }

  const safeParsedUserData = schemaSignUp.safeParse(userData);

  if (!safeParsedUserData.success) {
    const { fieldErrors, formErrors } = z.flattenError(safeParsedUserData.error);
    return {
      success: false,
      errors: { fieldErrors, formErrors },
    };
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(safeParsedUserData.data.password, saltRounds);

  const otpCode = generateOTP();
  const role = isSigningUpForHotelOwner ? "HOTEL_OWNER" : "USER";
  const status = "PENDING";

  try {
    const { verificationId } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          ...safeParsedUserData.data,
          password: hashedPassword,
          role,
          status,
        },
        select: { id: true },
      });

      const verification = await tx.verificationToken.create({
        data: {
          userId: user.id,
          code: otpCode,
          type: "REGISTRATION",
          expiresAt: addMinutes(new Date(), 5),
        },
        select: { id: true },
      });

      return { verificationId: verification.id };
    });

    await sendOtpToEmail({
      email: safeParsedUserData.data.email,
      name: safeParsedUserData.data.name,
      otpCode: otpCode
    });

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

// NOTE: signing in with google requires google cloud account, which requires credit card.
export async function signInUser(
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

  const { email, password } = safeParsedSignInData.data;
  const user = await prisma.user.findUnique({
    where: { email, status: "PENDING" },
    select: { name: true, password: true },
  });

  if (user) {
    const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) return { error: "Thông tin đăng nhập không chính xác!" };
  const lastToken = await prisma.verificationToken.findFirst({
    where: {
      user: { email },
      type: "REGISTRATION",
      used: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

    if (lastToken) {
      redirect(`${PATHS.otp}/${lastToken.id}`);
    } else {
      const otpCode = generateOTP();
      const newToken = await prisma.verificationToken.create({
        data: {
          user: { connect: { email } },
          code: otpCode,
          type: "REGISTRATION",
          expiresAt: addMinutes(new Date(), 5),
        },
        select: { id: true },
      });

      await sendOtpToEmail({
        email: email,
        name: user.name,
        otpCode: otpCode
      });
      redirect(`${PATHS.otp}/${newToken.id}`);
    }
  } else try {
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
export async function user_verifyOTP(id: string, code: string, verificationType: VerificationType): Promise<{
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
  };
}> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const tokenRecord = await tx.verificationToken.findUnique({
        where: {
          id,
          used: false,
          type: verificationType,
          expiresAt: { gte: new Date() },
        },
        select: {
          id: true,
          userId: true,
          code: true,
          attempts: true,
          user: { select: { role: true, status: true } },
        },
      });

      if (!tokenRecord) {
        return { success: false, message: "Mã OTP không hợp lệ hoặc đã hết hạn." };
      }

      if (tokenRecord.code !== code) {
        const newAttempts = tokenRecord.attempts + 1;
        await tx.verificationToken.update({
          where: { id: tokenRecord.id },
          data: { attempts: newAttempts },
        });

        if (newAttempts >= MAX_OTP_ATTEMPTS) {
          return { success: false, message: "Bạn đã vượt quá số lần thử. Vui lòng yêu cầu mã mới." };
        }

        const remaining = MAX_OTP_ATTEMPTS - newAttempts;
        return { success: false, message: `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.` };
      }

      const updatedUserStatus =
        verificationType === "REGISTRATION"
          ? tokenRecord.user.role === "HOTEL_OWNER"
            ? "HOTEL_OWNER_FILLING_INFORMATION"
            : "ACTIVE"
          : tokenRecord.user.status;

      if (verificationType === "REGISTRATION") {
        await tx.user.update({
          where: { id: tokenRecord.userId },
          data: { status: updatedUserStatus },
        });
      }

      await tx.verificationToken.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      });

      return { success: true };
    });

    return result;
  }
  catch (error) {
    console.error("user_verifyOTP error:", error);
    return { success: false, message: "Đã có lỗi xảy ra khi xác thực OTP. Vui lòng thử lại." };
  }
}


function generateOTP() {
  const otp = randomInt(100000, 999999).toString();
  return otp;
}


export async function resendOtpToEmail(referenceId: string, verificationType: VerificationType) {
  const existingToken = await prisma.verificationToken.findFirst({
    where: {
      id: referenceId,
      type: verificationType,
      expiresAt: { gte: new Date() },
      used: false,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      user: { select: { email: true, name: true } },
      createdAt: true,
    }
  });

  if (!existingToken) {
    throw new Error("Có lỗi xảy ra. Vui lòng thử lại sau.");
  }

  // throttle by creation time to avoid rapid repeated requests
  if (Date.now() - existingToken.createdAt.getTime() < MIN_RESEND_OTP_MS) {
    throw new Error(`Vui lòng đợi ít nhất ${MIN_RESEND_OTP_MS / 1000} giây trước khi gửi lại mã OTP.`);
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
      },
      select: { id: true },
    });
  });

  try {
    await sendOtpToEmail({
      email: existingToken.user.email,
      name: existingToken.user.name,
      otpCode: newOtpCode
    });
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