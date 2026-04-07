import prisma from "@/lib/prisma";

import { seedCountryVietnam, seedProvinces, seedDistricts, seedWards } from "./address";
import { seedAdmin, seedHotelOwners, seedRegularUsers } from "./user";
import { seedConnectionHotelsOnFacilities, seedConnectionRoomTypesOnFacilities, seedFacilities, seedHotels, seedRooms, seedRoomTypes } from "./hotel";
import { seedBookings, seedBookingsMetadata, seedReviews } from "./booking";

import { faker } from "@faker-js/faker";

async function main() {
  if (process.env.NODE_ENV !== "development") {
    console.warn("Seeding is only allowed in development environment.");
    return;
  }

  console.log("Seeding database...");

  const Vietnam = await seedCountryVietnam();
  const provinces = await seedProvinces(Vietnam, 5);
  const districts = await seedDistricts(provinces, 5);
  const wards = await seedWards(districts, 5);
  
  const hotelOwners = await seedHotelOwners(125);

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
  const bookingsMetadata = await seedBookingsMetadata(users, roomTypes);
  await seedBookings(bookingsMetadata);
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