"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet-override.css";
import { Loader2Icon } from "lucide-react";

import MyMarker from "./my-marker";

import { type Map_HotelCardProps, type BBox, getCentroidOfRegion } from "@/lib/actions/search/map";
import { haversineMeters } from "@/lib/utils";


import { useFilterForm } from "../filter-form-context";
import { getHotelsByBoundingBox } from "@/lib/actions/search/map";
import { codec_SearchSpecWithoutLocation_Params, SearchBar_FormOutput } from "@/lib/zod_schemas/search-bar";

function MapController({
  searchBarValues,
  onUpdateBBox,
  debounceMs = 2000,
  minMoveMeters = 500,
  setDataState,
}: {
  searchBarValues: SearchBar_FormOutput;
  onUpdateBBox?: (b: BBox) => void;
  debounceMs?: number;
  minMoveMeters?: number;
  setDataState: Dispatch<SetStateAction<{
    hotels: Map_HotelCardProps[];
    loading: boolean;
    error: { message: string } | null;
  }>>;
}) {

  const map = useMap();
  const bboxRef = useRef<BBox | null>(null);
  const timerRef = useRef<number | null>(null);

  const filter = useFilterForm();
  const { getValues } = filter;

  
  useEffect(() => {
    (async () => {
      try {
        const res = await getCentroidOfRegion(searchBarValues.location)
        if (!res) {
          throw new Error(`Failed to fetch initial center:`);
        } else {
          const { centroidLat, centroidLng } = res;
          map.setView([centroidLat, centroidLng], map.getZoom());
        }
      } catch (err) {
        // keep default center
      }
    })();
  }, [map, searchBarValues.location]);


  const scheduleFetch = useCallback(
    (newBbox: BBox, force: boolean = false) => {
      // optional outside hook
      onUpdateBBox?.(newBbox);

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      // avoid fetching if center didn't move enough
      if (!force && bboxRef.current) {
        const prevCenter: [number, number] = [
          (bboxRef.current.north + bboxRef.current.south) / 2,
          (bboxRef.current.east + bboxRef.current.west) / 2,
        ];
        const newCenter: [number, number] = [
          (newBbox.north + newBbox.south) / 2,
          (newBbox.east + newBbox.west) / 2,
        ];
        if (haversineMeters(prevCenter, newCenter) < minMoveMeters) {
          bboxRef.current = newBbox; // still update bbox but skip fetch
          return;
        }
      }

      setDataState((prev) => ({ hotels: prev.hotels, loading: true, error: null }));

      timerRef.current = window.setTimeout(async () => {
        try {
          const filterValues = filter.getValues();
          bboxRef.current = newBbox;
          const res = await getHotelsByBoundingBox(newBbox, searchBarValues, filterValues);
          setDataState({ hotels: res, loading: false, error: null });
        } catch (err) {
          setDataState((prev) => ({ hotels: prev.hotels, loading: false, error: { message: (err as Error).message || "Failed to fetch hotels" } }));
        } finally {
          timerRef.current = null;
        }
      }, debounceMs);
    },
    [onUpdateBBox, setDataState, getValues, searchBarValues?.location]
  );

  useMapEvents({
    moveend() {
      const b = map.getBounds();
      scheduleFetch({
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      });
    },
    click() {
      map.closePopup();
    },
    dragstart() {
      map.closePopup();
    },
  });

  // fetch initial data on mount
  useEffect(() => {
    const b = map.getBounds();
    const init: BBox = {
      south: b.getSouth(),
      west: b.getWest(),
      north: b.getNorth(),
      east: b.getEast(),
    };
    scheduleFetch(init);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [map, scheduleFetch]);

  useEffect(() => {
    if (!bboxRef.current) return; // skip if bbox not initialized yet
    scheduleFetch(bboxRef.current, true); // force fetch
  }, [searchBarValues?.location, scheduleFetch]);

  return null;
}

type MapClientProps = {
  initialCenter?: [number, number];
  zoom?: number;
  debounceMs?: number;
  minMoveMeters?: number;
};

export default function MapClient({
  initialCenter = [21.003864,105.803041],
  zoom = 13,
  debounceMs = 800,
  minMoveMeters = 500,
}: MapClientProps) {
  const searchParams = useSearchParams();

  const searchBarValuesFromSearchParams = useMemo(() => {
    const locationId = searchParams.get("locationId") || "";
    const locationType = (searchParams.get("locationType") || "none") as SearchBar_LocationType;
    const checkInDate = searchParams.get("checkInDate") ?? "";
    const checkOutDate = searchParams.get("checkOutDate") ?? "";
    const numAdults = searchParams.get("numAdults") ? parseInt(searchParams.get("numAdults")!) : 2;
    const numChildren = searchParams.get("numChildren") ? parseInt(searchParams.get("numChildren")!) : 0;
    const numRooms = searchParams.get("numRooms") ? parseInt(searchParams.get("numRooms")!) : 1;

    return {
      location: {
        id: locationId,
        type: locationType,
      },
      inOutDates: {
        from: new Date(checkInDate),
        to: new Date(checkOutDate),
      },
      guestsAndRooms: {
        numAdults,
        numChildren,
        numRooms,
      },
    } as SearchBar_FormInput;
  }, [
    searchParams,
    searchParams?.get("locationId"),
    searchParams?.get("locationType"),
    searchParams?.get("checkInDate"),
    searchParams?.get("checkOutDate"),
    searchParams?.get("numAdults"),
    searchParams?.get("numChildren"),
    searchParams?.get("numRooms"),
  ]);

  const { success, data: searchBarValues } = useMemo(
    () => schema_searchBar.safeParse(searchBarValuesFromSearchParams),
    [searchBarValuesFromSearchParams]
  );
  if (!success) return null;
  const [dataState, setDataState] = useState<{ hotels: Map_HotelCardProps[]; loading: boolean; error: { message: string } | null }>({
    hotels: [],
    loading: true,
    error: null,
  });

  const { location, ...searchBarValuesWithoutLocation } = searchBarValues;
  const stringifiedSearchParams = new URLSearchParams(codec_SearchSpecWithoutLocation_Params.encode(searchBarValuesWithoutLocation)).toString();

  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="sticky top-0 w-full py-3 shadow-lg bg-white z-1000 flex items-end justify-center gap-x-2">
        <ButtonOpenFilterSheet className="mb-0.5" />
        <SearchBar
          defaultValues={searchBarValues}
          className="content mx-0"
          collapsible
        />
      </div>
      <div className="w-full flex-1">
        <MapContainer center={initialCenter} zoom={zoom} style={{ height: "100%", width: "100%" }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          <MapController
            searchBarValues={searchBarValues}
            debounceMs={debounceMs}
            minMoveMeters={minMoveMeters}
            setDataState={setDataState}
          />

          {dataState.loading && (
            <div
              className="absolute top-8 left-1/2 -translate-x-1/2 z-1000
               flex items-center gap-x-2 px-3 py-1 rounded-full
               bg-white shadow text-base font-semibold
               pointer-events-none"
            >
              <Loader2Icon className="animate-spin size-5" />
              Đang tải...
            </div>
          )}
          {dataState.error && (
            <div
              className="absolute top-8 left-1/2 -translate-x-1/2 z-1000
               flex items-center gap-x-2 px-3 py-1 rounded-full
               bg-destructive text-destructive shadow text-base font-semibold"
            >
              {dataState.error.message}
            </div>
          )}

          {dataState.hotels.map((hotel) => (
            <MyMarker key={hotel.id} hotel={hotel} searchParams={stringifiedSearchParams} />
          ))}

          <ZoomControl position="topright" />
        </MapContainer>
      </div>
    </div>
  );
}

import { useSearchParams } from "next/navigation";
import { SearchBar_FormInput, SearchBar_LocationType, schema_searchBar } from "@/lib/zod_schemas/search-bar";
import SearchBar from "@/components/search-bar";
import ButtonOpenFilterSheet from "../button-open-filter-sheet";