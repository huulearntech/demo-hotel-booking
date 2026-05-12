import { z } from "zod";

import { FILTER_MAX_PRICE, FILTER_MIN_PRICE, MAX_RATING } from "@/lib/constants";
import { HotelType } from "@/lib/generated/prisma/enums";

// define value tuples for zod enums
const AMENITY_VALUES = ["wifi", "parking", "pool", "gym"] as const;

export const FILTER_CATEGORIES = {
  propertyTypes: {
    label: "Loại hình lưu trú",
    options: Object.values(HotelType).map((v) => ({ value: v, label: String(v).charAt(0).toUpperCase() + String(v).slice(1).toLowerCase() })),
  } as const,
  amenities: {
    label: "Tiện nghi",
    options: [
      { value: AMENITY_VALUES[0], label: "WiFi" },
      { value: AMENITY_VALUES[1], label: "Parking" },
      { value: AMENITY_VALUES[2], label: "Pool" },
      { value: AMENITY_VALUES[3], label: "Gym" },
    ] as const,
  },
} as const;

// rating 0 means "hotel has no ratings yet", so we allow rating range to start from 0
export const schema_filterForm = z.object({
  priceRange: z.tuple([z.number().min(100_000).max(20_000_000), z.number().min(100_000).max(20_000_000)]),
  ratingRange: z.tuple([z.number().min(0).max(5), z.number().min(0).max(5)]),
  sortBy: z.enum(["priceAsc", "priceDesc", "ratingAsc", "ratingDesc"]),
  amenities: z.array(z.enum(AMENITY_VALUES)),
  propertyTypes: z.array(z.enum(HotelType)),
});

export type FilterFormValues = z.infer<typeof schema_filterForm>;

export const defaultFilterValues: FilterFormValues = {
  priceRange: [FILTER_MIN_PRICE, FILTER_MAX_PRICE],
  ratingRange: [0, MAX_RATING],
  sortBy: "priceAsc",
  amenities: [],
  propertyTypes: [],
};