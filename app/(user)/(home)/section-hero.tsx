import Image from "next/image"
import SearchBar from "@/components/search-bar"
import { hero_image } from "@/public/images"
import beach from "@/public/images/beach.webp"

export default function HeroSection() {
  return (
    <section className="relative w-full h-[calc(100svh-5rem)] lg:h-auto">
      <div className="relative h-full w-full overflow-hidden lg:max-w-[min(95%,var(--container-7xl))] mx-auto lg:h-75 lg:rounded-4xl">
      <Image
        src={hero_image}
        alt=""
        aria-hidden
        fill
        className="absolute inset-0 object-cover hidden lg:block"
        sizes="(min-width: 1024px) 1232px, 100vw"
      />

      <Image
        src={beach}
        alt=""
        aria-hidden
        fill
        className="absolute inset-0 object-cover lg:hidden"
        sizes="100vw"
      />
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-1/2 lg:top-0 lg:left-0 lg:translate-0 lg:relative lg:-mt-30 content flex flex-col items-center max-w-9/10 xl:max-w-6xl">
        <div className="min-h-30 relative bg-black/50 w-full gap-y-1 rounded-4xl p-2 lg:p-4 lg:pb-0 lg:rounded-b-none lg:mb-20">
          <div className="m-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-white inline">
              <span>Đặt khách sạn giá tốt với Hoteloka</span>
            </h1>
            <h2 className="text-white text-sm sm:text-base">
              Khám phá nhiều lựa chọn từ khách sạn, biệt thự, resort và hơn thế nữa
            </h2>
          </div>
          <SearchBar className="bg-white text-primary placeholder:text-secondary p-4 lg:p-6 rounded-2xl lg:rounded-4xl border lg:absolute lg:inset-x-0" collapsible={false} />
        </div>
      </div>
    </section>
  )
};