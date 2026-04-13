import Image from 'next/image';
import {
  iata,
  bst,
  bct,
  tvlk_logo_text_light,
  facebook,
  instagram,
  tiktok,
  youtube,
  telegram,
} from '@/public/logos';
import {
  mastercard, visa, jcb, amex, vietqr,
  momo, techcombank, vp, vib, vietcombank,
  onepay, mb, hsbc, sacombank, acb,
  tpbank, vietinbank, bidv, citibank, alepay,
} from "@/public/logos/payment-partners";

const paymentPartners = [
  mastercard, visa, jcb, amex, vietqr,
  momo, techcombank, vp, vib, vietcombank,
  onepay, mb, hsbc, sacombank, acb,
  tpbank, vietinbank, bidv, citibank, alepay,
]

const socialMedia = {
  "Facebook": facebook,
  "Instagram": instagram,
  "Tiktok": tiktok,
  "Youtube": youtube,
  "Telegram": telegram,
}

const about = [
  "Cách đặt chỗ",
  "Liên hệ chúng tôi",
  "Trợ giúp",
  "Tuyển dụng",
  "Về chúng tôi",
]

const products = [
  "Khách sạn",
  "Vé máy bay",
  "Vé xe khách",
  "Đưa đón sân bay",
  "Cho thuê xe",
  "Hoạt động & vui chơi",
  "Du thuyền",
  "Biệt thự",
  "Căn hộ",
]


export default function Footer() {
  return (
    <footer className="w-full bg-gray-800 flex flex-col justify-center items-center text-white">
      <div className="flex flex-col lg:flex-row content justify-between pt-14 pb-4">
        <div className="flex flex-col space-y-4 lg:w-[35%]">
          <div>
            <Image src={tvlk_logo_text_light} alt="Traveloka Logo" />
            <div className="inline-flex space-x-4">
              <Image src={iata} alt="IATA Logo" className="h-auto"/>
              <Image src={bst} alt="BST Logo" className="h-auto"/>
              <Image src={bct} alt="BCT Logo" className="h-auto"/>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2">Đối tác thanh toán</h3>
            <ul className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2">
              {paymentPartners.map((src, index) => (
                <li key={index} className="px-4 py-3 flex items-center justify-center rounded-md bg-white" >
                  <Image src={src} alt="" />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-bold mb-2 justify-between">Về Traveloka</h3>
          <ul className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:flex lg:flex-col lg:space-y-3 text-sm text-gray-300">
            {about.map((text, index) => (
              <li key={index} className="inline-flex space-x-2 items-center">
                <a href="#" className="hover:underline"> {text} </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <h3 className="font-bold mb-2 justify-between">Sản phẩm</h3>
          <ul className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:flex lg:flex-col lg:space-y-3 text-sm text-gray-300">
            {products.map((text, index) => (
              <li key={index} className="inline-flex space-x-2 items-center">
                <a href="#" className="hover:underline"> {text} </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <h3 className="font-bold mb-2 justify-between">Theo dõi chúng tôi trên</h3>
          <ul className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:flex lg:flex-col lg:space-y-3 text-sm text-gray-300">
            {Object.entries(socialMedia).map(([name, src], index) => (
              <li key={index} className="inline-flex space-x-2 items-center">
                <Image src={src} alt="" />
                <a href="#" className="hover:underline"> {name} </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <hr className="w-full my-4 border-gray-500" />
      <div className="text-sm mb-4 text-center">
        <p>Demo website made by Huu Trinh 2025</p>
      </div>
    </footer>
  );
};