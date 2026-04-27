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

export default async function AccountPage() {
  const session = await auth();
  const user = session ? await user_getInfoById(session.user.id) : null;
  if (!user) return null;

  return (
    <main>
      <div className="mx-auto flex flex-col items-center gap-y-4 mt-13 px-4 py-3">
        <AvatarPrimitive.Root
          data-slot="avatar"
          className="group relative flex size-25 shrink-0 rounded-full select-none"
        >
          <AvatarPrimitive.Image
            data-slot="avatar-image"
            src={user.profileImageUrl ?? undefined} alt={user.name}
            className="aspect-square size-full rounded-full"
          />
          <AvatarPrimitive.Fallback
            data-slot="avatar-fallback"
            className="bg-muted text-muted-foreground flex size-full items-center justify-center rounded-full text-sm truncate"
          >
            {user.name}
          </AvatarPrimitive.Fallback>
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

        <ChangeNameDialog originalName={user.name ?? ""} />

        <li>
          <Link
            href={PATHS.accountHistory}
            className="group flex items-center justify-between w-full rounded-lg border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-accent/5"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">Lịch sử đặt phòng</span>
              <span className="text-sm text-muted-foreground">
                Xem và quản lý các đặt phòng trước đây của bạn
              </span>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        </li>

        <li>
          <Link
            href={PATHS.accountRecentlyViewed}
            className="group flex items-center justify-between w-full rounded-lg border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-accent/5"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">Đã xem gần đây</span>
              <span className="text-sm text-muted-foreground">
                Xem lại các khách sạn bạn đã xem gần đây
              </span>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        </li>
      </ul>
    </main>
  );
}

export const metadata: Metadata = {
  title: 'Cài đặt tài khoản',
  description: 'Quản lý thông tin tài khoản của bạn, xem lịch sử đặt phòng và các hoạt động gần đây.',
}