import { auth } from "@/auth";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hotelowner_getOccupationPctOfAllRoomTypes } from "@/lib/generated/prisma/sql";
import prisma from "@/lib/prisma";

export default async function RoomTypesOccupancyPctBoard() {
  // TODO: clean up auth check.
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    return <div>Unauthorized</div>;
  }

  const hotel = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!hotel) {
    return <div>Hotel not found</div>;
  }

  const rows = await prisma.$queryRawTyped(hotelowner_getOccupationPctOfAllRoomTypes(hotel.id));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {rows.map((r) => (
        <Card key={r.roomTypeId}>
          <CardHeader>
            <CardTitle>{r.roomTypeName}</CardTitle>
            <CardDescription>
              {r.bookedRooms} / {r.totalRooms} phòng đã được đặt
            </CardDescription>
            <CardAction>
              <div className="text-lg font-bold">{r.pct}%</div>
            </CardAction>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};