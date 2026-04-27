"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

import { draft_HotelCardProps } from "@/lib/types/hotel-card";
import { OperationResult } from "@/lib/types/utils";


export async function draft_user_fetchRecentlyViewedHotels(
  opts?: { limit?: number; cursor?: string }
): Promise<OperationResult<{ items: draft_HotelCardProps[]; nextCursor?: string }>> {
  const session = await auth();
  if (!session || !session.user) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  if (session.user.role !== "USER") {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  const limit = Math.max(1, Math.min(50, opts?.limit ?? 10));
  const fetchCount = limit + 1;

  let cursorViewedAt: Date | undefined;
  let cursorHotelId: string | undefined;

  if (opts?.cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(opts.cursor, "base64").toString("utf8"));
      cursorViewedAt = new Date(decoded.viewedAt);
      cursorHotelId = decoded.hotelId;
      if (Number.isNaN(cursorViewedAt.getTime()) || typeof cursorHotelId !== "string") {
        throw new Error("Invalid cursor");
      }
    } catch {
      return { ok: false, error: "Invalid cursor", status: 400 };
    }
  }

  const baseWhere: any = { userId: session.user.id };
  if (cursorViewedAt && cursorHotelId) {
    baseWhere.AND = [
      { userId: session.user.id },
      {
        OR: [
          { viewedAt: { lt: cursorViewedAt } },
          { AND: [{ viewedAt: { equals: cursorViewedAt } }, { hotelId: { lt: cursorHotelId } }] },
        ],
      },
    ];
  }

  const rows = await prisma.recentlyViewed.findMany({
    where: baseWhere,
    orderBy: [{ viewedAt: "desc" }, { hotelId: "desc" }],
    select: {
      viewedAt: true,
      hotelId: true,
      hotel: {
        select: {
          id: true,
          name: true,
          imageUrls: true,
          rating: true,
          numberOfReviews: true,
          ward: { select: { name: true, district: { select: { province: { select: { name: true } } } } } },
          facilities: { select: { name: true } },
          roomTypes: { select: { price: true }, orderBy: { price: "asc" }, take: 1 },
          type: true,
        },
      },
    },
    take: fetchCount,
  });

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, -1) : rows;

  const items: draft_HotelCardProps[] = pageRows.map(r => ({
    id: r.hotel.id,
    name: r.hotel.name,
    thumbnailUrl: r.hotel.imageUrls[0],
    rating: r.hotel.rating,
    numberOfReviews: r.hotel.numberOfReviews,
    wardName: r.hotel.ward.name,
    provinceName: r.hotel.ward.district.province.name,
    facilityNames: r.hotel.facilities.map(f => f.name),
    price: r.hotel.roomTypes.length > 0 ? r.hotel.roomTypes[0].price.toNumber() : 0,
    type: r.hotel.type,
    isFavorited: false, // FIXME: just use SQL instead of prisma. it sucks.
  } as draft_HotelCardProps));

  let nextCursor: string | undefined;
  if (hasMore) {
    const last = pageRows[pageRows.length - 1];
    const payload = JSON.stringify({ viewedAt: last.viewedAt.toISOString(), hotelId: last.hotel.id });
    nextCursor = Buffer.from(payload, "utf8").toString("base64");
  }

  return { ok: true, data: { items, nextCursor } };
}