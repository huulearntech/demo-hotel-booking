import { UserRole } from "@/lib/generated/prisma/enums";
import prisma from "@/lib/prisma";

import { fakerVI as faker } from "@faker-js/faker";

async function seedRegularUsers(count = 10) {
  const users = Array.from({ length: count }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    role: UserRole.USER,
    profileImageUrl: faker.image.avatar(),
  })) satisfies NonNullable<Parameters<typeof prisma.user.createMany>[0]>["data"];
  
  if (process.env.FAKE_USER_NAME && process.env.FAKE_USER_EMAIL && process.env.FAKE_USER_PASSWORD) {
    users.push({
      name: process.env.FAKE_USER_NAME,
      email: process.env.FAKE_USER_EMAIL,
      password: process.env.FAKE_USER_PASSWORD,
      role: UserRole.USER,
      profileImageUrl: faker.image.avatar(),
    });
  } else {
    console.warn("fake user name is not set.")
  }

  return await prisma.user.createManyAndReturn({
    data: users,
    skipDuplicates: true, // In case you run the seeding multiple times
  });
}

async function seedHotelOwners(count = 5) {
  const users = Array.from({ length: count }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    role: UserRole.HOTEL_OWNER,
    profileImageUrl: faker.image.avatar(),
  }));

  if (process.env.FAKE_HOTEL_OWNER_NAME && process.env.FAKE_HOTEL_OWNER_EMAIL && process.env.FAKE_HOTEL_OWNER_PASSWORD) {
    users.push({
      name: "owner",
      email: "owner@owner.owner",
      password: "password",
      role: UserRole.HOTEL_OWNER,
      profileImageUrl: faker.image.avatar(),
    });
  } else {
    console.warn("fake hotel owner name is not set.")
  }

  return await prisma.user.createManyAndReturn({
    data: users,
    skipDuplicates: true, // In case you run the seeding multiple times
  });
}

async function seedAdmin() {
  if (process.env.FAKE_ADMIN_NAME && process.env.FAKE_ADMIN_EMAIL && process.env.FAKE_ADMIN_PASSWORD) {
    const admin = {
      name: process.env.FAKE_ADMIN_NAME,
      email: process.env.FAKE_ADMIN_EMAIL,
      password: process.env.FAKE_ADMIN_PASSWORD,
      role: UserRole.ADMIN,
      profileImageUrl: faker.image.avatar(),
    };

    await prisma.user.create({
      data: admin,
    });
  } else {
    console.warn("fake admin name is not set.")
    return;
  }
}

export { seedHotelOwners, seedRegularUsers, seedAdmin};