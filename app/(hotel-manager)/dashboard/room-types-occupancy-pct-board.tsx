import { auth } from "@/auth";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";

export default async function RoomTypesOccupancyPctBoard() {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    return <div>Unauthorized</div>;
  }

  // fetch room types for hotels owned by this owner
  const roomTypes = await prisma.roomType.findMany({
    where: { hotel: { ownerId: session.user.id } },
    select: { id: true, name: true }
  });

  const today = new Date();

  const rows = await Promise.all(
    roomTypes.map(async (type) => {
      const totalRooms = await prisma.room.count({ where: { typeId: type.id } });

      const bookedAgg = await prisma.bookingMetadata.aggregate({
        _sum: { numRooms: true },
        where: {
          roomTypeId: type.id,
          checkInDate: { lte: today }, // check in date is inclusive
          checkOutDate: { gt: today }, // check out date is exclusive
          // only consider bookings that have been created as real bookings
          booking: { is: { status: { in: ["PAID", "CHECKED_IN"] } } },
        },
      });

      const bookedRooms = (bookedAgg._sum.numRooms ?? 0);
      const pct = totalRooms > 0 ? Math.min(100, Math.round((bookedRooms / totalRooms) * 100)) : 0;

      return { id: type.id, name: type.name, totalRooms, bookedRooms, pct };
    })
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {rows.map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <CardTitle>{r.name}</CardTitle>
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