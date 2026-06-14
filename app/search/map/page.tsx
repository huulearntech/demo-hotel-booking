"use client";
import dynamic from "next/dynamic";

import FilterSheetProvider from "../filter-sheet-context";
import { FilterFormProvider } from "../filter-form-context";
import { FilterSheet } from "../filter";
import { Suspense } from "react";

// Need to dynamically import to turn off ssr and render on client because it relies on Leaflet
const MapClient = dynamic(() => import("./map-client"), { ssr: false });

export default function SearchMapPage() {
  return (
    <FilterFormProvider>
      <FilterSheetProvider>
        <Suspense fallback={null}>
          <MapClient />
        </Suspense>
        <FilterSheet standAlone showCloseButton />
      </FilterSheetProvider>
    </FilterFormProvider>
  );
}