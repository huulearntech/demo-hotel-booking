"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet-override.css";
import { Loader2Icon } from "lucide-react";

import MyMarker from "./my-marker";

import { type Map_HotelCardProps, type BBox, getHotelsByBoundingBox } from "@/lib/actions/search/map";
import { haversineMeters } from "@/lib/utils";

// TODO: May add an error state and show error if fetch fails.
function MapController({
  onUpdateBBox,
  debounceMs = 2000,
  minMoveMeters = 500,
  setDataState,
}: {
  onUpdateBBox?: (b: BBox) => void;
  debounceMs?: number;
  minMoveMeters?: number;
    setDataState: Dispatch<SetStateAction<{ hotels: Map_HotelCardProps[]; loading: boolean }>>;
}) {
  const map = useMap();
  const bboxRef = useRef<BBox | null>(null);
  const timerRef = useRef<number | null>(null);

  const scheduleFetch = useCallback(
    (newBbox: BBox) => {
      // optional outside hook
      onUpdateBBox?.(newBbox);

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      // avoid fetching if center didn't move enough or change zoom enough
      if (bboxRef.current) {
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

      setDataState((prev) => ({ hotels: prev.hotels, loading: true }));

      timerRef.current = window.setTimeout(async () => {
        try {
          bboxRef.current = newBbox;
          const res = await getHotelsByBoundingBox(newBbox);
          setDataState({ hotels: res, loading: false });
        } catch (err) {
          console.error("fetch hotels error", err);
          // keep previous hotels on error, just stop loading
          setDataState((prev) => ({ hotels: prev.hotels, loading: false }));
        } finally {
          timerRef.current = null;
        }
      }, debounceMs);
    },
    [debounceMs, minMoveMeters, onUpdateBBox, setDataState]
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
  }, [map]);

  return null;
}

type MapClientProps = {
  initialCenter?: [number, number];
  zoom?: number;
  debounceMs?: number;
  minMoveMeters?: number;
};

export default function MapClient({
  initialCenter = [21.0278, 105.8342],
  zoom = 13,
  debounceMs = 800,
  minMoveMeters = 500,
}: MapClientProps) {
  const [dataState, setDataState] = useState<{ hotels: Map_HotelCardProps[]; loading: boolean }>({
    hotels: [],
    loading: true,
  });

  // optional external hook for bbox changes (minimal)
  const handleBBoxChange = useCallback((b: BBox) => {
    // can log or use analytics; kept minimal so it doesn't trigger re-renders
  }, []);

  return (
    <div className="w-full flex-1">
      <MapContainer center={initialCenter} zoom={zoom} style={{ height: "100%", width: "100%" }} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapController
          debounceMs={debounceMs}
          minMoveMeters={minMoveMeters}
          onUpdateBBox={handleBBoxChange}
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
            Loading hotels
          </div>
        )}

        {dataState.hotels.map((hotel) => (
          <MyMarker key={hotel.id} hotel={hotel} />
        ))}

        <ZoomControl position="topright" />
      </MapContainer>
    </div>
  );
}