import { notFound } from "next/navigation";

import Filter from "../filter";
import { FilterFormProvider } from "../filter-form-context";
import FilterSheetProvider from "../filter-sheet-context";
import Results, { ResultsSkeleton } from "./results";

import SearchBar from "@/components/search-bar";
import { SearchSpec_Params, codec_SearchSpec_Params } from "@/lib/zod_schemas/search-bar";
import { Suspense } from "react";

export default async function SearchPage(props: { searchParams: Promise<SearchSpec_Params> }) {
  const searchParams = await props.searchParams;
  const safeDecodedParams = codec_SearchSpec_Params.safeDecode(searchParams);
  if (!safeDecodedParams.success) notFound();
  
  return (
    <FilterFormProvider>
      <div className="py-3 sticky top-0 shadow-lg bg-white z-20 flex justify-center">
        <SearchBar defaultValues={safeDecodedParams.data} collapsible />
      </div>
      <FilterSheetProvider>
        <main className="flex gap-x-6 content my-6">
          <Filter />
          <Suspense fallback={<div className="flex-1"><ResultsSkeleton /></div>}>
            <Results searchBarFormValues={safeDecodedParams.data} />
          </Suspense>
        </main>
      </FilterSheetProvider>
    </FilterFormProvider>
  )
}