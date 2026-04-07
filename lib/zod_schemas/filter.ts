import { z } from "zod";

import { FILTER_MAX_PRICE, FILTER_MIN_PRICE } from "@/lib/constants";

export const FILTER_CATEGORIES = {
  // amenities should be dynamically generated based on the actual amenities available in the hotels, but for simplicity we hardcode some common ones here.
  // or just stick with the hard-coded ones.
  // because if the options are too tweaky, it is impossible to have consistent UX
  // when user goes from one page to another, or from one location to another.
  // the filter should still be there.
  amenities: { label: "Tiện nghi", options: ["WiFi", "Parking", "Pool", "Gym"] },
  propertyTypes: { label: "Loại hình lưu trú", options: ["Apartment", "House", "Villa"] },
  ratings: { label: "Đánh giá", options: ["1 sao", "2 sao", "3 sao", "4 sao", "5 sao"] },
} as const;

export const schema_filterForm = z.object({
  priceRange: z.tuple([z.number().min(0), z.number().min(0)]),
  sortBy: z.enum(["priceAsc", "priceDesc", "ratingAsc", "ratingDesc"]),
  amenities: z.array(z.enum(FILTER_CATEGORIES.amenities.options)),
  propertyTypes: z.array(z.enum(FILTER_CATEGORIES.propertyTypes.options)),
  ratings: z.array(z.enum(FILTER_CATEGORIES.ratings.options)),
});

export type FilterFormValues = z.infer<typeof schema_filterForm>;

export const defaultFilterValues: FilterFormValues = {
  priceRange: [FILTER_MIN_PRICE, FILTER_MAX_PRICE],
  sortBy: "priceAsc",
  amenities: [],
  propertyTypes: [],
  ratings: [],
};