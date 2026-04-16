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


const top_destinations = [
  {
    name: "Đà Nẵng",
    backgroundImage: bg_danang,
    id: "danang",  // TODO: province id
  },
  {
    name: "Nha Trang",
    backgroundImage: bg_nhatrang,
    id: "nhatrang",  // TODO: province id
  },
  {
    name: "Phú Quốc",
    backgroundImage: bg_phuquoc,
    id: "phuquoc",  // TODO: province id
  },
  {
    name: "Vũng Tàu",
    backgroundImage: bg_vungtau,
    id: "vungtau",  // TODO: province id
  },
  {
    name: "Hà Nội",
    backgroundImage: bg_hanoi,
    id: "hanoi",  // TODO: province id
  },
  {
    name: "Đà Lạt",
    backgroundImage: bg_dalat,
    id: "dalat",  // TODO: province id
  },
  {
    name: "Hội An",
    backgroundImage: bg_hoian,
    id: "hoian",  // TODO: province id
  },
  {
    name: "Phan Thiết",
    backgroundImage: bg_phanthiet,
    id: "phanthiet",  // TODO: province id
  },
  {
    name: "Quy Nhơn",
    backgroundImage: bg_quynhon,
    id: "quynhon",  // TODO: province id
  },
  {
    name: "Huế",
    backgroundImage: bg_hue,
    id: "hue",  // TODO: province id
  },
  {
    name: "Hồ Chí Minh",
    backgroundImage: bg_hochiminh,
    id: "hochiminh",  // TODO: province id
  },
  {
    name: "Hạ Long",
    backgroundImage: bg_halong,
    id: "halong",  // TODO: province id
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
              <div className="absolute top-0 left-0 px-3 py-2 text-white bg-primary/50 rounded-br-[10px]">
                <h3 className="lg:text-base font-semibold whitespace-pre-wrap wrap-break-word">{dest.name}</h3>
              </div>
              <div className="absolute bottom-0 group-hover:bottom-8 opacity-0 group-hover:opacity-100 transition-all duration-300
             text-white border border-white bg-primary/50 rounded-[10px] px-4 py-2 text-xs text-center font-semibold left-1/2 -translate-x-1/2">
                Xem thêm chỗ nghỉ
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}