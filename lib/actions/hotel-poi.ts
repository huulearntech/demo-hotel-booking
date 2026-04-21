import {
  LucideFerrisWheel,
  Store,
  ForkKnifeCrossed,
  BusFront,
  TreePalm,
  type LucideIcon
} from "lucide-react";

const poiCategories = [
  "entertainment",
  "catering",
  "commercial.shopping_mall",
  "leisure",
  "public_transport",
] as const;

const poiIcons: Record<PoiType, LucideIcon> = {
  entertainment: LucideFerrisWheel,
  catering: ForkKnifeCrossed,
  "commercial.shopping_mall": Store,
  leisure: TreePalm,
  public_transport: BusFront,
};

const poiTitles: Record<PoiType, string> = {
  catering: "Nhà hàng và quán ăn",
  entertainment: "Trung tâm giải trí",
  "commercial.shopping_mall": "Trung tâm mua sắm",
  leisure: "Điểm đến thư giãn",
  public_transport: "Giao thông công cộng",
};

type PoiType = (typeof poiCategories)[number];

function formatDistanceMeterToReadable(distanceMeter: number) {
  if (distanceMeter < 1000) {
    return `${Math.round(distanceMeter)} m`;
  } else {
    return `${(distanceMeter / 1000).toFixed(1)} km`;
  }
}

export async function fetchPoiCategoriesWithPlaces(
  lon: number,
  lat: number,
  limit = 10,
  radius = 2000
) {
  const key = process.env.GEOAPIFY_MAPS_API_KEY;
  if (!key) { throw new Error("GEOAPIFY_MAPS_API_KEY is not defined"); }

  const params = new URLSearchParams({
    categories: poiCategories.join(","),
    filter: `circle:${lon},${lat},${radius}`,
    bias: `proximity:${lon},${lat}`,
    limit: String(limit),
    lang: "vi",
    apiKey: key,
  });
  const url = `https://api.geoapify.com/v2/places?${params.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const features = ((data.features || []) as any[])
      .filter(f => !!f.properties.name && !!f.properties.distance)
      .map((f) => ({
        name: f.properties.name as string,
        distance: f.properties.distance as number,
        categories: (f.properties.categories || []) as string[],
        housenumber: f.properties.housenumber as string | undefined,
        street: f.properties.street as string | undefined,
        district: f.properties.district as string | undefined,
      }));
    const categorizedPois: Record<PoiType, { name: string; distance: string, address: string }[]> = {
      entertainment: [],
      catering: [],
      "commercial.shopping_mall": [],
      leisure: [],
      public_transport: [],
    };

    features.forEach(({ name, distance, categories, housenumber, street, district }) => {
      const category = categories.find((c) => poiCategories.includes(c as PoiType)) as PoiType | undefined;
      if (category) {
        categorizedPois[category].push({
          name,
          distance: formatDistanceMeterToReadable(distance),
          address: [housenumber, street, district].filter(Boolean).join(", "),
        });
      }
    });

    return Object.entries(categorizedPois).map(([key, places]) => ({
      key,
      icon: poiIcons[key as PoiType],
      name: poiTitles[key as PoiType],
      places,
    })).filter(c => c.places.length > 0);
  } catch {
    return [];
  }
}