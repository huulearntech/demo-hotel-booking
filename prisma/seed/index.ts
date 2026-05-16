import "dotenv/config";
import prisma from "@/lib/prisma";

import { seedAddress } from "./address";
import { seedRegularUsers } from "./user";
import { seedConnectionHotelsOnFacilities, seedConnectionRoomTypesOnFacilities, seedFacilities, seedHotels, seedRooms, seedRoomTypes } from "./hotel";
import { seedBookings, seedReviews } from "./booking";


// TODO: should only seed for things that are generated in each run,
// instead of seeding all data every time (e.g. facilities on hotels or roomtypes relation are heavy to seed)
async function main() {
  console.log("Seeding database...");

  await seedAddress();

  await seedFacilities();

  await seedHotels();

  await seedRoomTypes();

  await seedConnectionHotelsOnFacilities();

  await seedRooms();

  await seedConnectionRoomTypesOnFacilities();

  await seedRegularUsers(20);

  await seedBookings();

  await seedReviews();

  // await seedAdmin(); // TODO: later when we have an admin dashboard
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });