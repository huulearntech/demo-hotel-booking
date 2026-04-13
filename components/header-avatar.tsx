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
import { ChevronRightIcon } from "lucide-react";
import SignOutButton from "./button-signout";

export default async function HeaderAvatar({
  name,
  email,
  profileImageUrl,
}: {
  name: string | null;
  email: string | null;
  profileImageUrl: string | null;
}) {
  return (
    <Dialog>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger>
          <Avatar>
            <AvatarImage src={profileImageUrl ?? undefined} alt={name || "Something is wrong"} />
            <AvatarFallback>{name}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-fit max-w-100">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-1">
              <p className="font-semibold"> Xin chào, {name} </p>
              <p className="font-normal text-muted-foreground">{email}</p>
              <Avatar className="size-16 mt-2 mx-auto">
                <AvatarImage src={profileImageUrl ?? undefined} alt={name || "Something is wrong"} />
                <AvatarFallback>{name}</AvatarFallback>
              </Avatar>
            </DropdownMenuLabel>
          <DropdownMenuItem
            asChild
            className="flex gap-x-2"
          >
            <Link href={PATHS.account} className="items-start">
              Tài khoản của tôi
              <ChevronRightIcon className="ml-auto size-4" />
            </Link>
          </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />

          <DialogTrigger asChild>
            <DropdownMenuItem>
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