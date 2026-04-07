"use client";

import { ListFilter } from "lucide-react";
import { useFilterSheetSetOpen } from "./filter-sheet-context";
import { Button } from "@/components/ui/button";

export default function ButtonOpenFilterSheet({ children }: { children?: React.ReactNode }) {
  const setFilterSheetOpen = useFilterSheetSetOpen();

  return (
    <Button
      onClick={() => setFilterSheetOpen(true)}
      variant='outline'
      className="size-8 flex lg:hidden items-center justify-center"
      aria-label="Open filter sheet"
    >
      <ListFilter className="size-4" />
      {children}
    </Button>
  );
}