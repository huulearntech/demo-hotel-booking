"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { MailIcon } from "lucide-react";

import { useInformationForm } from "./information-form-context";

export default function InformationForm () {
  const { register, formState: { errors } } = useInformationForm();

  return (
    <form className="w-full h-fit flex flex-col rounded-4xl bg-white shadow-lg p-4 gap-y-4">
      <div className="flex flex-col gap-y-2">
        <div className="flex gap-x-2 items-center">
          <MailIcon className="size-5" />
          <h2 className="text-xl font-semibold"> Liên hệ đặt chỗ </h2>
        </div>
        <div className="text-sm font-medium text-gray-500">
          Thêm liên hệ để nhận xác nhận đặt chỗ.
        </div>
      </div>


      <div className="flex flex-col gap-y-4 rounded-4xl bg-blue-50 p-4">
        <div className="flex flex-col gap-y-1">
          <Label htmlFor="contact-full-name" className="text-xs font-semibold ml-1">Họ và tên</Label>
          <Input
            type="text"
            id="contact-full-name"
            {...register("name")}
            className={buttonVariants({ variant: "outline", size: "default", className: "h-10" })}
            placeholder="Nhập họ và tên"
          />
          {errors.name && <div className="text-sm text-destructive ml-1">{errors.name.message}</div>}
          <div className="text-xs font-semibold text-gray-500 ml-1">như trên CMND (không dấu)</div>
        </div>
        <div className="w-full flex flex-col gap-y-4 md:flex-row md:gap-y-0 md:gap-x-6">
          <div className="w-full flex flex-col gap-y-1">
            <Label htmlFor="phone-number" className="text-xs font-semibold ml-1">Số điện thoại</Label>
            <div className="flex gap-x-1">
              <Input
                type="tel"
                id="phone-number"
                {...register("phone")}
                className={buttonVariants({ variant: "outline", size: "default", className: "h-10" })}
                placeholder="Nhập số điện thoại"
              />
            </div>
            {errors.phone && <div className="text-sm text-destructive ml-1">{errors.phone.message}</div>}
            <div className="text-xs font-semibold text-gray-500 ml-1">VD: 0987654321</div>
          </div>
          <div className="w-full flex flex-col gap-y-1">
            <Label htmlFor="email" className="text-xs font-semibold ml-1">Email</Label>
            <Input
              type="email"
              id="email"
              {...register("email")}
              className={buttonVariants({ variant: "outline", size: "default", className: "h-10" })}
              placeholder="Nhập địa chỉ email"
            />
            {errors.email && <div className="text-sm text-destructive ml-1">{errors.email.message}</div>}
            <div className="text-xs font-semibold text-gray-500 ml-1">VD: example@example.com</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-y-1">
        <Label htmlFor="note" className="text-xs font-semibold ml-1">Lưu ý dành cho khách sạn</Label>
        <Textarea
          id="note"
          {...register("note")}
          className={buttonVariants({ variant: "outline", size: "default", className: "h-24" })}
          placeholder="Nhập lưu ý cho khách sạn (nếu có)"
          rows={4}
        />
        {errors.note && <div className="text-sm text-destructive ml-1">{errors.note.message}</div>}
        <div className="text-xs text-gray-500 ml-1">
          Lưu ý: Tất cả các yêu cầu tùy thuộc vào tình trạng sẵn có và không được đảm bảo. Có thể phát sinh thêm phí. Vui lòng liên hệ trực tiếp với nhân viên khách sạn để biết thêm thông tin.
        </div>
      </div>
    </form>
  )
}