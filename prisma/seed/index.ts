import "dotenv/config";
import prisma from "@/lib/prisma";

import { seedAddress } from "./address";
import { seedRegularUsers } from "./user";
import { seedConnectionHotelsOnFacilities, seedConnectionRoomTypesOnFacilities, seedFacilities, seedHotels, seedRooms, seedRoomTypes } from "./hotel";
import { seedBookings, seedReviews } from "./booking";


// TODO: should only seed for things that are generated in each run,
// instead of seeding all data every time (e.g. facilities on hotels or roomtypes relation are heavy to seed)

const run = async (label: string, fn: () => Promise<any>) => {
  const start = process.hrtime.bigint();
  console.log(`Seeding ${label}...`);
  await fn();
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;
  console.log(`Finished ${label} in ${elapsedMs.toFixed(2)}ms`);
};

async function main() {
  console.log("Seeding database...");

  await run("address", seedAddress);
  await run("facilities", seedFacilities);
  await run("hotels", seedHotels);
  await run("room types", seedRoomTypes);
  await run("hotel-facilities connections", seedConnectionHotelsOnFacilities);
  await run("rooms", seedRooms);
  await run("roomtype-facilities connections", seedConnectionRoomTypesOnFacilities);
  await run("regular users (20)", () => seedRegularUsers(10));
  await run("bookings", seedBookings);
  await run("reviews", seedReviews);

  // await run("test cron", async () => fetch("http://localhost:3000/api/cron", {
  //   method: "GET",
  //   headers: {
  //     Authorization: `Bearer ${process.env.CRON_SECRET}`,
  //   },
  // }));

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