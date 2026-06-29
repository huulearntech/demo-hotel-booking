import type { Metadata } from "next";
import Link from "next/link";

import { PATHS } from "@/lib/constants";
import { user_getInfoById } from "@/lib/actions/user-account";
import { user_createOrUpdateAvatarUrl } from "@/lib/actions/user-account";
import { auth } from "@/auth";

import ChangeNameDialog from "./dialog-change-name";
import { Avatar as AvatarPrimitive } from "radix-ui"
import { AvatarUploader } from "./button-upload-avatar-cloudinary";
import { ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import { tvlk_favicon } from "@/public/logos";
import ChangeHotelNameDialog from "./dialog-change-hotel-name";
import { hotelowner_getHotelName } from "@/lib/actions/hotel-manager/change-hotel-name";

export default async function AccountPage() {
  const session = await auth();
  if (!session) return null; // NOTE: already protected by proxy

  const user = await user_getInfoById(session.user.id);
  if (!user) return null;
  const hotelName = await hotelowner_getHotelName(session.user.id);
  if (!hotelName) return null;


  return (
    <main>
      <div className="mx-auto flex flex-col items-center gap-y-4 mt-13 px-4 py-3">
        <AvatarPrimitive.Root
          data-slot="avatar"
          className="group relative flex size-25 shrink-0 rounded-full bg-muted select-none items-center justify-center"
        >
          {user.profileImageUrl
            ? <AvatarPrimitive.Image
              data-slot="avatar-image"
              src={user.profileImageUrl ?? undefined} alt={user.name}
              className="aspect-square size-full rounded-full"
            />
            : <Image
              src={tvlk_favicon}
              alt={`Ảnh đại diện mặc định của ${user.name ?? "người dùng"}`}
              data-slot="avatar-fallback"
              className="rounded-full object-contain"
            />
          }
          <AvatarUploader onUploadSuccess={user_createOrUpdateAvatarUrl} />
        </AvatarPrimitive.Root>
      </div>

      <ul className="grid w-full max-w-xl gap-3 mx-auto mt-8 px-4">
        <li>
          <div
            className="flex items-center justify-between w-full rounded-lg border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-accent/5"
            role="group"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">Email</span>
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </li>

        <ChangeNameDialog originalName={user.name} />

        <ChangeHotelNameDialog originalName={hotelName.name} />
      </ul>
    </main>
  );
}

export const metadata: Metadata = {
  title: 'Cài đặt tài khoản',
  description: 'Quản lý thông tin tài khoản của bạn, xem lịch sử đặt phòng và các hoạt động gần đây.',
}