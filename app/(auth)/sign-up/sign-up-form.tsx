"use client";

import Link from "next/link";
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
import { CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Loader2Icon } from "lucide-react";


export default function SignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignUpData>({
    resolver: zodResolver(schemaSignUp),
    defaultValues: defaultSignUpValues,
  });

  const onSubmit = (data: SignUpData) => {
    startTransition(async () => {
      const { success, errors } = await signUpUser(data);
      if (success) {
        router.push(PATHS.signIn);
      } else {
        const { fieldErrors, formErrors } = errors;
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
          <CardTitle> Chào mừng đến với Hoteloka </CardTitle>
          <CardDescription> Vui lòng điền thông tin của bạn để tạo tài khoản. </CardDescription>
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

        <div
          data-slot="field-separator"
          data-content="true"
          className="relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2 *:data-[slot=field-separator-content]:bg-card">
          <div
            data-orientation="horizontal"
            role="none"
            data-slot="separator"
            className="shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px absolute inset-0 top-1/2">
          </div>
          <span
            className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground"
            data-slot="field-separator-content">
            Hoặc đăng nhập với
          </span>
        </div>

        <CardFooter className="p-0 justify-center">
          <p className="text-sm leading-normal font-normal text-muted-foreground text-balance">
            {"Bạn đã có tài khoản? "}
            <Link
              href={PATHS.signIn}
              className="hover:underline underline-offset-2"
            >
              Đăng nhập ở đây.
            </Link>
          </p>
        </CardFooter>
      </form>
    </Form>
  );
};