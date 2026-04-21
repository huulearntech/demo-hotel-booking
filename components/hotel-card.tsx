"use client";

import Image from "next/image";

import { cn, formatVND } from "@/lib/utils";
import { HotelCardProps } from "@/lib/types/hotel-card";

import { hotel as hotelIcon } from "@/public/icons/index";
import { MapPin, Heart } from "lucide-react";

export default function HotelCard({
  hotel,
  className,
  href,
  showWardAtTopLeft = true,
}: {
  hotel: HotelCardProps;
  className?: string
  href: string;
  showWardAtTopLeft?: boolean;
}) {
  const {
    id,
    name,
    imageUrls: [thumbUrl],
    rating,
    numberOfReviews,
    ward: { name: wardName, district: { province: { name: provinceName } } },
    roomTypes: [{ price }],
    facilities,
    type
  } = hotel;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn("bg-white w-full min-h-106 flex flex-col rounded-lg shadow-md overflow-hidden hover:shadow-primary/50 hover:shadow-md", className)}
    >
      <div className="relative h-50 overflow-hidden">
        <Image
          src={thumbUrl}
          alt={name}
          className="absolute object-cover w-100 h-75 inset-0"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {showWardAtTopLeft &&
          <div className="absolute top-0 left-0 bg-black/40 text-primary-foreground inline-flex rounded-br-lg items-center px-2 py-1 text-sm font-semibold">
            <MapPin className="size-4 mr-1" />
            {wardName}
          </div>
        }
        <button
          className="absolute top-1 right-1 p-2 rounded-full bg-black/40 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            console.log("Add to favorites ", id);
          }}
        >
          <Heart className="size-4 text-primary-foreground" />
        </button>
      </div>

      <div className="flex flex-col justify-between px-3 py-2 flex-1">
        <div className="flex flex-col gap-y-1">
          <div className="flex gap-x-1">
            <h3 role="heading" className="grow font-bold line-clamp-2 overflow-hidden overflow-ellipsis">{name}</h3>
            <div className="flex flex-col items-end">
              <span className="text-xs font-black text-blue-950">{rating.toFixed(1)}</span>
              <span className="text-xs font-semibold">({numberOfReviews})</span>
            </div>
          </div>

          <div className="flex flex-wrap px-1 py-0.5 rounded items-center gap-x-1 bg-secondary w-fit">
            <Image src={hotelIcon} alt="" aria-hidden className="" />
            <span className="text-xs font-semibold text-primary lowercase first-letter:capitalize">{type}</span>
          </div>

          <div className='flex items-center space-x-1 ml-1'>
            <MapPin className="size-3" strokeWidth={3} />
            <span className="text-xs font-semibold whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
              {(!showWardAtTopLeft ? (wardName + ", ") : "") + provinceName}
            </span>
          </div>

          <Tooltip>
            <FacilityBadges facilities={facilities.map(f => f.name)} />
          </Tooltip>
        </div>

        <div className="flex justify-between items-end">
          <div className="font-bold text-primary">{formatVND(price)}</div>
          <button className="font-bold bg-primary text-primary-foreground px-3 py-2 rounded-[0.375rem] text-sm">
            Xem
          </button>
        </div>
      </div>
    </a>
  );
};

import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

// Use a simple estimation based on character count instead of measuring each DOM node.
// This avoids expensive layout reads and should be much faster.
function FacilityBadges({ facilities }: { facilities: string[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(facilities.length);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      setVisibleCount(facilities.length);
      return;
    }

    const containerWidth = container.clientWidth;

    // Estimation parameters (tweak if needed)
    const charWidth = 7; // average width per character in px for the small font
    const horizontalPadding = 8; // px for left+right padding (approx)
    const badgeExtra = 4; // extra space for rounding/border etc.
    const gap = 6; // gap between badges in px (matches tailwind spacing used)
    const moreBadgePadding = 12; // px for "+X" badge padding (a bit larger)

    // precompute widths
    const widths = facilities.map((f) => horizontalPadding + badgeExtra + f.length * charWidth);

    // width of a potential "+N" badge (digits depend on how many remain)
    const moreBaseWidth = (n: number) =>
      moreBadgePadding + String(n).length * charWidth + badgeExtra;

    let used = 0;
    let count = 0;

    for (let i = 0; i < widths.length; i++) {
      const w = widths[i];
      const gapBefore = i > 0 ? gap : 0;
      const remaining = facilities.length - (i + 1);

      const moreW = remaining > 0 ? moreBaseWidth(remaining) + gap : 0;

      const totalNeeded = used + gapBefore + w + moreW;

      if (totalNeeded > containerWidth) break;

      used += gapBefore + w;
      count++;
    }

    // Ensure at least 0 and at most facilities.length
    setVisibleCount(Math.max(0, Math.min(facilities.length, count)));
  }, [facilities.length]);

  return (
    <>
      <div ref={containerRef} aria-hidden className="flex items-center space-x-2 overflow-clip">
        {facilities.slice(0, visibleCount).map((facility) => (
          <span key={facility} className="shrink-0 text-[10px] font-semibold px-1 py-0.75 rounded-lg bg-gray-50">
            {facility}
          </span>
        ))}

        {visibleCount < facilities.length && (
          <TooltipTrigger aria-hidden className="shrink-0">
            <span className="shrink-0 text-[10px] font-semibold px-1 py-0.75 rounded-lg bg-gray-50">
              +{facilities.length - visibleCount}
            </span>
          </TooltipTrigger>
        )}
      </div>

      <TooltipContent aria-hidden className="flex flex-col gap-y-2">
        <span className="text-sm font-semibold mb-1 block">Cơ sở lưu trú này có các tiện ích:</span>
        <ul className="flex flex-col space-y-1">
          {facilities.map(facility => (
            <li key={facility} className="text-sm font-medium">
              <span> {facility} </span>
            </li>
          ))}
        </ul>
      </TooltipContent>
    </>
  );
}