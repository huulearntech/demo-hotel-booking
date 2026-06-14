"use client";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <Button variant="outline" onClick={handlePrint} className="flex-1">
      In hóa đơn
    </Button>
  );
}