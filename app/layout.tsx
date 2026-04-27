import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SessionProvider } from 'next-auth/react';
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TanstackQueryProvider } from "./tanstack-query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import DisclaimerAlertDialog, { DisclaimerAlertDialogProvider } from "@/components/disclaimer-alert-dialog";
import { FavoriteToggleProvider } from "@/components/hotel-card";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hoteloka - Đặt phòng khách sạn",
  description: "Đây là một dự án nhằm mục đích minh hoạ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        />
      </head>

      <body className={cn(geistSans.variable, geistMono.variable, "antialiased bg-white")}>
        <SessionProvider refetchOnWindowFocus={false}>
          <FavoriteToggleProvider>
            <TanstackQueryProvider>
              <TooltipProvider>
                <DisclaimerAlertDialogProvider>
                  {children}
                  <DisclaimerAlertDialog />
                </DisclaimerAlertDialogProvider>
              </TooltipProvider>
            </TanstackQueryProvider>
          </FavoriteToggleProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
