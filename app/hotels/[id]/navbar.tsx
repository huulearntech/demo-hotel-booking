"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const sections = {
  overview: "Tổng quan",
  available_rooms: "Phòng",
  location: "Vị trí",
  facilities: "Tiện ích",
  review: "Đánh giá",
};

type Section = keyof typeof sections;

export default function Navbar() {
  const [active, setActive] = useState<Section>("overview");

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
          .filter((c) => c.top <= window.innerHeight / 2);

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

  return (
    <nav className="content">
      <ul className="w-full flex gap-x-5 font-bold text-sm">
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
    </nav>
  );
}