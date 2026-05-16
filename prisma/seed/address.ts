import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";


type AddressRecord = {
  code: string;
  name: string;
  type: string;
  centroid: [number, number];
};

type ProvinceRecords = AddressRecord[];
type WardRecords = Record<string, AddressRecord[]>;

function loadAddressRecords<T>(fileName: string): T {
  const filePath = path.join(__dirname, "address-json", fileName);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function seedAddress() {
  const { id: countryId } = await prisma.country.upsert({
    where: { name: "Việt Nam" },
    update: {},
    create: { name: "Việt Nam" },
    select: { id: true },
  });


  const provinces = loadAddressRecords<ProvinceRecords>("provinces.json");
  await prisma.province.createMany({
    data: provinces.map((province) => ({
      countryId,
      name: province.name,
      code: province.code,
      type: province.type,
      centroidLng: province.centroid[0],
      centroidLat: province.centroid[1],
    })),
    skipDuplicates: true,
  });


  const wardsByProvince = loadAddressRecords<WardRecords>("wards.json");
  for (const provinceCode in wardsByProvince) {
    const province = await prisma.province.findFirst({
      where: { code: provinceCode },
      select: { id: true },
    });
    if (!province) {
      continue;
    }

    const wards = wardsByProvince[provinceCode];
    await prisma.ward.createMany({
      data: wards.map((ward) => ({
        provinceId: province.id,
        name: ward.name,
        code: ward.code,
        type: ward.type,
        centroidLng: ward.centroid[0],
        centroidLat: ward.centroid[1],
      })),
      skipDuplicates: true,
    });
  }
}

export { seedAddress };