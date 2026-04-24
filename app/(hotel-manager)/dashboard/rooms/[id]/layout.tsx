import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export default function RoomTypeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    return { title: "Unauthorized" };
  }
  const { id: roomTypeId } = await params;
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    select: { name: true },
  });
  return {
    title: roomType?.name ? `Chi tiết phòng - ${roomType.name}`: "Không tìm thấy phòng",
  };
}
