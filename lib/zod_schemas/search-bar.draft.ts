// TODO: what to put in location id when location type is 'nearby'?
import { z } from "zod";

const locationTypes = ["none", "province", "district", "ward", "hotel", "nearby"] as const;
export type SearchBar_LocationType = typeof locationTypes[number];

export const schema_searchBar = z.object({
  location: z.object({ type: z.enum(locationTypes), id: z.string(), name: z.string() }), // TODO: further validation. // TODO: remove name.
  inOutDates: z.object({
    from: z.date(),
    to: z.date(),
  }).superRefine(({ from, to }, ctx) => {
    if (from > to) {
      ctx.addIssue({
        code: "custom",
        message: "Ngày nhận phòng phải trước ngày trả phòng",
        path: ["to"],
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
        path: ["numRooms"],
      });
    }
  }),
});


export type SearchBar_FormInput = z.input<typeof schema_searchBar>;
export type SearchBar_FormOutput = z.output<typeof schema_searchBar>;

// TODO: Name these types better. These are used for encoding/decoding search params in URL, so they are all strings. But the naming is not great.
export type SearchParams = {
  locationId: string,
  locationType: SearchBar_LocationType,
  locationName: string, // TODO: remove this. We can get location name from location id and type.
  checkInDate: string,
  checkOutDate: string,
  numAdults: string,
  numChildren: string,
  numRooms: string,
}

export const SearchParamsCodec = z.codec(
  z.object({
    locationId: z.string(),
    locationType: z.enum(locationTypes),
    locationName: z.string(), // TODO: remove this. We can get location name from location id and type.
    checkInDate: z.iso.date(),
    checkOutDate: z.iso.date(),
    numAdults: z.string(),
    numChildren: z.string(),
    numRooms: z.string(),
  }),
  schema_searchBar,
  {
    encode(data: SearchBar_FormInput) {
      return {
        locationId: data.location.id,
        locationType: data.location.type,
        locationName: data.location.name, // TODO: remove this. We can get location name from location id and type.
        checkInDate: data.inOutDates.from.toISOString().split("T")[0],
        checkOutDate: data.inOutDates.to.toISOString().split("T")[0],
        numAdults: data.guestsAndRooms.numAdults.toString(),
        numChildren: data.guestsAndRooms.numChildren.toString(),
        numRooms: data.guestsAndRooms.numRooms.toString(),
      };
    },

    decode(input: SearchParams): SearchBar_FormInput {
      const {
        locationId,
        locationType,
        locationName,
        checkInDate,
        checkOutDate,
        numAdults,
        numChildren,
        numRooms,
      } = input;

      return ({
        location: {
          type: locationType,
          id: locationId,
          name: locationName, // TODO: remove this. We can get location name from location id and type.
        },
        inOutDates: {
          from: new Date(checkInDate),
          to: new Date(checkOutDate),
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

