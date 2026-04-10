// TODO: disclaimer chưa được hay lắm, cần chỉnh sửa lại sau
"use client";
import { createContext, useContext, useLayoutEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DisclaimerContextValue = {
  acknowledge: () => void;
};
const DisclaimerContext = createContext<DisclaimerContextValue | undefined>(
  undefined
);

export default function DisclaimerAlertDialog() {
  const ctx = useContext(DisclaimerContext);
  if (!ctx) {
    throw new Error(
      "DisclaimerAlertDialog must be used within a DisclaimerAlertDialogProvider"
    );
  }

  const { acknowledge } = ctx;

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>[VI]: Miễn trừ trách nhiệm</AlertDialogTitle>
        <AlertDialogDescription>
          Ứng dụng này được tạo ra nhằm mục đích trình diễn và không phải hệ thống thực tế. Dữ liệu trong ứng dụng này là dữ liệu mô phỏng, song có thể phát sinh sự trùng hợp ngẫu nhiên so với thực tế. Nhà phát triển không chịu trách nhiệm về tính chính xác của dữ liệu hoặc hậu quả phát sinh từ việc sử dụng ứng dụng này.
        </AlertDialogDescription>
        <AlertDialogTitle>[EN]: Disclaimer</AlertDialogTitle>
        <AlertDialogDescription>
          This application is created for demonstration purposes and is not a real system. The data in this application is simulated, and any resemblance to real data is purely coincidental. The developer is not responsible for the accuracy of the data or any consequences arising from the use of this application.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction className="btn" onClick={() => acknowledge()}>
          Tôi đã hiểu và đồng ý / I understand and agree
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

export function DisclaimerAlertDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    try {
      const hasAcknowledged = localStorage.getItem("disclaimerAcknowledged");
      if (!hasAcknowledged) {
        setOpen(true);
      }
    } catch {
      // ignore localStorage errors in restricted environments
      setOpen(true);
    }
  }, []);

  const acknowledge = () => {
    try {
      localStorage.setItem("disclaimerAcknowledged", "1");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  return (
    <DisclaimerContext.Provider value={{ acknowledge }}>
      <AlertDialog open={open} onOpenChange={setOpen}>
        {children}
      </AlertDialog>
    </DisclaimerContext.Provider>
  );
}