import { BookingMetadata, BookingStatus, Prisma, RoomType, User } from "@/lib/generated/prisma/client";
import { Decimal } from "@prisma/client/runtime/client";

import prisma from "@/lib/prisma";

import { fakerVI as faker } from "@faker-js/faker";

async function seedBookingsMetadata(users: User[], roomTypes: RoomType[]) {
  if (users.length === 0 || roomTypes.length === 0) {
    console.warn("No data provided for seeding bookings. Skipping.");
    return [];
  }

  // Decide how many metadata entries to create (sample portion)
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

  const half = Math.floor(pairs.length / 2);
  const today = new Date();

  const pastBookingsInputs: Prisma.BookingMetadataCreateInput[] = pairs
    .slice(0, half)
    .map(({ userId, roomTypeId, roomTypeName }) => {
      const checkOutDate = faker.date.recent({ refDate: today });
      const checkInDate = faker.date.recent({ days: 10, refDate: checkOutDate });
      const createdAt = faker.date.recent({ refDate: checkInDate });
      const snapshotRoomPriceNum = faker.number.int({ min: 100_000, max: 1_000_000, multipleOf: 1_000 });

      return {
        user: { connect: { id: userId } },
        roomType: { connect: { id: roomTypeId } },
        snapshotRoomTypeName: roomTypeName,
        checkInDate,
        checkOutDate,
        snapshotRoomPrice: new Decimal(snapshotRoomPriceNum),
        createdAt,
        numRooms: faker.number.int({ min: 1, max: 3 }),
        numAdults: faker.number.int({ min: 1, max: 6 }),
        numChildren: faker.number.int({ min: 1, max: 3 }),
        snapshotCheckInTime: faker.date.between({ from: checkInDate, to: checkOutDate }), // FIXME: this is time in the day, not some bullshit AI gave. 
        snapshotCheckOutTime: faker.date.between({ from: checkInDate, to: checkOutDate }),
      };
    });

  const upcomingBookingsInputs: Prisma.BookingMetadataCreateInput[] = pairs
    .slice(half)
    .map(({ userId, roomTypeId, roomTypeName }) => {
      const checkInDate = faker.date.soon({ days: 10, refDate: today });
      // ensure checkOutDate is after checkInDate
      const checkOutDate = faker.date.soon({ days: 10, refDate: checkInDate });
      const createdAt = faker.date.recent({ refDate: today });
      const snapshotRoomPriceNum = faker.number.int({ min: 100_000, max: 1_000_000, multipleOf: 1_000 });

      return {
        user: { connect: { id: userId } },
        roomType: { connect: { id: roomTypeId } },
        snapshotRoomTypeName: roomTypeName,
        checkInDate,
        checkOutDate,
        snapshotRoomPrice: new Decimal(snapshotRoomPriceNum),
        createdAt,
        numRooms: faker.number.int({ min: 1, max: 3 }),
        numAdults: faker.number.int({ min: 1, max: 6 }),
        numChildren: faker.number.int({ min: 1, max: 3 }),
        snapshotCheckInTime: faker.date.between({ from: checkInDate, to: checkOutDate }),
        snapshotCheckOutTime: faker.date.between({ from: checkInDate, to: checkOutDate }),
      };
    });

  const combinedInputs = [...pastBookingsInputs, ...upcomingBookingsInputs];

  if (combinedInputs.length === 0) {
    return [];
  }

  // Insert all records in a single transaction and return created rows
  const created = await prisma.$transaction(
    combinedInputs.map((input) => prisma.bookingMetadata.create({ data: input }))
  );

  return created as BookingMetadata[];
}

async function seedBookings(bookingsMetadata: BookingMetadata[]) {
  if (bookingsMetadata.length === 0) {
    console.warn("No data provided for seeding bookings. Skipping.");
    return [];
  }

  const data: Prisma.BookingUncheckedCreateInput[] = bookingsMetadata.map(({ id: metadataId, checkInDate }) => {
    return {
      metadataId,
      customerName: `${faker.person.firstName()} ${faker.person.lastName()}`,
      customerEmail: faker.internet.email(),
      customerPhone: faker.phone.number(),
      status: faker.helpers.arrayElement(["CANCELLED", "COMPLETED"] as BookingStatus[]),
      createdAt: faker.date.recent({ refDate: checkInDate }),
    };
  });

  const shuffledData = faker.helpers.shuffle(data).slice(0, Math.floor(data.length * 0.8));

  return prisma.booking.createMany({
    data: shuffledData,
    skipDuplicates: true,
  });
}

async function seedReviews() {
  const bookings = await prisma.booking.findMany({
    where: { status: "COMPLETED", review: { is: null } },
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

export { seedBookingsMetadata, seedBookings, seedReviews };