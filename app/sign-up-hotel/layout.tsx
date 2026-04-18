import Image from "next/image";
import { tvlk_logo_text_dark } from "@/public/logos";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="w-full h-20 z-60 bg-white shadow-md sticky top-0">
        <div className="flex h-full justify-between items-center content">
          <div className="flex items-center">
            <Image src={tvlk_logo_text_dark} alt="hoteloka" />
            <div className="h-10 w-px bg-gray-200 mx-3"></div>
            <div className="text-2xl text-gray-700 font-medium">
              Business
            </div>
          </div>
          <div className="flex items-center gap-16">
            {/** TODO: Stepper */}
            Stepper go here
          </div>
        </div>
      </header>

      {children}
    </>
  );
}