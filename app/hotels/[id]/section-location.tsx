import Image from "next/image";
import Link from "next/link";
import { fetchHotel } from "@/lib/actions/hotel";
import { fetchPoiCategoriesWithPlaces } from "@/lib/actions/hotel-poi";
import { MapPin, MapPinnedIcon, Info } from "lucide-react";


export default async function LocationSection({
  hotel,
  poiCategoriesWithPlaces
}: {
  hotel: NonNullable<Awaited<ReturnType<typeof fetchHotel>>>;
  poiCategoriesWithPlaces: Awaited<ReturnType<typeof fetchPoiCategoriesWithPlaces>>;
}) {
  if (!hotel) {
    return null;
  }

  // const staticMapApiKey = process.env.GEOAPIFY_MAPS_API_KEY;
  // const staticMapWidth = 928;
  // const staticMapHeight = 300;
  // const staticMapSrc = `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=${staticMapWidth}&height=${staticMapHeight}&center=lonlat:${hotel.longitude},${hotel.latitude}&zoom=14&pitch=0&marker=lonlat:${hotel.longitude},${hotel.latitude};type:awesome;color:%23e01401&apiKey=${staticMapApiKey}`;
  const staticMapSrc = "https://placehold.co/928x300.webp?text=Static+Map+Placeholder&font=Roboto&bg=E0E0E0&fg=757575";

  return (
    <section id="location" className="w-full flex flex-col">
      <div className="rounded-4xl px-4 py-5 flex flex-col gap-y-5 shadow-xl">
        <h2 className="font-bold text-[1.25rem]">Xung quanh {hotel.name} có gì</h2>
        <div className="flex gap-x-2 text-sm items-center">
          <MapPin className="size-4"/>
          <div> {
            hotel.ward.name + ", "
            + hotel.ward.district.name + ", "
            + hotel.ward.district.province.name
          } </div>
        </div>

        <div className="relative rounded-[2rem] w-full h-60 bg-gray-200 overflow-hidden">
          <Image
            src={staticMapSrc}
            alt=""
            fill
            className="absolute inset-0 object-cover w-full h-full z-0"
          />
          <Link href="#" className="absolute z-10 px-4 py-3 rounded-full font-semibold bg-primary-foreground text-primary bottom-2 right-2 flex gap-x-1">
            <span>Khám phá nhiều địa điểm hơn</span>
            <MapPinnedIcon className="size-6" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(poiCategoriesWithPlaces).map(([key, { icon: Icon, name, places }]) => (
            <div key={key} className="flex flex-col space-y-2">
              <div className="flex gap-x-2 items-center">
                <Icon className="size-6" />
                <div className="font-semibold">{name}</div>
              </div>
              <ul className="flex flex-col space-y-2 pl-8">
                {places.map(({ name, distance }) => (
                  <li key={name}>
                    <div className="flex justify-between">
                      <div>{name}</div>
                      <div>{distance}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex gap-x-2 text-sm font-bold items-center">
          <Info className="size-3.5"/>
          <div>
            Khoảng cách hiển thị dựa trên đường chim bay. Khoảng cách di chuyển thực tế có thể khác.          </div>
        </div>
      </div>
    </section>
  )
};