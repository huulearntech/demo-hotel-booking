"use client";

import { ListFilter } from "lucide-react";
import { useFilterSheetSetOpen } from "./filter-sheet-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ButtonOpenFilterSheet({
  children,
  className,
}: {
  children?: React.ReactNode,
  className?: string
}) {
  const setFilterSheetOpen = useFilterSheetSetOpen();

  return (
    <Button
      onClick={() => setFilterSheetOpen(true)}
      variant='outline'
      className={cn("size-8 flex items-center justify-center", className)}
      aria-label="Open filter sheet"
    >
      <ListFilter className="size-4" />
      {children}
    </Button>
  );
}