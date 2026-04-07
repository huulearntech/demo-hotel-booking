"use client";

import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  schema_filterForm,
  FilterFormValues,
  defaultFilterValues,
} from "@/lib/zod_schemas/filter";

export function FilterFormProvider({ children }: { children: React.ReactNode }) {
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(schema_filterForm),
    defaultValues: defaultFilterValues,
    mode: "onChange",
  });

  return (
    <FormProvider {...form}>
      {children}
    </FormProvider>
  );
}

export function useFilterForm() {
  const context = useFormContext<FilterFormValues>();
  if (!context) {
    throw new Error("useFilterForm must be used within a FilterFormProvider");
  }
  return context;
}