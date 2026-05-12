"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { PATHS } from "@/lib/constants";
import { schemaSignUp, SignUpData, defaultSignUpValues } from "@/lib/zod_schemas/auth";
import { signUpUser } from "@/lib/actions/auth";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PasswordInput from "@/components/password-input";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Loader2Icon } from "lucide-react";
import { toast } from "sonner";


export default function HotelSignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignUpData>({
    resolver: zodResolver(schemaSignUp),
    defaultValues: defaultSignUpValues,
  });

  const onSubmit = (signupFormValues: SignUpData) => {
    startTransition(async () => {
      const response = await signUpUser(signupFormValues, true);
      if (response.success) {
        const verificationId = response.data.id;
        console.log("success")
        router.push(PATHS.otp + `/${verificationId}`);
      } else {
        // TODO: error handling.
        toast.error("Đăng ký thất bại. Vui lòng kiểm tra lại thông tin đã nhập.");
        console.log("failed", response.errors);
        const { fieldErrors, formErrors } = response.errors;
        Object.entries(fieldErrors).forEach(([fieldName, errorMessages]) => {
          if (errorMessages && errorMessages.length > 0) {
            form.setError(fieldName as keyof SignUpData, { message: errorMessages[0] });
          }
        });
        if (formErrors && formErrors.length > 0) {
          form.setError("root", { message: formErrors[0] });
        }
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-y-7"
      >
        <CardHeader className="p-0 text-center">
          <CardTitle>Đăng ký làm đối tác lưu trú với chúng tôi</CardTitle>
          <CardDescription> Điền vào mẫu dưới đây để bắt đầu quá trình đăng ký và trở thành một phần của mạng lưới lưu trú của chúng tôi. </CardDescription>
        </CardHeader>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} autoFocus/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Họ và tên</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <PasswordInput {...field} disabled={isPending}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <div className="flex items-center gap-2">
              Đang đăng ký...
              <Loader2Icon className="animate-spin" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              Đăng ký
              <ArrowRight />
            </div>
          )}
        </Button>
      </form>
    </Form>
  );
};