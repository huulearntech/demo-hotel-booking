"use client";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

import FilterSheetProvider from "../filter-sheet-context";
import { FilterFormProvider } from "../filter-form-context";
import { FilterSheet } from "../filter";
import SearchBar from "@/components/search-bar";
import { SearchBar_FormInput, schema_searchBar } from "@/lib/zod_schemas/search-bar";
import ButtonOpenFilterSheet from "../button-open-filter-sheet";

// Need to dynamically import to turn off ssr and render on client because it relies on Leaflet
const MapClient = dynamic(() => import("./map-client"), { ssr: false });

export default function SearchMapPage() {
  // FIXME: This does correctly show the empty location, but need to show. so the logic isn't wrong, but just not work.
  // FIXME: and also, using search params only on page mount make it not updated when user change the search params.
  const searchParams = useSearchParams();

  const searchBarValuesFromSearchParams = {
    location: {
      id: searchParams.get("locationId") || "",
      type: (searchParams.get("locationType") as SearchBar_FormInput["location"]["type"]) || "city",
    },
    inOutDates: {
      from: new Date(searchParams.get("checkInDate")!),
      to: new Date(searchParams.get("checkOutDate")!),
    },
    guestsAndRooms: {
      numAdults: searchParams.get("numAdults") ? parseInt(searchParams.get("numAdults")!) : 1,
      numChildren: searchParams.get("numChildren") ? parseInt(searchParams.get("numChildren")!) : 0,
      numRooms: searchParams.get("numRooms") ? parseInt(searchParams.get("numRooms")!) : 1,
    },
  } satisfies SearchBar_FormInput;

  const { success, data: defaultSearchBarValues } = schema_searchBar.safeParse(searchBarValuesFromSearchParams);
  if (!success) {
    return null;
    // TODO: Default values.
  }
  // TODO: Search on search bar should keep the map view.
  return (
    <FilterFormProvider>
      <FilterSheetProvider>
        <div className="w-screen h-screen flex flex-col">
          <div className="sticky top-0 w-full py-3 shadow-lg bg-white z-1000 flex items-end justify-center gap-x-2">
            <ButtonOpenFilterSheet className="mb-0.5" />
            <SearchBar
              defaultLocationQuery={""}
              defaultValues={defaultSearchBarValues}
              className="content mx-0"
              collapsible
            />
          </div>
          <MapClient searchBarValues={defaultSearchBarValues}/>
        </div>
        <FilterSheet standAlone/>
      </FilterSheetProvider>
    </FilterFormProvider>
  );
}