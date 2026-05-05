// NOTE: Not implement "nearby" yet. To busy man.
import { differenceInDays } from "date-fns";
import { z } from "zod";

const locationTypes = ["none", "province", "district", "ward", "hotel", "nearby"] as const;
export type SearchBar_LocationType = typeof locationTypes[number];

export const schema_searchBar = z.object({
  location: z.object({
    type: z.enum(locationTypes),
    id: z.string()
  }).superRefine(({ type, id }, ctx) => {
    if (type === "none" || id === "") {
      ctx.addIssue({
        code: "custom",
        message: "Vui lòng chọn địa điểm",
      });
    }
  }),
  inOutDates: z.object({
    from: z.date(),
    to: z.date(),
  }).superRefine(({ from, to }, ctx) => {
    if (from > to) {
      ctx.addIssue({
        code: "custom",
        message: "Ngày nhận phòng phải trước ngày trả phòng",
      });
    }
  }),
  guestsAndRooms: z.object({
    numAdults: z.number().min(1).max(30),
    numChildren: z.number().min(0).max(6),
    numRooms: z.number().min(1).max(30),
  }).superRefine(({ numAdults, numRooms }, ctx) => {
    if (numRooms > numAdults) {
      ctx.addIssue({
        code: "custom",
        message: "Số phòng không được nhiều hơn số khách người lớn",
      });
    }
  }),
});


export type SearchBar_FormInput = z.input<typeof schema_searchBar>;
export type SearchBar_FormOutput = z.output<typeof schema_searchBar>;

// TODO: Name these types better. These are used for encoding/decoding search params in URL, so they are all strings. But the naming is not great.
export type SearchSpec_Params = {
  locationId: string,
  locationType: SearchBar_LocationType,
  checkInDate: string,
  checkOutDate: string,
  numAdults: string,
  numChildren: string,
  numRooms: string,
}

export function toYYYY_MM_DD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const codec_SearchSpec_Params = z.codec(
  z.object({
    locationId: z.string(),
    locationType: z.enum(locationTypes),
    checkInDate: z.iso.date(),
    checkOutDate: z.iso.date(),
    numAdults: z.string(),
    numChildren: z.string(),
    numRooms: z.string(),
  }),
  schema_searchBar,
  {
    encode(data: SearchBar_FormInput) {
      console.log("Encoding search params:", data);
      return {
        locationId: data.location.id,
        locationType: data.location.type,
        checkInDate: toYYYY_MM_DD(data.inOutDates.from),
        checkOutDate: toYYYY_MM_DD(data.inOutDates.to),
        numAdults: data.guestsAndRooms.numAdults.toString(),
        numChildren: data.guestsAndRooms.numChildren.toString(),
        numRooms: data.guestsAndRooms.numRooms.toString(),
      };
    },

    decode(input: SearchSpec_Params): SearchBar_FormInput {
      const {
        locationId,
        locationType,
        checkInDate,
        checkOutDate,
        numAdults,
        numChildren,
        numRooms,
      } = input;

      console.log("Decoding search params:", input);

      return ({
        location: {
          type: locationType,
          id: locationId,
        },
        inOutDates: {
          from: new Date(checkInDate.concat("T00:00:00Z")), // Ensure it's treated as UTC to avoid timezone issues
          to: new Date(checkOutDate.concat("T00:00:00Z")),
        },
        guestsAndRooms: {
          numAdults: parseInt(numAdults, 10) || 2,
          numChildren: parseInt(numChildren, 10) || 0,
          numRooms: parseInt(numRooms, 10) || 1,
        },
      });
    },
  }
);




const maxDays = 30;
/// ----------- TEST -------------------
export const schema_searchSpecWithoutLocation = z.object({
  inOutDates: z.object({
    from: z.date(),
    to: z.date(),
  }).superRefine(({ from, to }, ctx) => {
    if (from >= to) {
      ctx.addIssue({
        code: "custom",
        message: "Ngày nhận phòng phải trước ngày trả phòng",
        path: ["to"],
      });
      return;
    } else if (differenceInDays(to, from) > maxDays) {
      ctx.addIssue({
        code: "custom",
        message: `Ngày trả phòng không được quá ${maxDays} ngày kể từ ngày nhận phòng`,
        path: ["to"],
      });
    }
  }),
  guestsAndRooms: z.object({
    numAdults: z.number().int().min(1).max(30),
    numChildren: z.number().int().min(0).max(6),
    numRooms: z.number().int().min(1).max(30),
  }),
});


// TODO: Rename for better clarity.
export type SearchSpecWithoutLocation = z.input<typeof schema_searchSpecWithoutLocation>;

export type SearchSpecWithoutLocation_Params = {
  checkInDate: string,
  checkOutDate: string,
  numAdults: string,
  numChildren: string,
  numRooms: string,
}

export const codec_SearchSpecWithoutLocation_Params = z.codec(
  z.object({
    checkInDate: z.iso.date(),
    checkOutDate: z.iso.date(),
    numAdults: z.string(),
    numChildren: z.string(),
    numRooms: z.string(),
  }),
  schema_searchSpecWithoutLocation,
  {
    encode(data: z.input<typeof schema_searchSpecWithoutLocation>) {
      return {
        checkInDate: toYYYY_MM_DD(data.inOutDates.from),
        checkOutDate: toYYYY_MM_DD(data.inOutDates.to),
        numAdults: data.guestsAndRooms.numAdults.toString(),
        numChildren: data.guestsAndRooms.numChildren.toString(),
        numRooms: data.guestsAndRooms.numRooms.toString(),
      };
    },

    decode(input: SearchSpecWithoutLocation_Params): z.input<typeof schema_searchSpecWithoutLocation> {
      const {
        checkInDate,
        checkOutDate,
        numAdults,
        numChildren,
        numRooms,
      } = input;

      return schema_searchSpecWithoutLocation.parse({
        inOutDates: {
          from: new Date(checkInDate.concat("T00:00:00Z")), // Ensure it's treated as UTC to avoid timezone issues
          to: new Date(checkOutDate.concat("T00:00:00Z")),
        },
        guestsAndRooms: {
          numAdults: parseInt(numAdults, 10) || 2,
          numChildren: parseInt(numChildren, 10) || 0,
          numRooms: parseInt(numRooms, 10) || 1,
        },
      });
    },
  }
);