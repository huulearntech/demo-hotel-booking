"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { PATHS } from "@/lib/constants";
import { schemaSignIn, SignInData, defaultSignInValues } from "@/lib/zod_schemas/auth";
import { signInUserWithOptionalCallback } from "@/lib/actions/auth"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import PasswordInput from "@/components/password-input";
import { CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";


export default function SignInForm () {
  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || PATHS.home;

  const form = useForm<SignInData>({
    resolver: zodResolver(schemaSignIn),
    defaultValues: defaultSignInValues // Must be defined, otherwise it will complain.
  })

  const onSubmit = (data: SignInData) => {
    startTransition(async () => {
      const result = await signInUserWithOptionalCallback(data, callbackUrl);
      if (result?.error) {
        form.setError("root", { message: result.error });
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-7">
        <CardHeader className="p-0 text-center">
          <CardTitle> Chào mừng bạn trở lại </CardTitle>
          <CardDescription> Vui lòng đăng nhập để tiếp tục. </CardDescription>
        </CardHeader>

        <fieldset disabled={isPending} className="flex flex-col gap-y-7">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} autoFocus />
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
                <FormLabel> Mật khẩu </FormLabel>
                <FormControl>
                  <PasswordInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.formState.errors.root &&
            <p className="text-sm text-destructive"> {form.formState.errors.root.message} </p>
          }

          <Button type="submit">
            {form.formState.isSubmitting ?
              <>
                <Loader2Icon className="animate-spin" />
                Đang đăng nhập...
              </>
              :
              <> Đăng nhập </>
            }
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
          </div> 

          <CardFooter className="p-0 justify-center text-muted-foreground text-sm flex flex-col gap-2">
            <p className="leading-normal font-normal text-balance">
              {"Bạn chưa có tài khoản? "}
              <Link
                href={PATHS.signUp}
                className="hover:underline underline-offset-2"
              >
                Đăng ký ở đây.
              </Link>
            </p>
            <Link
              href={PATHS.forgotPassword}
              className="text-balance hover:underline underline-offset-2"
            >
              Bạn quên mật khẩu?
            </Link>
          </CardFooter>
        </fieldset>
      </form>
    </Form>
  )
};