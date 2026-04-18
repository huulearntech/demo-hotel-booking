import { z } from "zod";

export const schemaSignIn = z.object({
  email: z.email({ message: "Email không hợp lệ" }),
  password: z.string().min(1, { message: "Mật khẩu là bắt buộc" }),
});

export const schemaSignUp = z.object({
  email: z.email({ message: "Địa chỉ email không hợp lệ" }),
  name: z.string().min(1, { message: "Tên là bắt buộc" }).max(50, { message: "Tên phải ít hơn 50 ký tự" }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});

export const userUpdateNameSchema = schemaSignUp.pick({ name: true })
export type UserUpdateNameData = z.infer<typeof userUpdateNameSchema>;

// export const schemaForgotPassword = z.object({
//   email: z.email({ message: "Invalid email address" }),
// });

// export const schemaResetPassword = z.object({
//   token: z.string().min(1, { message: "Token is required" }),
//   newPassword: z.string().min(6, { message: "New password must be at least 6 characters long" }),
// });

export const defaultSignInValues: SignInData = {
  email: "",
  password: "",
};

export const defaultSignUpValues: SignUpData = {
  email: "",
  name: "",
  password: "",
};

// export const defaultForgotPasswordValues: ForgotPasswordData = {
//   email: "",
// };

// export const defaultResetPasswordValues: ResetPasswordData = {
//   token: "",
//   newPassword: "",
// };


export type SignInData = z.infer<typeof schemaSignIn>;
export type SignUpData = z.infer<typeof schemaSignUp>;
// export type ForgotPasswordData = z.infer<typeof schemaForgotPassword>;
// export type ResetPasswordData = z.infer<typeof schemaResetPassword>;