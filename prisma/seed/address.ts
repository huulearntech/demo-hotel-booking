import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";


type AddressRecord = {
  code: string;
  name: string;
  centroid: [number, number];
};

type ProvinceRecords = AddressRecord[];
type DistrictRecords = Record<string, AddressRecord[]>;
type WardRecords = Record<string, AddressRecord[]>;

function loadAddressRecords<T>(fileName: string): T {
  const filePath = path.join(__dirname, "address-json", fileName);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function seedAddress() {
  console.log("Seeding country: Vietnam");
  const { id: countryId } = await prisma.country.upsert({
    where: { name: "Việt Nam" },
    update: {},
    create: { name: "Việt Nam" },
    select: { id: true },
  });


  console.log("Seeding provinces from JSON");
  const provinces = loadAddressRecords<ProvinceRecords>("provinces.json");
  await prisma.province.createMany({
    data: provinces.map((province) => ({
      countryId,
      name: province.name,
      code: province.code,
      centroidLng: province.centroid[0],
      centroidLat: province.centroid[1],
    })),
    skipDuplicates: true,
  });


  console.log("Seeding districts from JSON");
  const districtsByProvince = loadAddressRecords<DistrictRecords>("districts.json");
  for (const provinceCode in districtsByProvince) {
    const province = await prisma.province.findUnique({
      where: {
        code_countryId: {
          code: provinceCode,
          countryId,
        }
      }
    });
    if (!province) {
      console.warn(`Province with code ${provinceCode} not found. Skipping its districts.`);
      continue;
    }

    const districts = districtsByProvince[provinceCode];
    await prisma.district.createMany({
      data: districts.map((district) => ({
        provinceId: province.id,
        name: district.name,
        code: district.code,
        centroidLng: district.centroid[0],
        centroidLat: district.centroid[1],
      })),
      skipDuplicates: true,
    });
  }


  console.log("Seeding wards from JSON");
  const wardsByDistrict = loadAddressRecords<WardRecords>("wards.json");
  for (const districtCode in wardsByDistrict) {
    const district = await prisma.district.findFirst({
      where: { code: districtCode },
    });
    if (!district) {
      console.warn(`District with code ${districtCode} not found. Skipping its wards.`);
      continue;
    }

    const wards = wardsByDistrict[districtCode];
    await prisma.ward.createMany({
      data: wards.map((ward) => ({
        districtId: district.id,
        name: ward.name,
        code: ward.code,
        centroidLng: ward.centroid[0],
        centroidLat: ward.centroid[1],
      })),
      skipDuplicates: true,
    });
  }
}

export { seedAddress };