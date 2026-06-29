import { fakerVI as faker } from "@faker-js/faker";
import { Decimal } from "@prisma/client/runtime/client";
import fs from "fs";
import path from "path";

import { BedType, HotelType, FacilityType } from "@/lib/generated/prisma/client";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

import { randomQuarterTime } from "./booking";
import { seedHotelOwners } from "./user";

// if Hotel model has a field of Unsupported (geolocation), Prisma will not allow to use create

async function seedHotels() {
  const wardCodes: string[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, "address-json", "wards-of-type-phuong.json"), "utf-8")
  );
  const wards = await prisma.ward.findMany({
    where: { code: { in: wardCodes } },
    select: { id: true, code: true, centroidLng: true, centroidLat: true },
  });

  const BATCH_SIZE = 20;
  const buffer: Prisma.HotelUncheckedCreateInput[] = [];

  async function flushBuffer() {
    while (buffer.length > 0) {
      const chunk = buffer.splice(0, Math.min(BATCH_SIZE, buffer.length));
      try {
        await prisma.hotel.createMany({
          data: chunk,
          skipDuplicates: true,
        });
      } catch (error) {
        console.error("Failed creating hotel batch:", error);
      }
    }
  }

  for (const ward of wards.slice(0, 50)) { // TODO: remove test.
    const hotelCount = faker.number.int({ min: 3, max: 5 });
    const owners = await seedHotelOwners(hotelCount);

    const { centroidLng, centroidLat } = ward;
    for (const owner of owners) {
      const checkInTime = randomQuarterTime({ minHour: 14, maxHour: 14 });
      const checkOutTime = randomQuarterTime({ minHour: 12, maxHour: 12 });

      // coordinates near ward centroid
      const longitude = centroidLng + faker.number.float({ min: -0.003, max: 0.003, multipleOf: 0.000001 });
      const latitude = centroidLat + faker.number.float({ min: -0.003, max: 0.003, multipleOf: 0.000001 });

      buffer.push({
        name: faker.company.name(),
        ownerId: owner.id,
        wardId: ward.id,
        longitude,
        latitude,
        type: faker.helpers.arrayElement(Object.values(HotelType)),
        description: faker.lorem.paragraph(),
        rating: 0,
        numberOfReviews: 0,
        checkInTime,
        checkOutTime,
        imageUrls: faker.helpers.uniqueArray(() => faker.image.url({ width: 400, height: 300 }), 8),
        status: "ACTIVE",
      });
    }

    // flush if buffer grows large to limit memory/DB pressure
    if (buffer.length >= BATCH_SIZE) {
      await flushBuffer();
    }
  }

  // flush any remaining hotels
  if (buffer.length > 0) {
    await flushBuffer();
  }
}

async function seedRoomTypes() {
  const BATCH_SIZE = 20;
  let lastId: string | undefined = undefined;

  while (true) {
    const hotels: { id: string; name: string }[] = await prisma.hotel.findMany({
      take: BATCH_SIZE,
      ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });

    if (hotels.length === 0) break;

    const roomTypesBatch: Prisma.RoomTypeUncheckedCreateInput[] = [];

    for (const hotel of hotels) {
      const typeCount = faker.number.int({ min: 3, max: 6 });
      const typeNames = faker.helpers.uniqueArray(
        () => faker.word.noun({ length: { min: 4, max: 10 } }),
        typeCount
      );

      typeNames.forEach((type) => {
        roomTypesBatch.push({
          hotelId: hotel.id,
          name: type,
          description: `A ${type.toLowerCase()} room at ${hotel.name}`,
          adultCapacity: faker.number.int({ min: 1, max: 4 }),
          childrenCapacity: faker.number.int({ min: 0, max: 4 }),
          price: new Decimal(faker.number.int({ min: 100_000, max: 500_000, multipleOf: 1_000 })),
          areaM2: faker.number.int({ min: 20, max: 100 }),
          bedType: faker.helpers.arrayElement(Object.values(BedType)),
          imageUrls: faker.helpers.uniqueArray(() => faker.image.url({ width: 400, height: 300 }), 1),
        });
      });
    }

    if (roomTypesBatch.length > 0) {
      try {
        await prisma.roomType.createMany({
          data: roomTypesBatch,
          skipDuplicates: true,
        });
      } catch (error) {
        console.error("Failed creating room types for batch:", error);
      }
    }

    // advance cursor to last hotel's id in this batch
    lastId = hotels[hotels.length - 1].id;
  }
}
async function seedRooms() {
  const BATCH_SIZE = 20;
  let lastId: string | undefined = undefined;

  while (true) {
    const roomTypes: { id: string, name: string }[] = await prisma.roomType.findMany({
      take: BATCH_SIZE,
      ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });

    if (roomTypes.length === 0) break;

    const roomsBatch: Prisma.RoomUncheckedCreateInput[] = [];

    for (const roomType of roomTypes) {
      const roomCount = faker.number.int({ min: 3, max: 5 });
      for (let i = 0; i < roomCount; i++) {
        roomsBatch.push({
          typeId: roomType.id,
          name: `${roomType.name} Room ${String(i + 1).padStart(3, "0")}`,
        });
      }
    }

    if (roomsBatch.length > 0) {
      try {
        await prisma.room.createMany({
          data: roomsBatch,
          skipDuplicates: true,
        });
      } catch (error) {
        console.error("Failed creating rooms for batch:", error);
      }
    }

    lastId = roomTypes[roomTypes.length - 1].id;
  }
}

// TODO: vietnamese translation.
const inRoomFacilities: { name: string, type: FacilityType, iconUrl?: string }[] = [
  {
    name: "Air Conditioning",
    type: "IN_ROOM",
    iconUrl: "https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2016/12/21/1482301285653-0a04df7d3f807b32484ceec10d9681c6.png"
  },
  {
    name: "Free Wi-Fi",
    type: "IN_ROOM",
    iconUrl: "https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2017/06/07/1496833833458-7b6ab67bc5df6ef9f2caee150aae1f43.png"
  },
  {
    name: "Hot Water",
    type: "IN_ROOM",
    iconUrl: "https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2018/08/13/1534147489460-b62e4ca2f5c93564882ab0fbea1d16f0.png"
  },
  {
    name: "Shower",
    type: "IN_ROOM",
    iconUrl: "https://ik.imagekit.io/tvlk/image/imageResource/2023/07/27/1690451958285-43836c7e0f5321b394371359084fbb6b.png?tr=h-16,q-75,w-16"
  },
  {
    name: "Balcony",
    type: "IN_ROOM",
    iconUrl: "https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2018/08/13/1534147373188-9497feecd14858865cc5a7e42d79da3f.png"
  },
  {
    name: "Bath Tub",
    type: "IN_ROOM",
    iconUrl: "https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2018/08/13/1534147032878-74c93691dc0791ceb2fd76093c27b200.png"
  },
];

const nonInRoomFacilities: { name: string, type: FacilityType, iconUrl?: string }[] = [
  {
    name: "Free Public Wi-Fi",
    type: "PUBLIC",
    iconUrl: "https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2017/06/07/1496833833458-7b6ab67bc5df6ef9f2caee150aae1f43.png"
  },
  {
    name: "Swimming Pool",
    type: "PUBLIC",
    iconUrl: "https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2017/06/07/1496833772013-929572dff57d1755878aa79dc46e6be5.png"
  },
  {
    name: "Restaurant",
    type: "PUBLIC",
    iconUrl: "https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2017/06/07/1496833794378-eb51eee62d46110b712e327108299ea6.png"
  },
  {
    name: "24-hour Front Desk",
    type: "HOTEL_SERVICES",
    iconUrl: "https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2016/12/21/1482301381776-c014a3111a6de5236d903c93b7647e4c.png"
  },
  {
    name: "Elevator",
    type: "PUBLIC",
    iconUrl: "https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2017/06/07/1496833714411-48c9b7565018d02dc32837738df1c917.png"
  },
  {
    name: "Parking",
    type: "PUBLIC",
    iconUrl: "https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2017/06/07/1496833756238-56e24fb64a964d38b8f393bf093a77a9.png"
  },
];

async function seedFacilities() {
  await prisma.commonFacility.createMany({
    data: [...inRoomFacilities, ...nonInRoomFacilities],
    skipDuplicates: true,
  });
}

async function seedConnectionHotelsOnFacilities() {
  const BATCH_SIZE = 20;
  const allFacilities = await prisma.commonFacility.findMany({ select: { id: true, name: true, type: true } });
  const nonInRoomFacilities = allFacilities.filter(f => f.type !== "IN_ROOM");

  let lastId: string | undefined = undefined;

  while (true) {
    const hotels: { id: string }[] = await prisma.hotel.findMany({
      take: BATCH_SIZE,
      ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
      select: { id: true },
      orderBy: { id: "asc" },
    });

    if (hotels.length === 0) {
      break;
    }
    const endId = hotels[hotels.length - 1].id;

    // attach at least 5 distinct non in-room facilities to each hotel using per-hotel updates
    await Promise.all(
      hotels.map(async (hotel) => {
        const hotelFacilities = faker.helpers.arrayElements(
          nonInRoomFacilities,
          faker.number.int({ min: 5, max: nonInRoomFacilities.length })
        );

        try {
          await prisma.hotel.update({
            where: { id: hotel.id },
            data: {
              facilities: {
                connectOrCreate: hotelFacilities.map((f) => ({
                  where: { name: f.name },
                  create: f,
                })),
              },
            },
          });
        } catch (error) {
          console.error(`Failed to attach facilities to hotel ${hotel.id}:`, error);
        }
      })
    );

    lastId = endId;
  }
}

async function seedConnectionRoomTypesOnFacilities() {
  const BATCH_SIZE = 20;
  let lastId: string | undefined = undefined;

  while (true) {
    const roomTypes: { id: string; name: string }[] = await prisma.roomType.findMany({
      take: BATCH_SIZE,
      ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });

    if (roomTypes.length === 0) {
      break;
    }

    await Promise.all(
      roomTypes.map(async (roomType) => {
        const roomFacilities = faker.helpers.arrayElements(
          inRoomFacilities,
          faker.number.int({ min: 3, max: inRoomFacilities.length })
        );

        try {
          await prisma.roomType.update({
            where: { id: roomType.id },
            data: {
              facilities: {
                connectOrCreate: roomFacilities.map((f) => ({
                  where: { name: f.name },
                  create: f,
                })),
              },
            },
          });
        } catch (error) {
          console.error(`Failed to attach facilities to roomType ${roomType.id}:`, error);
        }
      })
    );

    lastId = roomTypes[roomTypes.length - 1].id;
  }
}

export {
  seedHotels,
  seedRoomTypes,
  seedRooms,
  seedFacilities,
  seedConnectionHotelsOnFacilities,
  seedConnectionRoomTypesOnFacilities
};