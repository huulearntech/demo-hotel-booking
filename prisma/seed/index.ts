import "dotenv/config";
import prisma from "@/lib/prisma";

import { seedAddress } from "./address";
import { seedRegularUsers } from "./user";
import { seedConnectionHotelsOnFacilities, seedConnectionRoomTypesOnFacilities, seedFacilities, seedHotels, seedRooms, seedRoomTypes } from "./hotel";
import { seedBookings, seedReviews } from "./booking";


async function main() {
  if (process.env.NODE_ENV !== "development") {
    console.warn("Seeding is only allowed in development environment.");
    return;
  }

  let last = process.hrtime.bigint() 
  console.log("Seeding database...");

  // await seedAddress();
  // console.log("Seeded address data after", (process.hrtime.bigint() - last) / BigInt(1e6), "ms");
  // last = process.hrtime.bigint();

  // await seedFacilities();
  // console.log("Seeded facilities after", (process.hrtime.bigint() - last) / BigInt(1e6), "ms");
  // last = process.hrtime.bigint();

  // await seedHotels();
  // console.log("Seeded hotels after", (process.hrtime.bigint() - last) / BigInt(1e6), "ms");
  // last = process.hrtime.bigint();

  // await seedRoomTypes();
  // console.log("Seeded room types after", (process.hrtime.bigint() - last) / BigInt(1e6), "ms");
  // last = process.hrtime.bigint();

  // await seedConnectionHotelsOnFacilities();
  // console.log("Seeded hotel-facility connections after", (process.hrtime.bigint() - last) / BigInt(1e6), "ms");
  // last = process.hrtime.bigint();

  // await seedRooms();
  // console.log("Seeded rooms after", (process.hrtime.bigint() - last) / BigInt(1e6), "ms");
  // last = process.hrtime.bigint();

  // await seedConnectionRoomTypesOnFacilities();
  // console.log("Seeded room type-facility connections after", (process.hrtime.bigint() - last) / BigInt(1e6), "ms");
  // last = process.hrtime.bigint();

  // await seedRegularUsers(20);
  // await seedBookings();
  console.log("Seeded bookings (paginated) after", );

  await seedReviews();
  // await seedAdmin(); // TODO: later when we have an admin dashboard

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

async function deleteAllData(): Promise<void> {
  await prisma.country.deleteMany();
  await prisma.province.deleteMany();
  await prisma.district.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.user.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.room.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
}

// Uncomment this function call to delete all data before seeding.
// Be careful, this will irreversibly delete all data in the database.
// deleteAllData()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });