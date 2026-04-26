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
    queryFn: async () => {
      return hotelowner_getBookings();
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading bookings.</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Select date range
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
                  Last 7 days
                </ToggleGroupItem>
                <ToggleGroupItem value="last30" className="data-[state=on]:bg-primary data-[state=on]:text-white w-36 text-left">
                  Last 30 days
                </ToggleGroupItem>
              </ToggleGroup>

              <Calendar
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