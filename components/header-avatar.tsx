import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

import { PATHS } from "@/lib/constants";
import Link from "next/link";
import { HeartIcon, LogOutIcon, UserCircleIcon } from "lucide-react";
import SignOutButton from "./button-signout";
import Image from "next/image";
import { tvlk_favicon } from "@/public/logos";

export default async function HeaderAvatar({
  name,
  email,
  profileImageUrl,
}: {
  name: string;
  email: string;
  profileImageUrl: string | null;
}) {
  return (
    <Dialog>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger>
          <Avatar size="lg" className="bg-muted items-center justify-center cursor-pointer">
            {profileImageUrl
             ? <AvatarImage src={profileImageUrl} alt={name} />
             : <Image src={tvlk_favicon} alt={`Ảnh đại diện của ${name}`} className="inset-0 object-contain" />
            }
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-50">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-1">
              <p className="font-semibold truncate" title={name}>Xin chào, {name.split('')[-1]}</p>
              <p className="font-normal text-muted-foreground truncate" title={email}>{email}</p>
              <Avatar className="size-16 mt-2 mx-auto items-center justify-center bg-muted">
                {profileImageUrl
                  ? <AvatarImage src={profileImageUrl} alt={name} />
                  : <Image src={tvlk_favicon} alt={`Ảnh đại diện của ${name}`} className="inset-0 object-contain" />
                }
              </Avatar>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem asChild >
              <Link href={PATHS.account}>
                <UserCircleIcon />
                Tài khoản của tôi
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild >
              <Link href={PATHS.favorites}>
                <HeartIcon />
                Danh sách yêu thích
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DialogTrigger asChild>
            <DropdownMenuItem>
              <LogOutIcon />
              Đăng xuất
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Đăng xuất
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn đăng xuất không?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline"> Hủy </Button>
          </DialogClose>
          <DialogClose asChild>
            <SignOutButton />
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}