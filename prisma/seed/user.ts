import { UserRole, UserStatus } from "@/lib/generated/prisma/enums";
import prisma from "@/lib/prisma";

import { fakerVI as faker } from "@faker-js/faker";

async function seedRegularUsers(count = 10) {
  console.log("Seeding regular users");
  const users = Array.from({ length: count }, () => ({
    name: `${faker.person.lastName()} ${faker.person.firstName()}`, // Vietnamese name order
    email: faker.internet.email(),
    password: faker.internet.password(),
    role: UserRole.USER,
    profileImageUrl: faker.image.avatar(),
  })) satisfies NonNullable<Parameters<typeof prisma.user.createMany>[0]>["data"];
  
  await prisma.user.createMany({
    data: users,
    skipDuplicates: true, // In case you run the seeding multiple times
  });
}

async function seedHotelOwners(count = 5) {
  const users = Array.from({ length: count }, () => ({
    name: `${faker.person.lastName()} ${faker.person.firstName()}`, // Vietnamese name order
    email: faker.internet.email(),
    password: faker.internet.password(),
    role: UserRole.HOTEL_OWNER,
    profileImageUrl: faker.image.avatar(),
    status: "ACTIVE" as UserStatus,
  }));

  return await prisma.user.createManyAndReturn({
    data: users,
    skipDuplicates: true, // In case you run the seeding multiple times
    select: { id: true },
  });
}

async function seedAdmin() {
  console.log("Seeding admin user");
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