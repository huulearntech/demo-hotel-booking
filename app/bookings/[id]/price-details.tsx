"use client";

import Link from "next/link";
import { TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInformationForm  } from "./information-form-context";
import { BookingFormValues } from "@/lib/zod_schemas/booking";


export default function PriceDetail({
  snapshotRoomTypeName,
  snapshotRoomPrice,
  nights,
  numRooms,
  totalPrice, // Must be calculated on the server and passed in, to prevent weird stuffs.
}: {
  snapshotRoomTypeName: string;
  snapshotRoomPrice: number;
  nights: number;
  numRooms: number;
  totalPrice: number;
}) {
  const onSubmit = (data: BookingFormValues) => {
    // replace with real submit logic
    console.log("form submit", data);
  }
  const { handleSubmit } = useInformationForm();
  return (
    <div className="flex flex-col rounded-4xl bg-white shadow-lg">
      <div className="flex px-4 py-2 gap-x-3 items-center">
        <TagIcon className="size-5" />
        <h2 className="text-[1.25rem] font-semibold">Chi tiết giá</h2>
      </div>

      <div className="flex flex-col text-xs text-gray-500 font-semibold bg-blue-50 px-4 py-3 gap-y-4">
        <div className="flex justify-between">
          <div className="flex flex-col gap-y-1">
            <div>Giá phòng</div>
            <div>({numRooms}x) {snapshotRoomTypeName}</div>
          </div>
          <div>
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(snapshotRoomPrice)}
          </div>
        </div>
        <div className="flex justify-between">
          <div>Thời gian lưu trú</div>
          <div>{nights} đêm</div>
        </div>
      </div>
      <div className="flex justify-between p-4 bg-[linear-gradient(313.11deg,rgb(247,252,222)18.59%,rgb(255,255,255)89.04%)]">
        <div className="flex flex-col">
          <div className="text-sm font-semibold">Tổng cộng</div>
          <div className="text-sm text-gray-500">{numRooms} phòng, {nights} đêm</div>
        </div>

        <div className="font-semibold text-primary">
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(totalPrice)
          }
        </div>
      </div>

      <Button
        className="m-4 rounded-full h-12 font-semibold"
        onClick={handleSubmit(onSubmit)}
      >
        Tiếp tục
      </Button>
      <div className="text-xs text-gray-500 px-4 pb-4">
        {"Bằng cách tiến hành thanh toán, bạn đã đồng ý với "}
        <Link href="#" className="underline">Điều khoản và Điều kiện</Link>,
        <Link href="#" className="underline">Chính sách Bảo mật</Link>{", và "}
        <Link href="#" className="underline">Quy trình Hoàn tiền Lưu trú</Link>
        {" của Hoteloka."}
      </div>
    </div>
  )
}