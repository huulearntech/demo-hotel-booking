import { auth } from "@/auth"
import prisma from "@/lib/prisma";

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

// NOTE: user role must be enforced in the proxy route to avoid the awkwardness in these components.
export default async function DashboardHeader() {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") return null;

  const hotel = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
    select: { name: true },
  });

  if (!hotel) return null;


  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-semibold">{hotel.name}</h1>
      </div>
    </header>
  )
}