import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { differenceInDays } from "date-fns";
import { Decimal } from "@prisma/client/runtime/client";


async function hotelowner_getMetrics() {
  const session = await auth();
  if (!session || session.user.role !== "HOTEL_OWNER") {
    throw new Error("Unauthorized");
  }

  const result = await prisma.$transaction(async (tx) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkinsToday = await tx.booking.count({
      where: {
        metadata: { 
          roomType: {
            hotel: {
              ownerId: session.user.id,
            }
          },
          checkInDate: today,
        }
      },
    });

    const bookingsToday = await tx.booking.count({
      where: {
        metadata: {
          roomType: {
            hotel: {
              ownerId: session.user.id,
            }
          },
          createdAt: today,
        }
      },
    });

    const revenueMTD = await tx.booking.findMany({
      where: {
        metadata: {
          roomType: {
            hotel: {
              ownerId: session.user.id,
            }
          }
        },
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1),
          lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
        },
      },
      select: {
        metadata: {
          select: {
            snapshotRoomPrice: true,
            checkInDate: true,
            checkOutDate: true,
          }
        }
      }
    }).then((bookings) => {
      return bookings.reduce((acc, booking) => {
        acc = acc.add(booking.metadata.snapshotRoomPrice.mul(differenceInDays(booking.metadata.checkOutDate, booking.metadata.checkInDate)));
        return acc;
      }, new Decimal(0));
    });

    const occupancy = await tx.room.aggregate({
      where: {
        type: {
          hotel: {
            ownerId: session.user.id,
          }
        },
        status: "ACTIVE",
      },
      _count: true,
    });

    const occupiedRooms = await tx.room.count({
      where: {
        type: {
          hotel: {
            ownerId: session.user.id,
          }
        },
        status: "ACTIVE", // TODO: ignore it for now, this is just place holder.
      },
    });

    return {
      checkinsToday,
      bookingsToday,
      revenueMTD: revenueMTD.toNumber(),
      occupancyRate: occupancy._count > 0 ? occupiedRooms / occupancy._count : 0,
    };
  });

  return result;
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle>
          {value}
        </CardTitle>
      </CardHeader>
      <CardFooter className="text-sm text-muted-foreground">Thông tin cập nhật theo thời gian thực</CardFooter>
    </Card>
  );
}



export default async function DashboardMetricCards() {
  const metrics = await hotelowner_getMetrics();

  const items = [
    {
      id: "checkinsToday",
      title: "Lượt check-in hôm nay",
      value: metrics.checkinsToday,
    },
    {
      id: "bookingsToday",
      title: "Lượt đặt phòng hôm nay",
      value: metrics.bookingsToday,
    },
    {
      id: "revenueMTD",
      title: "Doanh thu (từ đầu tháng)",
      value: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(metrics.revenueMTD ?? 0),
    },
    {
      id: "occupancyRate",
      title: "Tỷ lệ phòng có người ở",
      value: `${Math.round((metrics.occupancyRate ?? 0) * 100)}%`,
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((m) => (
        <MetricCard key={m.id} title={m.title} value={m.value} />
      ))}
    </section>
  );
}