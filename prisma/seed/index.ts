import prisma from "@/lib/prisma";

import { seedCountryVietnam, seedProvinces, seedDistricts, seedWards } from "./address";
import { seedAdmin, seedHotelOwners, seedRegularUsers } from "./user";
import { seedConnectionHotelsOnFacilities, seedConnectionRoomTypesOnFacilities, seedFacilities, seedHotels, seedRooms, seedRoomTypes } from "./hotel";
import { seedBookings, seedReviews } from "./booking";

import { faker } from "@faker-js/faker";

async function main() {
  if (process.env.NODE_ENV !== "development") {
    console.warn("Seeding is only allowed in development environment.");
    return;
  }

  console.log("Seeding database...");

  const Vietnam = await seedCountryVietnam();
  const provinces = await seedProvinces(Vietnam, 3);
  const districts = await seedDistricts(provinces, 3);
  const wards = await seedWards(districts, 3);
  
  const hotelOwners = await seedHotelOwners(27);

  const shuffledWards = faker.helpers.shuffle(wards);
  const hotelData = hotelOwners.map((owner, idx) => ({
    wardId: shuffledWards[idx % shuffledWards.length].id,
    ownerId: owner.id,
  }));

  await seedFacilities();

  const hotels = await seedHotels(hotelData);
  const roomTypes = await seedRoomTypes(hotels);
  await seedRooms(roomTypes);
  const users = await seedRegularUsers(10);
  await seedConnectionHotelsOnFacilities(hotels);
  await seedConnectionRoomTypesOnFacilities(roomTypes);
  await seedBookings(users, roomTypes);
  await seedReviews();
  await seedAdmin();

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