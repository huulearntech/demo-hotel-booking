import { auth } from "@/auth"
import prisma from "@/lib/prisma";

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { hotelowner_getHotelName } from "@/lib/actions/hotel-manager/change-hotel-name";

// import {
//   Avatar,
//   AvatarFallback,
//   AvatarImage,
// } from "@/components/ui/avatar"

// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuGroup,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"

// import { LogOutIcon, UserCircleIcon, BellRingIcon, CreditCardIcon } from "lucide-react";
// import { AlertDialogTrigger } from "@/components/ui/alert-dialog";

// NOTE: user role must be enforced in the proxy route to avoid the awkwardness in these components.

export default async function DashboardHeader() {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") return null;

  // const hotel = await prisma.hotel.findUnique({
  //   where: { ownerId: session.user.id },
  //   select: { name: true },
  // });

  // if (!hotel) return null;

  const hotelName = await hotelowner_getHotelName(session.user.id);
  if (!hotelName) return null; // NOTE: already protected by proxy


  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-semibold">{hotelName.name}</h1>
      </div>
    </header>
  )
}

export function DashboardHeaderSkeleton() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-muted/5 transition-[width,height] ease-linear animate-pulse">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <span className="inline-flex h-8 w-8 rounded-lg bg-muted/10" />
        <span className="mx-2 inline-block h-4 w-px rounded-full bg-muted/10" />
        <span className="h-5 w-32 rounded-md bg-muted/10" />
      </div>
    </header>
  )
}

{/* 
      <DropdownMenu>
        <DropdownMenuTrigger className="px-4 lg:px-6" >
          <Avatar className="h-8 w-8 rounded-lg grayscale">
            {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
            <AvatarFallback className="rounded-lg">{user.name}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
                <AvatarFallback className="rounded-lg">{user.name}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <UserCircleIcon />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCardIcon />
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem>
              <BellRingIcon />
              Notifications
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <AlertDialogTrigger asChild>
            <DropdownMenuItem>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu> */}