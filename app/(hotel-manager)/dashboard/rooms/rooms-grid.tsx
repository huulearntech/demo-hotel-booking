import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { PATHS } from "@/lib/constants";

type RoomTypeRow = {
  id: string;
  name: string;
  adultCapacity: number;
  childrenCapacity: number;
  imageUrls: string[];
  _count: { rooms: number };
};

async function hotelowner_getRoomTypes(): Promise<RoomTypeRow[]> {
  const session = await auth();
  if (!session || session.user.role !== "HOTEL_OWNER") {
    throw new Error("Unauthorized");
  }

  const roomTypes = await prisma.roomType.findMany({
    where: {
      hotel: {
        ownerId: session.user.id,
      },
    },
    select: {
      id: true,
      name: true,
      adultCapacity: true,
      childrenCapacity: true,
      imageUrls: true,
      _count: { select: { rooms: true } },
    },
    orderBy: { name: "asc" },
  });

  return roomTypes as RoomTypeRow[];
}

function RoomCard({ roomType }: { roomType: RoomTypeRow }) {
  const thumbnail = roomType.imageUrls && roomType.imageUrls.length > 0 ? roomType.imageUrls[0] : null;

  return (
    <Card className="flex flex-col h-full pt-0 pb-3">
      <div className="h-40 w-full overflow-hidden rounded-t-md bg-gray-100 flex items-center justify-center">
        {thumbnail ? (
          // Use a plain img for simplicity and predictable server rendering
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt={`${roomType.name} thumbnail`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex items-center justify-center text-sm text-gray-500 px-4">
            <div className="text-center">
              <div className="font-semibold">{roomType.name}</div>
              <div className="text-xs mt-1">No image</div>
            </div>
          </div>
        )}
      </div>

      <CardHeader className="px-3">
        <CardTitle> {roomType.name} </CardTitle>
        <CardDescription>
        <CardAction>{roomType._count.rooms} phòng </CardAction>
        </CardDescription>
      </CardHeader>

      <CardContent className="px-3">
        <div className="text-sm text-muted-foreground flex flex-col gap-1">
          <span> Sức chứa: {roomType.adultCapacity} người lớn & {roomType.childrenCapacity} trẻ em </span>
        </div>
      </CardContent>

      <CardFooter className="justify-end mt-auto px-3">
        <Button asChild>
          <Link
            href={`${PATHS.hotelRooms}/${roomType.id}`}
            aria-label={`Manage ${roomType.name}`}
          // className="ml-auto"
          >
            Quản lý
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default async function RoomsGrid() {
  const roomTypes = await hotelowner_getRoomTypes();

  if (!roomTypes || roomTypes.length === 0) {
    return (
      <div className="py-8">
        <p className="text-center text-sm text-gray-500">Không có loại phòng nào. Hãy thêm loại phòng để quản lý.</p>
      </div>
    );
  }

  return (
    <div className="@container/rooms-grid">
      <section className="grid grid-cols-1 @xl/rooms-grid:grid-cols-2 @4xl/rooms-grid:grid-cols-3 @7xl/rooms-grid:grid-cols-4 gap-4">
        {roomTypes.map((rt) => (
          <div key={rt.id} className="w-full">
            <RoomCard roomType={rt} />
          </div>
        ))}
      </section>
    </div>
  );
}
