import Image from "next/image";
import { tvlk_logo_text_dark } from "@/public/logos";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex items-center justify-center h-screen bg-accent">
      <div className="flex flex-col md:flex-row items-center justify-between bg-white shadow-md rounded-lg p-8 gap-8 w-full max-w-md md:max-w-2xl lg:max-w-3xl">
        <div className="flex flex-col items-center justify-center gap-y-2 content">
          <Image src={tvlk_logo_text_dark} alt="hoteloka" className="w-64 mx-auto" />
          <div className="text-2xl sm:text-3xl text-gray-700 font-medium">
            Business
          </div>
        </div>
        <div className="w-full">
          {children}
        </div>
      </div>
    </main>
  );
}