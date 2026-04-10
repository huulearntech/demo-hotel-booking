import { BedType, Hotel, HotelType, FacilityType, RoomType } from "@/lib/generated/prisma/client";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

import { fakerVI as faker } from "@faker-js/faker";
import { Decimal } from "@prisma/client/runtime/client";

// if Hotel model has a field of Unsupported (geolocation), Prisma will not allow to use create

async function seedHotels(data: { wardId: string, ownerId: string }[]) {
  if (data.length === 0) {
    console.warn("No data provided for seeding hotels.");
    return [];
  }

  const hotels: Prisma.HotelUncheckedCreateInput[] = data.map(({ wardId, ownerId }) => {
    // check-in between 10:00 and 12:00
    const checkInMinutes = faker.number.int({ min: 10 * 60, max: 12 * 60, multipleOf: 15 });
    // check-out at least 1 hour before check-in, at most 2 hours before
    const checkOutMinutes = Math.max(checkInMinutes - faker.number.int({ min: 60, max: 2 * 60, multipleOf: 15 }), 0);

    // Use UTC date to avoid timezone issues; date component is arbitrary for time-only storage
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth(); // zero-based
    const day = now.getUTCDate();

    const checkInDate = new Date(Date.UTC(year, month, day, Math.floor(checkInMinutes / 60), checkInMinutes % 60, 0));
    const checkOutDate = new Date(Date.UTC(year, month, day, Math.floor(checkOutMinutes / 60), checkOutMinutes % 60, 0));

    const checkInTime = checkInDate;
    const checkOutTime = checkOutDate;
    //-----------------------------------------------------

    return {
      name: faker.company.name(),
      ownerId,
      wardId,
      // limit coordinates to roughly the Hanoi area
      longitude: faker.number.float({ min: 105.7, max: 106.05, multipleOf: 0.000001 }),
      latitude: faker.number.float({ min: 20.85, max: 21.1, multipleOf: 0.000001 }),
      type: faker.helpers.arrayElement(Object.values(HotelType)),
      description: faker.lorem.paragraph(),
      reviewPoints: 0,
      numberOfReviews: 0,
      checkInTime,
      checkOutTime,
      breakfastAvailability: faker.datatype.boolean(), // TODO: Remove.
      imageUrls: faker.helpers.uniqueArray(() => faker.image.url({ width: 400, height: 300 }), 8),
    };
  }) ;

  return prisma.hotel.createManyAndReturn({
    data: hotels,
    skipDuplicates: true,
  });
}

async function seedRoomTypes(hotels: Hotel[]) {
  if (hotels.length === 0) {
    console.warn("No hotels provided for seeding room types.");
    return [];
  }
  const roomTypes: Prisma.RoomTypeUncheckedCreateInput[] = [];
  for (const hotel of hotels) {
    // generate an array of distinct noun-based type names for this hotel
    const typeCount = faker.number.int({ min: 3, max: 6 });
    const typeNames = faker.helpers.uniqueArray(
      () => faker.word.noun({ length: { min: 4, max: 10 } }),
      typeCount
    );

    typeNames.forEach((type) => {
      roomTypes.push({
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
  return prisma.roomType.createManyAndReturn({
    data: roomTypes,
    skipDuplicates: true,
  });
}

async function seedRooms(roomTypes: RoomType[]) {
  if (roomTypes.length === 0) {
    console.warn("No hotels provided for seeding rooms.");
    return [];
  }

  const rooms: Prisma.RoomUncheckedCreateInput[] = [];

  roomTypes.forEach((roomType) => {
    const roomCount = faker.number.int({ min: 3, max: 5 });
    for (let i = 0; i < roomCount; i++) {
      rooms.push({
        typeId: roomType.id,
        name: `${roomType.name} Room ${String(i + 1).padStart(3, "0")}`,
      });
    }
  });

  return prisma.room.createManyAndReturn({
    data: rooms,
    skipDuplicates: true,
  });
}

const inRoomFacilities: { name: string, type: FacilityType, iconUrl: string }[] = [
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
    name: "TV",
    type: "IN_ROOM",
    iconUrl: "https://s3-ap-southeast-1.amazonaws.com/cntres-assets-ap-southeast-1-250226768838-cf675839782fd369/imageResource/2016/12/21/1482301320867-9c8b0e5a4c8d9e5a2c8b0e5a4c8d9e5a.png"
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
  }
];

const nonInRoomFacilities: { name: string, type: FacilityType, iconUrl: string }[] = [
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
  const result = await prisma.facility.createManyAndReturn({
    data: [...inRoomFacilities, ...nonInRoomFacilities],
    skipDuplicates: true,
  });

  return result;
}

async function seedConnectionHotelsOnFacilities(hotels: Hotel[]) {
  if (hotels.length === 0) {
    console.warn("No hotels provided for seeding hotel-facility connections.");
    return;
  }

  await Promise.all(
    hotels.map(async (hotel) => {
      // pick at least 3 distinct facilities for each hotel
      const hotelFacilities = faker.helpers.arrayElements(
        nonInRoomFacilities,
        faker.number.int({ min: 3, max: nonInRoomFacilities.length })
      );

      try {
        await prisma.hotel.update({
          where: { id: hotel.id },
          data: {
            facilities: {
              // use connectOrCreate to be idempotent whether facilities already exist or not
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
}

async function seedConnectionRoomTypesOnFacilities(roomTypes: RoomType[]) {
  if (roomTypes.length === 0) {
    console.warn("No roomTypes provided for seeding roomType-facility connections.");
    return;
  }

  await Promise.all(
    roomTypes.map(async (roomType) => {
      // pick at least 2 distinct in-room facilities for each room
      const roomFacilities = faker.helpers.arrayElements(
        inRoomFacilities,
        faker.number.int({ min: 2, max: inRoomFacilities.length })
      );

      try {
        await prisma.roomType.update({
          where: { id: roomType.id },
          data: {
            facilities: {
              // use connectOrCreate to be idempotent whether facilities already exist or not
              connectOrCreate: roomFacilities.map((f) => ({
                where: { name: f.name },
                create: f,
              })),
            },
          },
        });
      } catch (error) {
        console.error(`Failed to attach facilities to room ${roomType.id}:`, error);
      }
    })
  );
}

export {
  seedHotels,
  seedRoomTypes,
  seedRooms,
  seedFacilities,
  seedConnectionHotelsOnFacilities,
  seedConnectionRoomTypesOnFacilities
};