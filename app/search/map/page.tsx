"use client";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

import FilterSheetProvider from "../filter-sheet-context";
import { FilterFormProvider } from "../filter-form-context";
import { FilterSheet } from "../filter";
import SearchBar from "@/components/search-bar";
import { SearchBarFormData, SearchBarFormSchema } from "@/lib/zod_schemas/search-bar";
import ButtonOpenFilterSheet from "../button-open-filter-sheet";

// Need to dynamically import to turn off ssr and render on client because it relies on Leaflet
const MapClient = dynamic(() => import("./map-client"), { ssr: false });

export default function SearchMapPage() {
  const searchParams = useSearchParams();

  const searchBarValuesFromSearchParams = {
    location: searchParams.get("location") || "",
    inOutDates: {
      from: new Date(searchParams.get("checkInDate")!),
      to: new Date(searchParams.get("checkOutDate")!),
    },
    guestsAndRooms: {
      numAdults: searchParams.get("numAdults") ? parseInt(searchParams.get("numAdults")!) : 1,
      numChildren: searchParams.get("numChildren") ? parseInt(searchParams.get("numChildren")!) : 0,
      numRooms: searchParams.get("numRooms") ? parseInt(searchParams.get("numRooms")!) : 1,
    },
  } satisfies SearchBarFormData;

  const { success, data: defaultSearchBarValues } = SearchBarFormSchema.safeParse(searchBarValuesFromSearchParams);
  if (!success) {
    return null;
    // TODO: Default values.
  }
  // TODO: Search on search bar should keep the map view.
  return (
    <FilterFormProvider>
      <FilterSheetProvider>
        <div className="w-screen h-screen flex flex-col">
          <SearchBarWithFilterTrigger defaultValues={defaultSearchBarValues} />
          <MapClient />
        </div>
        <FilterSheet standAlone/>
      </FilterSheetProvider>
    </FilterFormProvider>
  );
}

function SearchBarWithFilterTrigger({ defaultValues }: { defaultValues: SearchBarFormData }) {
  return (
    <div className="sticky top-0 w-full py-3 shadow-lg bg-white z-1000 flex items-end justify-center gap-x-2">
      <ButtonOpenFilterSheet className="mb-0.5" />
      <SearchBar defaultValues={defaultValues} className="content mx-0" />
    </div>
  )
};