"use server";

import { draft_HotelCardProps } from "@/lib/types/hotel-card";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { OperationResult } from "@/lib/types/utils";
import { Prisma } from "@/lib/generated/prisma/client";


export async function user_upsertFavoriteHotel(
  hotelId: string
): Promise<OperationResult<{ userId: string; hotelId: string; createdAt: Date }>> {
  const session = await auth();
  if (!session || !session.user) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  if (session.user.role !== "USER") {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  try {
    // Prisma model uses composite keys (no single id field), so create and if unique constraint is hit, fetch the existing record.
    const response = await prisma.favorite.create({
      data: { userId: session.user.id, hotelId },
      select: { userId: true, hotelId: true, createdAt: true }
    }).catch(async (err) => {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        // already exists -> return the existing row
        return await prisma.favorite.findFirst({
          where: { userId: session.user.id, hotelId },
          select: { userId: true, hotelId: true, createdAt: true }
        });
      }
      throw err;
    });

    if (!response) {
      return { ok: false, error: "Failed to upsert favorite", status: 500 };
    }
    return { ok: true, data: response };
  } catch (error) {
    console.error("Error upserting favorite:", error);
    return { ok: false, error: "Internal server error", status: 500 };
  }
}


export async function draft_user_createOrDeleteFavoriteHotel(
  hotelId: string,
  shouldFavorite: boolean
): Promise<{
  ok: false;
  error: string;
  status: number;
} | {
  ok: true;
}> {
  const session = await auth();
  if (!session || !session.user) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  if (session.user.role !== "USER") {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  try {
    if (shouldFavorite) {
      await prisma.favorite.create({
        data: { userId: session.user.id, hotelId },
        select: { userId: true, hotelId: true, createdAt: true }
      });
      return { ok: true };
    } else {
      await prisma.favorite.deleteMany({
        where: { userId: session.user.id, hotelId },
      });
      return { ok: true };
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { ok: true };
      }
    }
    return { ok: false, error: "Internal server error", status: 500 };
  }
}


export async function draft_user_fetchFavoriteHotels(
  opts?: { limit?: number; cursor?: string }
): Promise<OperationResult<{ items: draft_HotelCardProps[]; nextCursor?: string }>> {
  const session = await auth();
  if (!session || !session.user) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  if (session.user.role !== "USER") {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  const limit = Math.max(1, Math.min(50, opts?.limit ?? 10)); // clamp limit
  const fetchCount = limit + 1; // fetch one extra to detect next page

  let cursorCreatedAt: Date | undefined;
  let cursorHotelId: string | undefined;

  if (opts?.cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(opts.cursor, "base64").toString("utf8"));
      cursorCreatedAt = new Date(decoded.createdAt);
      cursorHotelId = decoded.hotelId;
      if (Number.isNaN(cursorCreatedAt.getTime()) || typeof cursorHotelId !== "string") {
        throw new Error("Invalid cursor");
      }
    } catch {
      return { ok: false, error: "Invalid cursor", status: 400 };
    }
  }

  // Build where clause supporting cursor-based pagination with createdAt desc, tie-breaker hotelId desc
  const baseWhere: any = { userId: session.user.id };
  if (cursorCreatedAt && cursorHotelId) {
    // For descending order, next page items are those with:
    // createdAt < cursorCreatedAt OR (createdAt == cursorCreatedAt AND hotelId < cursorHotelId)
    baseWhere.AND = [
      { userId: session.user.id },
      {
        OR: [
          { createdAt: { lt: cursorCreatedAt } },
          { AND: [{ createdAt: { equals: cursorCreatedAt } }, { hotelId: { lt: cursorHotelId } }] },
        ],
      },
    ];
  }

  const rows = await prisma.favorite.findMany({
    where: baseWhere,
    orderBy: [{ createdAt: "desc" }, { hotelId: "desc" }],
    select: {
      createdAt: true,
      hotelId: true,
      hotel: {
        select: {
          id: true,
          name: true,
          imageUrls: true,
          rating: true,
          numberOfReviews: true,
          ward: { select: { name: true, district: { select: { province: { select: { name: true }}}} } },
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
    isFavorited: true, // since these are all favorites
  } as draft_HotelCardProps));

  let nextCursor: string | undefined;
  if (hasMore) {
    const last = pageRows[pageRows.length - 1];
    const payload = JSON.stringify({ createdAt: last.createdAt.toISOString(), hotelId: last.hotel.id });
    nextCursor = Buffer.from(payload, "utf8").toString("base64");
  }

  return { ok: true, data: { items, nextCursor } };
}

export async function user_getIsHotelFavorited(hotelId: string): Promise<boolean> {
  const session = await auth();
  if (!session || !session.user) {
    return false;
  }

  const fav = await prisma.favorite.findFirst({
    where: { userId: session.user.id, hotelId },
    select: { userId: true },
  });
  
  return !!fav;
}