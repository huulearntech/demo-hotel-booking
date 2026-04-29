"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { user_getIsHotelFavorited } from "@/lib/actions/user-account/favorites";
import { useFavoriteToggle } from "@/components/hotel-card";

const sections = {
  overview: "Tổng quan",
  available_rooms: "Phòng",
  location: "Vị trí",
  facilities: "Tiện ích",
  review: "Đánh giá",
};

type Section = keyof typeof sections;

export default function Navbar({ hotelId }: { hotelId: string }) {
  const [active, setActive] = useState<Section>("overview");
  const [isFavorited, setIsFavorited] = useState(false);
  const onToggleFavorite = useFavoriteToggle();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setActive(window.location.hash?.slice(1) as Section || "overview");

    const handleHash = () => setActive(window.location.hash?.slice(1) as Section || "overview");
    window.addEventListener("hashchange", handleHash);

    const anchorElements = Object.keys(sections)
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      () => {
        if (typeof window === "undefined") return;
        const candidates = anchorElements
          .map((el) => ({ el, top: el.getBoundingClientRect().top }))
          .filter((c) => c.top <= 128); // height of navbar

        if (candidates.length == 0) {
          setActive("overview");
        } else {
          setActive(candidates[candidates.length-1].el.id as Section);
        }
      },
      {
        rootMargin: "0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    anchorElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", handleHash);
    };
  }, []);

  useEffect(() => {
    // fetch initial favorited state
    let mounted = true;
    (async () => {
      const response = await user_getIsHotelFavorited(hotelId);
      if (mounted) {
        setIsFavorited(response);
      }
    })();
    return () => { mounted = false; };
  }, [hotelId]);

  return (
    <nav className="content flex justify-between items-center">
      <ul className="flex gap-x-5 font-bold text-sm">
        {Object.entries(sections).map(([id, label]) => (
          <li key={id} className={cn(
            "pb-1 border-b-2 hover:text-primary hover:border-primary",
            active === id
              ? "text-primary border-primary"
              : "text-gray-500 border-none"
          )}>
            <a
              href={`#${id}`}
              aria-current={active === id ? "page" : undefined}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-pressed={isFavorited}
          aria-label={isFavorited ? "Bỏ yêu thích" : "Thêm vào mục Yêu thích"}
          aria-describedby={`fav-status-${hotelId}`}
          onClick={() => onToggleFavorite(hotelId, isFavorited, setIsFavorited)}
          className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <Heart
        aria-hidden="true"
        className={cn(
          "size-5 transition-all hover:scale-110",
          isFavorited ? "text-red-500 fill-current" : "text-primary"
        )}
          />
        </button>

        {/* Live region for screen readers to announce state changes */}
        <span id={`fav-status-${hotelId}`} className="sr-only" aria-live="polite">
          {isFavorited ? "Đã thêm vào mục Yêu thích" : "Đã bỏ khỏi mục Yêu thích"}
        </span>

        {/* Visible label for sighted users */}
        <span className="text-sm text-primary hidden sm:block">
          {isFavorited ? "Đã thêm vào mục Yêu thích" : "Thêm vào mục Yêu thích"}
        </span>
      </div>
    </nav>
  );
}