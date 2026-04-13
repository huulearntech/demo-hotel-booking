"use client";

import Image, { StaticImageData } from "next/image";
import * as hotel_partner_logos from "@/public/logos/hotel-partners";
import * as payment_partner_logos from "@/public/logos/payment-partners";

export default function PartnersSection() {
  return (
    <>
      <section className="flex flex-col justify-center gap-y-4 content">
        <h4 className="text-2xl font-bold">Đối tác khách sạn</h4>
        <p className="text-sm">Khách sạn trong nước và quốc tế</p>
        <p>
          Chúng tôi hợp tác với các chuỗi khách sạn trên toàn thế giới để bảo đảm mang lại kỳ nghỉ tuyệt vời nhất tại mọi điểm đến trong mơ của bạn!
        </p>

        <ScrollingLogos logos={Object.values(hotel_partner_logos)} pixelsPerSecond={50} />
      </section>

      <section className="flex flex-col justify-center gap-y-4 content">
        <h4 className="text-2xl font-bold">Đối tác thanh toán</h4>
        <p>
          Những đối tác thanh toán đáng tin cậy của chúng tôi sẽ giúp cho bạn luôn an tâm thực hiện mọi giao dịch một cách thuận lợi nhất!
        </p>

        <ScrollingLogos logos={Object.values(payment_partner_logos)} pixelsPerSecond={50} />
      </section>
    </>
  );
}

const ScrollingLogos = ({
  logos,
  pixelsPerSecond = 1
}: {
  logos: StaticImageData[];
  pixelsPerSecond?: number
}) => {
  // duplicate logos to make a seamless loop
  const items = [...logos, ...logos];
  const itemWidth = 120;
  const pixels = items.length * itemWidth;
  const durationSeconds = pixels / pixelsPerSecond;

  return (
    <div className="w-full overflow-hidden">
      <div
        className="flex items-center gap-4 will-change-transform animate-scroll-infinite-loop w-max"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {items.map((logo, index) => (
          <div
            key={index}
            className="h-10 flex items-center shrink-0"
            style={{ width: itemWidth }}
          >
            <Image src={logo} alt="" className="object-contain m-auto w-auto h-auto max-w-full max-h-full" />
          </div>
        ))}
      </div>
    </div>
  );
};