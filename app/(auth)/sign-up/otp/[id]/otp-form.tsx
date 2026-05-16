"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2Icon, RotateCwIcon } from "lucide-react";
import { FormItem } from "@/components/ui/form";

import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resendOtpToEmail, user_verifyOTP } from "@/lib/actions/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PATHS } from "@/lib/constants";

const schema_otp = z.object({
  otp: z.string().length(6, "OTP phải có 6 chữ số").regex(/^\d+$/, "OTP chỉ được chứa chữ số"),
});
export default function OtpForm({ id, email, name }: { id: string, email: string, name: string }) {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema_otp>>({
    resolver: zodResolver(schema_otp),
    defaultValues: { otp: "" },
  });

  const onSubmit = async (data: z.infer<typeof schema_otp>) => {
    const result = await user_verifyOTP(id, data.otp, "REGISTRATION");
    if (result.success) {
      toast.success("Xác thực OTP thành công! Bạn đã có thể đăng nhập vào tài khoản của mình.");
      router.push(PATHS.signIn);
    }
    else {
      toast.error(result.message || "Xác thực OTP thất bại. Vui lòng thử lại.");
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await resendOtpToEmail(id, "REGISTRATION");
      router.replace(`${PATHS.otp}/${response.data.id}`);
      
    } catch (error) {
      toast.error("Gửi lại mã OTP thất bại. Vui lòng thử lại sau.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-7">
      <CardHeader className="p-0">
        <CardTitle className="text-center">
          Xin chào, {name}
        </CardTitle>
        <CardDescription>
          Vui lòng nhập mã xác thực mà chúng tôi đã gửi đến địa chỉ email của bạn: {email}.
        </CardDescription>
      </CardHeader>

      <FormItem>
        <div className="flex items-center justify-between">
          <Label htmlFor="otp-verification">
            Mã xác thực (OTP)
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={true}
            onClick={handleResendOtp}
          >
            <RotateCwIcon /> Gửi lại mã sau 
          </Button>
        </div>

        <Controller
          name="otp"
          control={control}
          render={({ field }) => {
            return (
              <InputOTP
                value={field.value}
                maxLength={6}
                id="otp-verification"
                required
                onChange={(value) => {
                  // NOTE: this code will delete the digit already in the slot if user try to input character.
                  const processed_value = value.replace(/\D/g, "").slice(0, 6);
                  field.onChange(processed_value);
                }}
                onBlur={field.onBlur}
                disabled={isSubmitting}
                autoFocus
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
              >
                <InputOTPGroup className="w-full justify-between gap-x-1 *:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            );
          }}
        />
        {errors.otp?.message && (
          <p className="text-xs text-red-600 mt-2">{String(errors.otp.message)}</p>
        )}
      </FormItem>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2Icon className="animate-spin" /> Đang xác thực...
          </>
        ) : (
          "Xác thực"
        )}
      </Button>
    </form>
  );
}