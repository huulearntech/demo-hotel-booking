"use client";

import { DataTable } from "@/components/data-table";
import { columns } from "../tmp-components/booking-columns";
import { hotelowner_getBookings } from "@/lib/actions/hotel-manager/bookings";

import { useQuery } from "@tanstack/react-query";

import { useState, useMemo } from "react";

import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import type { DateRange } from "react-day-picker";
import { vi } from "date-fns/locale";

function makeRangeFromPreset(preset: "last7" | "last30"): DateRange {
  const to = new Date();
  const days = preset === "last7" ? 7 : 30;
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return { from, to };
}

function presetFromRange(range: DateRange | undefined): "last7" | "last30" | undefined {
  if (!range || !range.from || !range.to) return undefined;
  const to = range.to.getTime();
  const from = range.from.getTime();

  const last7 = makeRangeFromPreset("last7");
  const last30 = makeRangeFromPreset("last30");

  if (last7.from && last7.to && last7.from.getTime() === from && last7.to.getTime() === to) return "last7";
  if (last30.from && last30.to && last30.from.getTime() === from && last30.to.getTime() === to) return "last30";
  return undefined;
}

// TODO: Control the date range.
export default function BookingsTable() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 24 * 60 * 60 * 1000), // Default to a range of 1 day
    to: new Date(),
  });

  // derive the toggle's selected value from the single source-of-truth (dateRange)
  const toggleValue = useMemo(() => presetFromRange(dateRange), [dateRange]);

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["hotelowner_bookings"],
    queryFn: hotelowner_getBookings,
  });

  if (isLoading)
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 rounded bg-gray-200/60 animate-pulse" />
        </div>

        <div className="rounded-md border bg-white">
          {/* table header skeleton */}
          <div className="grid grid-cols-6 gap-4 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 rounded bg-gray-200/60 animate-pulse" />
            ))}
          </div>

          {/* table rows skeleton */}
          <div className="divide-y">
            {Array.from({ length: 4 }).map((_, row) => (
              <div key={row} className="grid grid-cols-6 gap-4 p-4">
                {Array.from({ length: 6 }).map((_, col) => (
                  <div key={col} className="h-5 rounded bg-gray-100 animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  if (isError) return <div>Có lỗi xảy ra khi tải dữ liệu.</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Chọn khoảng thời gian
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-4">
            {/* Layout: toggle group on the left, calendar on the right */}
            <div className="flex gap-4">
              <ToggleGroup
                type="single"
                orientation="vertical"
                value={toggleValue}
                onValueChange={(val) => {
                  // val can be string or null; if it matches a preset, apply it; otherwise clear selection
                  if (val === "last7" || val === "last30") {
                    setDateRange(makeRangeFromPreset(val));
                  } else {
                    setDateRange(undefined);
                  }
                }}
                className="flex flex-col space-y-2"
                aria-label="Date presets"
              >
                <ToggleGroupItem value="last7" className="data-[state=on]:bg-primary data-[state=on]:text-white w-36 text-left">
                  7 ngày qua
                </ToggleGroupItem>
                <ToggleGroupItem value="last30" className="data-[state=on]:bg-primary data-[state=on]:text-white w-36 text-left">
                  30 ngày qua
                </ToggleGroupItem>
              </ToggleGroup>

              <Calendar
                locale={vi}
                mode="range"
                numberOfMonths={2}
                selected={dateRange}
                onSelect={(range) => {
                  // Keep the calendar as the single source of truth; toggle will reflect if it matches a preset
                  setDateRange(range as DateRange | undefined);
                }}
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}