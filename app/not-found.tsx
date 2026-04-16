import Link from "next/link";
import Image from "next/image";
import { PATHS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Frown, ArrowLeft } from "lucide-react";
import { tvlk_logo_text_dark } from "@/public/logos";

export const metadata = {
  title: "404 Not Found",
  description: "The requested resource could not be found.",
};

export default function NotFound () {
  return (
    <main className="flex h-screen items-center justify-center bg-accent">
      <div className="flex flex-col md:flex-row items-center justify-between bg-white shadow-md rounded-lg p-8 gap-8 w-full max-w-md md:max-w-3xl">
        <div className="w-full">
          <Image
            src={tvlk_logo_text_dark}
            alt="Logo"
            className="w-64 mx-auto"
          />
        </div>
        <div className="w-full flex flex-col items-center justify-center space-y-4">
          <Frown className="h-10 w-10" />
          <h2 className="text-xl font-semibold">404 Not Found</h2>
          <p>Không tìm thấy tài nguyên này.</p>
          <Button asChild>
            <Link href={PATHS.home} >
              <ArrowLeft className="mr-2" /> Trở về trang chủ
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}