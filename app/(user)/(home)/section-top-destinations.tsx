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

// TODO: province id
const top_destinations = [
  {
    name: "Đà Nẵng",
    backgroundImage: bg_danang,
    id: "danang",
  },
  {
    name: "Nha Trang",
    backgroundImage: bg_nhatrang,
    id: "nhatrang",
  },
  {
    name: "Phú Quốc",
    backgroundImage: bg_phuquoc,
    id: "phuquoc",
  },
  {
    name: "Vũng Tàu",
    backgroundImage: bg_vungtau,
    id: "vungtau",
  },
  {
    name: "Hà Nội",
    backgroundImage: bg_hanoi,
    id: "hanoi",
  },
  {
    name: "Đà Lạt",
    backgroundImage: bg_dalat,
    id: "dalat",
  },
  {
    name: "Hội An",
    backgroundImage: bg_hoian,
    id: "hoian",
  },
  {
    name: "Phan Thiết",
    backgroundImage: bg_phanthiet,
    id: "phanthiet",
  },
  {
    name: "Quy Nhơn",
    backgroundImage: bg_quynhon,
    id: "quynhon",
  },
  {
    name: "Huế",
    backgroundImage: bg_hue,
    id: "hue",
  },
  {
    name: "Hồ Chí Minh",
    backgroundImage: bg_hochiminh,
    id: "hochiminh",
  },
  {
    name: "Hạ Long",
    backgroundImage: bg_halong,
    id: "halong",
  },
];

export default function TopDestinationsSection () {
  return (
    <section className="flex flex-col gap-y-6 content">
      <h2 className="text-[26px] font-bold"> Ưu đãi khách sạn tốt nhất tại các điểm đến phổ biến </h2>
      <div className="flex justify-center">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
          {top_destinations.map(dest => (
            <div key={dest.id} className="group relative rounded-[10px] overflow-hidden flex flex-col hover:cursor-pointer h-40">
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
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}