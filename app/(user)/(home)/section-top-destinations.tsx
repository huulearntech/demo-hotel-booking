import Image, { type StaticImageData } from "next/image";
import {
  bg_danang,
  bg_halong,
  bg_hanoi,
  bg_hochiminh,
  bg_hue,
  bg_nhatrang,
} from "@/public/images";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { DEFAULT_SEARCH_BAR_VALUES, PATHS } from "@/lib/constants";
import { codec_SearchSpecWithoutLocation_Params } from "@/lib/zod_schemas/search-bar";

type TopProvince = {
  id: string;
  code: string;
  type: string;
  name: string;
  backgroundImage: StaticImageData;
};

const top_province_codes_and_bg: Record<string, StaticImageData> = {
  "01": bg_hanoi,
  "22": bg_halong,
  "46": bg_hue,
  "48": bg_danang,
  "56": bg_nhatrang,
  "79": bg_hochiminh,
};

export default async function TopDestinationsSection () {
  const top_provinces: TopProvince[] = await prisma.province.findMany({
    where: {
      code: {
        in: Object.keys(top_province_codes_and_bg)
      }
    },
    select: {
      id: true,
      code: true,
      type: true,
      name: true,
    }
  }).then(provinces => {
    const provinceByCode = provinces.reduce((acc, province) => {
      acc[province.code] = province;
      return acc;
    }, {} as Record<string, { id: string; code: string; type: string; name: string }>);

    return Object.entries(top_province_codes_and_bg).map(([code, backgroundImage]) => {
      const province = provinceByCode[code];
      return {
        id: province.id,
        code: province.code,
        type: province.type,
        name: province.name,
        backgroundImage,
      } as TopProvince;
    });
  });


  const { location, ...defaultSpecWithoutLocation } = DEFAULT_SEARCH_BAR_VALUES;
  
  return (
    <section className="flex flex-col gap-y-6 content">
      <h2 className="text-[26px] font-bold"> Ưu đãi khách sạn tốt nhất tại các điểm đến phổ biến </h2>
      <div className="flex justify-center">
        <ul className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
          {top_provinces.map(dest => (
            <li key={dest.id} className="group relative rounded-[10px] overflow-hidden flex flex-col hover:cursor-pointer h-40">
              <Link href={{
                pathname: PATHS.search,
                query: {
                  locationId: dest.id,
                  locationType: "province",
                  ...codec_SearchSpecWithoutLocation_Params.encode(defaultSpecWithoutLocation)
                }
              }} className="absolute inset-0 z-10" />
              <Image
                src={dest.backgroundImage}
                alt=""
                className="absolute object-cover inset-0 w-full h-full group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 duration-300"></div>
              <div className="absolute top-0 left-0 right-0 p-3 text-white">
                <h3 className="font-semibold whitespace-pre-wrap wrap-break-word">{dest.name}</h3>
              </div>
              <div className="absolute bottom-0 group-hover:bottom-8 opacity-0 group-hover:opacity-100 duration-300
             text-white border border-white rounded-[10px] px-4 py-2 text-xs text-center font-semibold left-1/2 -translate-x-1/2">
                Xem thêm chỗ nghỉ
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}