import { NextRequest, NextResponse } from "next/server";
import { addDays, startOfDay } from "date-fns";
import prisma from "@/lib/prisma";

const MAX_ROOM_TYPE_LOOPS = 10_000; // Limit to prevent excessive processing
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const today = startOfDay(new Date());
  const dates = Array.from({ length: 30 }, (_, index) => addDays(today, index));

  let lastRoomTypeId: string | null = null; // cursor for pagination

  for (let i = 0; i < MAX_ROOM_TYPE_LOOPS; i++) {
    const roomTypes: { id: string, rooms: { id: string }[] }[] = await prisma.roomType.findMany({
      where: lastRoomTypeId ? { id: { gt: lastRoomTypeId } } : undefined,
      orderBy: { id: "asc" },
      take: 100, // Process 100 room types at a time
      select: {
        id: true,
        rooms: { select: { id: true } },
      },
    });

    await prisma.roomTypeInventory.deleteMany({
      where: {
        ...(lastRoomTypeId ? { roomTypeId: { gt: lastRoomTypeId } } : {}),
        date: { lt: today },
      },
    });

    for (const roomType of roomTypes) {
      const totalRooms = roomType.rooms.length;
      dates.forEach((date) =>
        prisma.roomTypeInventory.upsert({
          where: {
            roomTypeId_date: {
              roomTypeId: roomType.id,
              date,
            },
          },
          update: {
            // totalRooms, // Do nothing on update for now, as total rooms should not change after initialization.
          },
          create: {
            roomTypeId: roomType.id,
            date,
            totalRooms,
            bookedRooms: 0,
          },
        })
      );
    }

    if (roomTypes.length < 100) {
      break; // No more room types to process
    }

    // Update cursor for next loop
    lastRoomTypeId = roomTypes[roomTypes.length - 1].id;
  }

  return NextResponse.json({ message: "Room type inventory refreshed for the next 30 days." });
}