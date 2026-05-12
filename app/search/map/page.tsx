"use client";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

import FilterSheetProvider from "../filter-sheet-context";
import { FilterFormProvider } from "../filter-form-context";
import { FilterSheet } from "../filter";
import SearchBar from "@/components/search-bar";
import { SearchBar_FormInput, SearchBar_LocationType, schema_searchBar } from "@/lib/zod_schemas/search-bar";
import ButtonOpenFilterSheet from "../button-open-filter-sheet";

// Need to dynamically import to turn off ssr and render on client because it relies on Leaflet
const MapClient = dynamic(() => import("./map-client"), { ssr: false });

export default function SearchMapPage() {
  const searchParams = useSearchParams();

  const searchBarValuesFromSearchParams: SearchBar_FormInput = {
    location: {
      id: searchParams.get("locationId") || "",
      type: (searchParams.get("locationType") || "none") as SearchBar_LocationType,
    },
    inOutDates: {
      from: new Date(searchParams.get("checkInDate")!),
      to: new Date(searchParams.get("checkOutDate")!),
    },
    guestsAndRooms: {
      numAdults: searchParams.get("numAdults") ? parseInt(searchParams.get("numAdults")!) : 2,
      numChildren: searchParams.get("numChildren") ? parseInt(searchParams.get("numChildren")!) : 0,
      numRooms: searchParams.get("numRooms") ? parseInt(searchParams.get("numRooms")!) : 1,
    },
  };

  const { success, data: defaultSearchBarValues } = schema_searchBar.safeParse(searchBarValuesFromSearchParams);
  if (!success) return null;
  return (
    <FilterFormProvider>
      <FilterSheetProvider>
        <div className="w-screen h-screen flex flex-col">
          <div className="sticky top-0 w-full py-3 shadow-lg bg-white z-1000 flex items-end justify-center gap-x-2">
            <ButtonOpenFilterSheet className="mb-0.5" />
            <SearchBar
              defaultValues={defaultSearchBarValues}
              className="content mx-0"
              collapsible
            />
          </div>
          <MapClient searchBarValues={defaultSearchBarValues}/>
        </div>
        <FilterSheet standAlone showCloseButton/>
      </FilterSheetProvider>
    </FilterFormProvider>
  );
}