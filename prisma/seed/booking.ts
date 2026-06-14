import type { BookingStatus, Prisma } from "@/lib/generated/prisma/client";
import { Decimal } from "@prisma/client/runtime/client";

import prisma from "@/lib/prisma";

import { fakerVI as faker } from "@faker-js/faker";
import { seed_getAvailableRoomTypes } from "@/lib/generated/prisma/sql";


export function randomQuarterTime({ minHour, maxHour }: { minHour:number, maxHour:number }) {
  const hours = faker.number.int({ min: minHour, max: maxHour });
  const minutes = faker.helpers.arrayElement([0, 15, 30, 45]);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}


const today = new Date();
async function seedBookings() {
  const USERS_PER_PAGE = 10;
  const MAX_ROOM_TYPE_PAGES = 10;
  const MAX_USER_PAGES = 1;

  let userCursor: string | undefined = undefined;

  for (let userPage = 0; userPage < MAX_USER_PAGES; userPage++) {
    const users: { id: string }[] = await prisma.user.findMany({
      take: USERS_PER_PAGE,
      ...(userCursor ? { cursor: { id: userCursor }, skip: 1 } : {}),
      select: { id: true },
      orderBy: { id: "asc" },
    });

    if (users.length === 0) break;

    let roomTypeIdCursor: string | null = null;

    for (let roomTypePage = 0; roomTypePage < MAX_ROOM_TYPE_PAGES; roomTypePage++) {
      const status = faker.helpers.arrayElement<BookingStatus>(["CHECKED_OUT", "CHECKED_IN", "PAID"]);
      const checkInDate = status === "CHECKED_OUT"
        ? faker.date.recent({ days: 10, refDate: today })
        : faker.date.soon({ days: 10, refDate: today });
      const checkOutDate = status === "CHECKED_OUT"
        ? faker.date.soon({ days: 5, refDate: checkInDate })
        : faker.date.soon({ days: 5, refDate: checkInDate });

      const numRooms = faker.number.int({ min: 1, max: 2 });
      const numAdults = faker.number.int({ min: numRooms, max: 4 });
      const numChildren = faker.number.int({ min: 0, max: 2 });

      const availableRoomTypes: seed_getAvailableRoomTypes.Result[] =
        await prisma.$queryRawTyped(seed_getAvailableRoomTypes(
          checkInDate,
          checkOutDate,
          numAdults,
          numChildren,
          numRooms,
          10,
          roomTypeIdCursor,
        ));

      if (availableRoomTypes.length === 0) break;

      const bookingInputs: Prisma.BookingCreateManyInput[] = availableRoomTypes.flatMap((roomType) => ({
        userId: faker.helpers.arrayElement(users).id,
        roomTypeId: roomType.id,
        snapshotRoomTypeName: roomType.name,
        checkInDate,
        checkOutDate,
        snapshotRoomPrice: new Decimal(roomType.price),
        createdAt: faker.date.recent({ refDate: checkInDate }),
        numRooms,
        numAdults,
        numChildren,
        snapshotCheckInTime: randomQuarterTime({ minHour: 14, maxHour: 14 }),
        snapshotCheckOutTime: randomQuarterTime({ minHour: 11, maxHour: 12 }),
        customerName: `${faker.person.lastName()} ${faker.person.firstName()}`,
        customerEmail: faker.internet.email(),
        customerPhone: faker.phone.number().replaceAll(" ", "").padEnd(10, "0"),
        status,
      }));

      try {
        await prisma.booking.createMany({
          data: bookingInputs,
          skipDuplicates: true,
        });

      } catch (error) {
        break; // stop if there's an error (e.g. not enough rooms to book), to avoid infinite loop
      }
      roomTypeIdCursor = availableRoomTypes[availableRoomTypes.length - 1].id;
    }
    userCursor = users[users.length - 1].id;
  }
}


async function seedReviews() {
  const PAGE = 20;
  let totalCreated = 0;
  let cursor: string | undefined = undefined;

  while (true) {
    const bookings: { id: string }[] = await prisma.booking.findMany({
      take: PAGE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      where: { status: "CHECKED_OUT", review: { is: null } },
      select: { id: true },
      orderBy: { id: "asc" },
    });

    if (bookings.length === 0) break;

    const reviewInputs: { bookingId: string; rating: number; comment: string; createdAt: Date }[] = bookings.map((b) => ({
      bookingId: b.id,
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.paragraph(),
      createdAt: faker.date.recent(),
    }))

    if (reviewInputs.length > 0) {
      const res = await prisma.review.createMany({
        data: reviewInputs,
        skipDuplicates: true,
      });
      totalCreated += res.count ?? 0;
    }

    if (bookings.length < PAGE) break;
    cursor = bookings[bookings.length - 1].id;
  }

  return totalCreated;
}

export { seedBookings, seedReviews };