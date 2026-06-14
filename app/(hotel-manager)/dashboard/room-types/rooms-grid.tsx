import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { PATHS } from "@/lib/constants";
import Image from "next/image";

type RoomTypeRow = {
  id: string;
  name: string;
  description: string | null;
  adultCapacity: number;
  childrenCapacity: number;
  price: number;
  areaM2: number | null;
  bedType: string | null;
  imageUrls: string[] | null;
  _count: {
    rooms: number;
  };
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
      description: true,
      adultCapacity: true,
      childrenCapacity: true,
      price: true,
      areaM2: true,
      bedType: true,
      imageUrls: true,
      _count: { select: { rooms: true } },
    },
    orderBy: { name: "asc" },
  }).then((roomTypes) => roomTypes.map(rt => ({
    ...rt,
    price: rt.price.toNumber(),
  } as RoomTypeRow)));

  return roomTypes as RoomTypeRow[];
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
            <RoomTypeCard roomType={rt} />
          </div>
        ))}
      </section>
    </div>
  );
}
function RoomTypeCard({ roomType }: { roomType: RoomTypeRow }) {
  const thumbnail = roomType.imageUrls && roomType.imageUrls.length > 0 ? roomType.imageUrls[0] : null;

  const priceFormatted = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(roomType.price);

  return (
    <Card className="flex flex-col h-full shadow-sm hover:shadow-md transition-shadow duration-150 py-0">
      <div className="relative h-44 w-full overflow-hidden rounded-t-md bg-slate-100">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={`${roomType.name} thumbnail`}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="absolute inset-0 object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full px-4 text-center">
            <div>
              <div className="text-lg font-semibold text-foreground">{roomType.name}</div>
              <div className="text-sm text-muted-foreground mt-1">Không có hình ảnh</div>
            </div>
          </div>
        )}
      </div>

      <CardHeader className="px-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{roomType.name}</CardTitle>
          <span className="text-primary font-semibold"> {priceFormatted} </span>
        </div>

        <CardDescription className="text-sm text-muted-foreground">{roomType._count.rooms} phòng</CardDescription>
      </CardHeader>

      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold text-foreground">Sức chứa</div>
            <div className="text-sm text-muted-foreground">
              {roomType.adultCapacity} người lớn & {roomType.childrenCapacity} trẻ em
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold text-foreground">Diện tích</div>
            <div className="text-sm text-muted-foreground">{roomType.areaM2 ? `${roomType.areaM2} m²` : "Không rõ"}</div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold text-foreground">Loại giường</div>
            <div className="text-sm text-muted-foreground">{roomType.bedType ?? "Không xác định"}</div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold text-foreground">Giá mỗi đêm</div>
            <div className="text-sm text-muted-foreground">{priceFormatted}</div>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <div className="text-sm font-semibold text-foreground">Mô tả</div>
          <div className="text-sm text-muted-foreground">{roomType.description ?? "Không có mô tả"}</div>
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4 justify-end">
        <Button size="sm" asChild>
          <Link href={`${PATHS.hotelRoomTypes}/${roomType.id}`} aria-label={`Manage ${roomType.name}`}>
            Quản lý
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}