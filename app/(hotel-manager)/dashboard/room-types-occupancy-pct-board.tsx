import { auth } from "@/auth";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hotelowner_getOccupationPctOfAllRoomTypes as core_hotelowner_getOccupationPctOfAllRoomTypes } from "@/lib/generated/prisma/sql";
import prisma from "@/lib/prisma";
import { OperationResult } from "@/lib/types/utils";

async function hotelowner_getOccupationPctOfAllRoomTypes():
  Promise<OperationResult<core_hotelowner_getOccupationPctOfAllRoomTypes.Result[]>> {
  const session = await auth();
  if (!session || !session.user) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }
  
  if (session.user.role !== "HOTEL_OWNER") {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  const hotel = await prisma.hotel.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!hotel) {
    return { ok: false, error: "Hotel not found", status: 404 };
  }

  const result = await prisma.$queryRawTyped(core_hotelowner_getOccupationPctOfAllRoomTypes(hotel.id));
  return { ok: true, data: result };
}

export default async function RoomTypesOccupancyPctBoard() {
  const response = await hotelowner_getOccupationPctOfAllRoomTypes();
  if (!response.ok) {
    return null;
  }

  const rows = response.data;
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