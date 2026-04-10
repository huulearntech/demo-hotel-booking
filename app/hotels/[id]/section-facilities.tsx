import {
  Accessibility,
  AirVent,
  Bed,
  Building2,
  CarTaxiFront,
  ForkKnifeCrossed,
  Store,
  Wifi,
  type LucideIcon,
} from "lucide-react";

import type { FacilityType } from "@/lib/generated/prisma/client";
import { fetchHotel } from "@/lib/actions/hotel";

const categoryToNameAndIcon: Record<FacilityType, { name: string; icon: LucideIcon }> = {
  HOTEL_SERVICES: { name: "Dịch vụ khách sạn", icon: Bed },
  PUBLIC: { name: "Tiện nghi chung", icon: Building2 },
  FOOD_AND_DRINK: { name: "Ẩm thực", icon: ForkKnifeCrossed },
  IN_ROOM: { name: "Tiện nghi phòng", icon: Bed },
  ACCESSIBILITY: { name: "Hỗ trợ người khuyết tật", icon: Accessibility },
  OTHER: { name: "Tiện nghi khác", icon: Building2 },
};

export default function FacilitiesSection({ hotel }: { hotel: NonNullable<Awaited<ReturnType<typeof fetchHotel>>> }) {
  const { facilities = [] } = hotel;

  const facilitiesByType = facilities.reduce<Record<FacilityType, string[]>>((acc, f) => {
    const t = f.type;
    acc[t] = acc[t] ?? [];
    acc[t].push(f.name);
    return acc;
  }, {} as Record<FacilityType, string[]>);

  const nonEmptyFacilitiesAndIconByType = (Object.keys(categoryToNameAndIcon) as FacilityType[]).map((type) => {
    const meta = categoryToNameAndIcon[type];
    const Icon = meta.icon;
    return {
      type,
      name: meta.name,
      icon: <Icon className="w-5 h-5" />,
      facilities: facilitiesByType[type] ?? [],
    };
  }).filter((c) => c.facilities.length > 0);

  return (
    <section id="facilities" className="w-full flex flex-col">
      <div className="rounded-4xl px-4 py-5 flex flex-col gap-y-5 shadow-xl">
        <h2 className="font-bold text-[1.25rem]"> Tất cả những tiện ích tại {hotel.name} </h2>

        {nonEmptyFacilitiesAndIconByType.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nonEmptyFacilitiesAndIconByType.map((category, index) => (
              <div key={index} className="flex flex-col gap-y-3">
                <div className="flex items-center gap-x-2">
                  {category.icon}
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                </div>
                <ul className="list-disc list-inside flex flex-col gap-y-1">
                  {category.facilities.map((facility, idx) => (
                    <li key={idx} className="text-sm">
                      {facility}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Không có tiện ích nào được liệt kê.</p>
        )}
      </div>
    </section>
  )
}