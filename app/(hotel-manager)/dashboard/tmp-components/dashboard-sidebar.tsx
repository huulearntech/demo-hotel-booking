"use client"

import { ComponentProps } from "react"
import {
  BarChartBigIcon,
  LayoutDashboardIcon,
  TicketsIcon,
  DoorOpenIcon as RoomIcon,
  StarIcon
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"

import { PATHS } from "@/lib/constants"
import Image from "next/image"
import { tvlk_favicon, tvlk_logo_text_dark } from "@/public/logos"
import Link from "next/link"

const navMain = [
  {
    title: "Tổng quan",
    url: PATHS.hotelDashboard,
    icon: LayoutDashboardIcon,
  },
  {
    title: "Thống kê",
    url: PATHS.hotelStatistics,
    icon: BarChartBigIcon,
  },
  {
    title: "Phòng",
    url: PATHS.hotelRooms,
    icon: RoomIcon,
  },
  {
    title: "Lượt đặt phòng",
    url: PATHS.hotelBookings,
    icon: TicketsIcon,
  },
  {
    title: "Đánh giá",
    url: PATHS.hotelReviews,
    icon: StarIcon,
  }
];

export default function DashboardSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:py-0! group-data-[collapsible=icon]:p-0! flex items-center h-8"
            >
              <Link href={PATHS.hotelDashboard}>
                <Image src={tvlk_logo_text_dark} alt="Tvlk Logo" className="group-data-[collapsible=icon]:hidden h-full w-auto" />
                <Image src={tvlk_favicon} alt="Tvlk Logo" className="hidden group-data-[collapsible=icon]:block mx-auto" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent
        // NOTE: avoid scrollbar flickering
        className="overflow-x-clip!"
      >
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}