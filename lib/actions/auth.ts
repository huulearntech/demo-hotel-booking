"use server";

import { PATHS } from "@/lib/constants";
import { SignUpData, SignInData, schemaSignUp, schemaSignIn } from "@/lib/zod_schemas/auth";

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import z from "zod";

type Response__SignUp = {
  success: boolean;
  errors: {
    fieldErrors: Partial<Record<keyof SignUpData, string[]>>;
    formErrors: string[];
  };
}

// May leverage this function for hotel owner with an optional argument for role.
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
  try {
    await prisma.user.create({
      data: {
        ...safeParsedUserData.data,
        password: hashedPassword,
        role: isSigningUpForHotelOwner ? "HOTEL_OWNER" : "USER",
      },
    });
    return {
      success: true,
      errors: { fieldErrors: {}, formErrors: [] },
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
      // Ví dụ dùng Credentials, nếu dùng Google thì chỉ cần provider "google"
      email: formData.email,
      password: formData.password,
      // Auth.js sẽ xử lý redirect phía server khi có tham số này
      redirectTo: callbackUrl || PATHS.home, 
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