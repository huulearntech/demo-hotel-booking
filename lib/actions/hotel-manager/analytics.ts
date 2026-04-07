"use server";

import prisma from "@/lib/prisma";

export async function fetchLast90DaysRevenueAndNumberOfBookings() {
  const today = new Date();
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(today.getDate() - 90);

  const revenueData = await prisma.bookingMetadata.groupBy({
    by: ["createdAt"],
    where: {
      createdAt: {
        gte: ninetyDaysAgo,
        lte: today,
      },
    },
    _count: {
      id: true,
    },
    _sum: {
      snapshotRoomPrice: true, // TODO: multiply by numRooms
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return revenueData.map((entry) => ({
    date: Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(entry.createdAt),
    revenue: entry._sum.snapshotRoomPrice?.toNumber() || 0,
    numberOfBookings: entry._count.id,
  }));
}