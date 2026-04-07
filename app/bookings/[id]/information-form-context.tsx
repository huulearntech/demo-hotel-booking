"use client";

import { useForm, FormProvider, useFormContext, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  schema_bookingForm,
  BookingFormValues,
} from "@/lib/zod_schemas/booking";

export function InformationFormProvider({
  children,
  defaultValues
}: {
  children: React.ReactNode,
  defaultValues?: DefaultValues<BookingFormValues>
}) {
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(schema_bookingForm),
    defaultValues: defaultValues,
    mode: "onChange",
  });

  return (
    <FormProvider {...form}>
      {children}
    </FormProvider>
  );
}

export function useInformationForm() {
  const context = useFormContext<BookingFormValues>();
  if (!context) {
    throw new Error("useInformationForm must be used within a InformationFormProvider");
  }
  return context;
}