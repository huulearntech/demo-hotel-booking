import type { BookingStatus, Prisma, RoomType, User } from "@/lib/generated/prisma/client";
import { Decimal } from "@prisma/client/runtime/client";

import prisma from "@/lib/prisma";

import { fakerVI as faker } from "@faker-js/faker";


// See the chat
export function randomQuarterTime({ minHour, maxHour }: { minHour:number, maxHour:number }) {
  const hours = faker.number.int({ min: minHour, max: maxHour });
  const minutes = faker.helpers.arrayElement([0, 15, 30, 45]);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

async function seedBookings(users: User[], roomTypes: RoomType[]) {
  console.log("Seeding bookings");
  if (users.length === 0 || roomTypes.length === 0) {
    console.warn("No data provided for seeding bookings. Skipping.");
    return [];
  }

  const MAX_ENTRIES = 100;
  const numEntries = Math.min(
    MAX_ENTRIES,
    Math.max(1, Math.floor(Math.min(users.length * 2, roomTypes.length * 3)))
  );

  // Build sampling pairs: pick random user + random roomType (use roomType.hotelId)
  type Pair = { userId: string; roomTypeId: string; roomTypeName: string };
  const pairs: Pair[] = Array.from({ length: numEntries }, () => {
    const user = faker.helpers.arrayElement(users);
    const roomType = faker.helpers.arrayElement(roomTypes);
    return {
      userId: user.id,
      roomTypeId: roomType.id,
      roomTypeName: roomType.name,
    };
  });

  const third = Math.floor(pairs.length / 3);
  const twoThird = 2 * third;
  const today = new Date();

  // Use BookingCreateManyInput so we can call createMany with scalar fields (no nested connect)
  const pastBookingInputs: Prisma.BookingCreateManyInput[] = pairs
    .slice(0, third)
    .map(({ userId, roomTypeId, roomTypeName }) => {
      const checkOutDate = faker.date.recent({ refDate: today });
      const checkInDate = faker.date.recent({ days: 10, refDate: checkOutDate });
      const createdAt = faker.date.recent({ refDate: checkInDate });
      const snapshotRoomPriceNum = faker.number.int({ min: 100_000, max: 1_000_000, multipleOf: 1_000 });

      return {
        userId,
        roomTypeId,
        snapshotRoomTypeName: roomTypeName,
        checkInDate,
        checkOutDate,
        snapshotRoomPrice: new Decimal(snapshotRoomPriceNum),
        createdAt,
        numRooms: faker.number.int({ min: 1, max: 3 }),
        numAdults: faker.number.int({ min: 1, max: 6 }),
        numChildren: faker.number.int({ min: 1, max: 3 }),
        snapshotCheckInTime: randomQuarterTime({ minHour: 14, maxHour: 14 }),
        snapshotCheckOutTime: randomQuarterTime({ minHour: 11, maxHour: 12 }),
        customerName: `${faker.person.lastName()} ${faker.person.firstName()}`, // Vietnamese name order
        customerEmail: faker.internet.email(),
        customerPhone: faker.phone.number().replaceAll(' ', '').slice(0, 10), // Limit to 10 digits for phone number
        status: "CHECKED_OUT",
      };
    });

  const ongoingBookingInputs: Prisma.BookingCreateManyInput[] = pairs
    .slice(third, twoThird)
    .map(({ userId, roomTypeId, roomTypeName }) => {
      const checkInDate = faker.date.recent({ days: 5, refDate: today });
      const checkOutDate = faker.date.soon({ days: 5, refDate: today });
      const createdAt = faker.date.recent({ refDate: checkInDate });
      const snapshotRoomPriceNum = faker.number.int({ min: 100_000, max: 1_000_000, multipleOf: 1_000 });

      return {
        userId,
        roomTypeId,
        snapshotRoomTypeName: roomTypeName,
        checkInDate,
        checkOutDate,
        snapshotRoomPrice: new Decimal(snapshotRoomPriceNum),
        createdAt,
        numRooms: faker.number.int({ min: 1, max: 3 }),
        numAdults: faker.number.int({ min: 1, max: 6 }),
        numChildren: faker.number.int({ min: 1, max: 3 }),
        snapshotCheckInTime: randomQuarterTime({ minHour: 14, maxHour: 14 }),
        snapshotCheckOutTime: randomQuarterTime({ minHour: 11, maxHour: 12 }),
        customerName: `${faker.person.lastName()} ${faker.person.firstName()}`, // Vietnamese name order
        customerEmail: faker.internet.email(),
        customerPhone: faker.phone.number().replaceAll(' ', '').padEnd(10, '0'), // Limit to 10 digits for phone number
        status: "CHECKED_IN"
      };
    });

  const upcomingBookingInputs: Prisma.BookingCreateManyInput[] = pairs
    .slice(twoThird)
    .map(({ userId, roomTypeId, roomTypeName }) => {
      const checkInDate = faker.date.soon({ days: 10, refDate: today });
      // ensure checkOutDate is after checkInDate
      const checkOutDate = faker.date.soon({ days: 10, refDate: checkInDate });
      const createdAt = faker.date.recent({ refDate: today });
      const snapshotRoomPriceNum = faker.number.int({ min: 100_000, max: 1_000_000, multipleOf: 1_000 });

      return {
        userId,
        roomTypeId,
        snapshotRoomTypeName: roomTypeName,
        checkInDate,
        checkOutDate,
        snapshotRoomPrice: new Decimal(snapshotRoomPriceNum),
        createdAt,
        numRooms: faker.number.int({ min: 1, max: 3 }),
        numAdults: faker.number.int({ min: 1, max: 6 }),
        numChildren: faker.number.int({ min: 1, max: 3 }),
        snapshotCheckInTime: randomQuarterTime({ minHour: 14, maxHour: 14 }),
        snapshotCheckOutTime: randomQuarterTime({ minHour: 11, maxHour: 12 }),
        customerName: `${faker.person.lastName()} ${faker.person.firstName()}`, // Vietnamese name order
        customerEmail: faker.internet.email(),
        customerPhone: faker.phone.number().replaceAll(' ', '').padEnd(10, '0'), // Limit to 10 digits for phone number
        status: "PAID"
      };
    });

  const combinedInputs: Prisma.BookingCreateManyInput[] = [...pastBookingInputs, ...ongoingBookingInputs, ...upcomingBookingInputs];

  if (combinedInputs.length === 0) {
    return [];
  }

  return prisma.booking.createMany({
    data: combinedInputs,
    skipDuplicates: true,
  });
}

async function seedReviews() {
  console.log("Seeding reviews");
  const bookings = await prisma.booking.findMany({
    where: { status: "CHECKED_OUT", review: { is: null } },
    select: { id: true },
  });

  const reviews: Prisma.ReviewCreateManyInput[] = bookings.map(({ id }) => ({
    bookingId: id,
    rating: faker.number.int({ min: 1, max: 5 }),
    comment: faker.lorem.sentences(2),
    createdAt: faker.date.recent(),
  }));

  await prisma.review.createMany({
    data: reviews,
    skipDuplicates: true,
  });
}

export { seedBookings, seedReviews };