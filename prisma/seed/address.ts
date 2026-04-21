import { fakerVI as faker } from "@faker-js/faker";

import prisma from "@/lib/prisma";
import { Country, District, Province } from "@/lib/generated/prisma/client";

// Seed Vietnam as the only country for simplicity
async function seedCountryVietnam() {
  console.log("Seeding country: Vietnam");
  return await prisma.country.upsert({
    where: { name: "Vietnam" },
    update: {}, // No updates needed, we just want to ensure it exists
    create: {
      name: "Vietnam",
    },
  });
}

async function seedProvinces(country: Country, count = 5) {
  console.log("Seeding provinces");
  const provinces = Array.from({ length: count }, () => ({
    countryId: country.id,
    name: faker.location.city(),
  }));
  return await prisma.province.createManyAndReturn({
    data: provinces,
    skipDuplicates: true, // In case you run the seeding multiple times
  });
}

async function seedDistricts(provinces: Province[], countPerProvince = 5) {
  console.log("Seeding districts");
  if (provinces.length === 0) {
    console.warn("No provinces found. Skipping district seeding.");
    return [];
  }

  const districtNames = faker.helpers.uniqueArray(faker.location.county, provinces.length * countPerProvince);

  const districts = provinces.flatMap((province) =>
    Array.from({ length: countPerProvince }, () => ({
      provinceId: province.id,
      name: districtNames.pop() || faker.location.county(),
    }))
  )

  return await prisma.district.createManyAndReturn({
    data: districts,
    skipDuplicates: true, // In case you run the seeding multiple times
  });
}

async function seedWards(districts: District[], countPerDistrict = 5) {
  console.log("Seeding wards");
  if (districts.length === 0) {
    console.warn("No districts found. Skipping ward seeding.");
    return [];
  }

  const wardNames = faker.helpers.uniqueArray(faker.location.street, districts.length * countPerDistrict);


  const wards = districts.flatMap((district) =>
    Array.from({ length: countPerDistrict }, () => ({
      districtId: district.id,
      name: wardNames.pop() || faker.location.street(),
    }))
  );

  return await prisma.ward.createManyAndReturn({
    data: wards,
    skipDuplicates: true, // In case you run the seeding multiple times
  });
}


export { seedCountryVietnam, seedProvinces, seedDistricts, seedWards };