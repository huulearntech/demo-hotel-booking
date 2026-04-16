import { notFound } from "next/navigation";

import Filter from "../filter";
import Results from "./results";

import FilterSheetProvider from "../filter-sheet-context";
import SearchBar from "@/components/search-bar";
import { SearchParams, SearchParamsCodec } from "@/lib/zod_schemas/search-bar";
import { FilterFormProvider } from "../filter-form-context";
import prisma from "@/lib/prisma";

export default async function SearchPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const safeDecodedParams = SearchParamsCodec.safeDecode(searchParams);
  if (!safeDecodedParams.success) notFound();

  const { location: { id: locationId, type: locationType } } = safeDecodedParams.data;
  let locationName = "";
  if (locationType === "province") {
    locationName = await prisma.province.findUnique({ where: { id: locationId } }).then(p => p?.name || "");
  } else if (locationType === "district") {
    locationName = await prisma.district.findUnique({ where: { id: locationId } }).then(d => d?.name || "");
  } else if (locationType === "ward") {
    locationName = await prisma.ward.findUnique({ where: { id: locationId } }).then(w => w?.name || "");
  } else notFound();
  
  return (
    <FilterFormProvider>
      <div className="py-3 sticky top-0 shadow-lg bg-white z-20 flex justify-center">
        <SearchBar
          defaultLocationQuery={locationName}
          defaultValues={safeDecodedParams.data}
          collapsible
        />
      </div>
      <FilterSheetProvider>
        <main className="flex gap-x-6 content my-6">
          <Filter />
          <Results
            locationName={locationName}
            searchBarFormValues={safeDecodedParams.data}
          />
        </main>
      </FilterSheetProvider>
    </FilterFormProvider>
  )
}