import Image from "next/image";
import {
  bg_dalat,
  bg_danang,
  bg_halong,
  bg_hanoi,
  bg_hochiminh,
  bg_hoian,
  bg_hue,
  bg_nhatrang,
  bg_phanthiet,
  bg_phuquoc,
  bg_quynhon,
  bg_vungtau,
} from "@/public/images";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { DEFAULT_SEARCH_BAR_VALUES, PATHS } from "@/lib/constants";
import { codec_SearchSpecWithoutLocation_Params } from "@/lib/zod_schemas/search-bar";


const top_destinations_provinces = [
  {
    name: "Đà Nẵng",
    backgroundImage: bg_danang,
    code: "48",
    type: "province"
  },
  {
    name: "Hà Nội",
    backgroundImage: bg_hanoi,
    code: "01",
    type: "province"
  },
  {
    name: "Hồ Chí Minh",
    backgroundImage: bg_hochiminh,
    code: "79",
    type: "province",
  },
];

const top_destinations_districts = [
  {
    name: "Huế",
    backgroundImage: bg_hue,
    type: "province",
    code: "474",
  },
  {
    name: "Vũng Tàu",
    backgroundImage: bg_vungtau,
    type: "vungtau",
    code: "747"
  },
  {
    name: "Nha Trang",
    backgroundImage: bg_nhatrang,
    code: "568",
    type: "district"
  },
  {
    name: "Phan Thiết",
    backgroundImage: bg_phanthiet,
    code: "593",
    type: "district"
  },
  {
    name: "Phú Quốc",
    backgroundImage: bg_phuquoc,
    code: "911",
    type: "district"
  },
  {
    name: "Đà Lạt",
    backgroundImage: bg_dalat,
    code: "672",
    type: "district"
  },
  {
    name: "Hội An",
    backgroundImage: bg_hoian,
    code: "503",
    type: "district"
  },
  {
    name: "Quy Nhơn",
    backgroundImage: bg_quynhon,
    code: "540",
    type: "district"
  },
  {
    name: "Hạ Long",
    backgroundImage: bg_halong,
    code: "193",
    type: "district"
  },
];

export default async function TopDestinationsSection () {
  const top_provinces = await prisma.province.findMany({
    where: {
      code: {
        in: top_destinations_provinces.map(dest => dest.code)
      }
    },
    select: {
      id: true,
      code: true,
    }
  }).then(provinces => {
    const provinceIdByCode = provinces.reduce((acc, province) => {
      acc[province.code] = province.id;
      return acc;
    }, {} as Record<string, string>);

    return top_destinations_provinces.map(dest => ({
      ...dest,
      id: provinceIdByCode[dest.code],
    }));
  });


  const top_districts = await prisma.district.findMany({
    where: {
      code: {
        in: top_destinations_districts.map(dest => dest.code)
      }
    },
    select: {
      id: true,
      code: true,
    }
  }).then(districts => {
    const districtIdByCode = districts.reduce((acc, district) => {
      acc[district.code] = district.id;
      return acc;
    }, {} as Record<string, string>);

    return top_destinations_districts.map(dest => ({
      ...dest,
      id: districtIdByCode[dest.code],
    }));
  });

  const destinations = [...top_provinces, ...top_districts];

  const { location, ...defaultSpecWithoutLocation } = DEFAULT_SEARCH_BAR_VALUES;
  
  return (
    <section className="flex flex-col gap-y-6 content">
      <h2 className="text-[26px] font-bold"> Ưu đãi khách sạn tốt nhất tại các điểm đến phổ biến </h2>
      <div className="flex justify-center">
        <ul className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
          {destinations.map(dest => (
            <li key={dest.id} className="group relative rounded-[10px] overflow-hidden flex flex-col hover:cursor-pointer h-40">
              <Link href={{
                pathname: PATHS.search,
                query: {
                  locationId: dest.id,
                  locationType: dest.type,
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