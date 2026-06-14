"use server";

import { auth } from "@/auth";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { user_getRecentlyViewedHotels as core_user_getRecentlyViewedHotels } from "@/lib/generated/prisma/sql";
import prisma from "@/lib/prisma";

import { HotelCardProps } from "@/lib/types/hotel-card";


export async function user_getRecentlyViewedHotels(
  limit: number = DEFAULT_PAGE_SIZE,
  cursor: { viewedAt: Date, id: string } | null
): Promise<{ items: HotelCardProps[]; nextCursor: { viewedAt: Date, id: string } | null }> {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  if (session.user.role !== "USER") {
    throw new Error("Forbidden");
  }

  const recentlyViewedHotel = await prisma.$queryRawTyped((core_user_getRecentlyViewedHotels(
    session.user.id,
    limit + 1,
    cursor ? cursor.viewedAt : null,
    cursor ? cursor.id : null,
  ))).then(rows => rows.map(r => ({
    ...r,
    price: r.price ? r.price.toNumber() : 0,
  })));

  const hasMore = recentlyViewedHotel.length > (limit ?? 10);
  const items = hasMore ? recentlyViewedHotel.slice(0, -1) : recentlyViewedHotel;

  const nextCursor = hasMore
    ? { viewedAt: items[items.length - 1].viewedAt, id: items[items.length - 1].id }
    : null;

  return { items, nextCursor };
}