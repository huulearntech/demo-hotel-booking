"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { vi } from "react-day-picker/locale";
import { cn } from "@/lib/utils";

import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@/components/autocomplete";

import { ArrowRight, ChevronDown, Minus, Plus, Search, RotateCwIcon, LoaderCircleIcon } from "lucide-react";

import { schema_searchBar, type SearchBar_FormInput, type SearchBar_FormOutput, SearchBar_LocationType, SearchParamsCodec } from "@/lib/zod_schemas/search-bar.draft";
import {
  MAX_ADULTS,
  MAX_CHILDREN,
  MAX_LOCATION_AUTOCOMPLETE_RESULTS,
  MAX_ROOMS,
  MIN_ADULTS,
  MIN_CHILDREN,
  MIN_ROOMS,
  PATHS
} from "@/lib/constants";

import useSWR, { mutate } from "swr";
import { ComponentProps, useState, useEffect } from "react";
import { user_getLocationOrHotelByQueryString } from "@/lib/actions/search-bar";

export default function SearchBar({
  defaultValues,
  className,
  collapsible = true,
}: {
  defaultValues?: SearchBar_FormInput;
  className?: string
  collapsible: boolean
}) {
  const [isOpenOnMobile, setIsOpenOnMobile] = useState(false);
  const form = useForm<SearchBar_FormInput, unknown, SearchBar_FormOutput>({
    resolver: zodResolver(schema_searchBar),
    defaultValues: defaultValues ?? {
      location: {
        id: "",
        name: "",
        type: "none",
      },
      inOutDates: {
        from: new Date(),
        to: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      guestsAndRooms: {
        numAdults: 2,
        numChildren: 0,
        numRooms: 1,
      }
    }
  });

  const { handleSubmit, control } = form;
  return (
    <Form {...form}>
      <div className={cn(
        "flex gap-x-1 md:gap-x-0 items-end content",
        className
      )}>
        <SearchBarForm
          data-open={isOpenOnMobile}
          data-collapsible={collapsible}
          handleSubmit={handleSubmit}
          control={control}
          className={cn(
            "w-full px-1.5 md:px-0 flex flex-col md:flex-row md:items-end gap-y-2 md:gap-y-0 md:gap-x-2 transition-all duration-300",
            "h-15.5 data-[collapsible=true]:data-[open=true]:h-59.5 data-[collapsible=true]:data-[open=true]:md:h-15.5 data-[collapsible=true]:max-md:overflow-hidden",
            "data-[collapsible=false]:h-auto data-[collapsible=false]:p-0"
          )}
        />
        <Button
          data-collapsible={collapsible}
          type="button"
          variant="outline"
          className="data-[collapsible=false]:hidden md:hidden mx-auto mb-1"
          onClick={() => setIsOpenOnMobile(prev => !prev)}
        >
          <ChevronDown className={cn("size-5 transition-transform duration-200", isOpenOnMobile && "rotate-180")} />
        </Button>
      </div>
    </Form>
  );
}

export function SearchBarForm({
  isOpenOnMobile,
  handleSubmit,
  control,
  ...props
}: ComponentProps<"form"> & {
  isOpenOnMobile?: boolean
  handleSubmit: ReturnType<typeof useForm<SearchBar_FormInput, unknown, SearchBar_FormOutput>>["handleSubmit"]
  control: ReturnType<typeof useForm<SearchBar_FormInput, unknown, SearchBar_FormOutput>>["control"]
}) {
  const router = useRouter();

  const onSubmit = (values: SearchBar_FormOutput) => {
    if (values.location.type === "none" || !values.location.id) {
      console.warn("TODO: Invalid location, not searching");
      return;
    }

    // TODO: may change search page search params into spec only, let id and type be params.

    // TODO: this puts too much junk in the url
    // TODO: stay on the map path when on map path.
    let dest = "";
    const encodedParams = SearchParamsCodec.encode(values);
    if (values.location.type === "hotel") {
      dest = PATHS.hotels + "/" + values.location.id;
    } else {
      dest = PATHS.search;
    }

    const searchParams = new URLSearchParams(encodedParams).toString();
    router.push(`${dest}?${searchParams}`);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      data-open={isOpenOnMobile}
      {...props}
    >
      <FormField
        control={control}
        name="location"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel htmlFor="location-input" className="font-semibold">Khách sạn hoặc điểm đến</FormLabel>
            <LocationAutocomplete
              value={field.value}
              onValueChange={field.onChange}
            />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="inOutDates"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel htmlFor="date-range-picker" className="font-semibold">Ngày nhận / trả phòng</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" id="date-range-picker" className="text-sm lg:text-base overflow-hidden">
                  {new Intl.DateTimeFormat("vi-VN", { month: "numeric", day: "numeric", year: "numeric" }).format(field.value.from) || "Nhận phòng"}
                  <ArrowRight />
                  {new Intl.DateTimeFormat("vi-VN", { month: "numeric", day: "numeric", year: "numeric" }).format(field.value.to) || "Trả phòng"}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto overflow-hidden p-0 z-1000">
                <FormControl>
                  <Calendar
                    mode="range"
                    locale={vi}
                    selected={field.value}
                    onSelect={field.onChange}
                    // FIXME: fix render mismatch between server and client due to new Date().
                    disabled={{
                      before: new Date(),
                      after: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                    }}
                  />
                </FormControl>
              </PopoverContent>
            </Popover>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="guestsAndRooms"
        render={({ field }) => {
          const setGuests = (patch: Partial<typeof field.value>) =>
            field.onChange({ ...field.value, ...patch });

          return (
            <FormItem className="w-full">
              <FormLabel htmlFor="guests-and-rooms" className="font-semibold">Khách và phòng </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="guests-and-rooms" variant="outline" className="text-sm lg:text-base overflow-hidden">
                    {field.value.numAdults + " người lớn, "}
                    {field.value.numChildren + " trẻ em, "}
                    {field.value.numRooms + " phòng"}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-xs overflow-hidden z-1000">
                  <FormItem className="flex justify-between">
                    <FormLabel>Người lớn</FormLabel>
                    <div className="flex space-x-2 items-center">
                      <Button
                        onClick={() => setGuests({ numAdults: field.value.numAdults - 1 })}
                        disabled={field.value.numAdults <= MIN_ADULTS}
                        className="flex size-6 items-center justify-center rounded-full"
                      >
                        <Minus className="size-4" />
                      </Button>
                      <FormControl>
                        <Input value={field.value.numAdults} readOnly className="w-12 text-center" />
                      </FormControl>
                      <Button
                        onClick={() => setGuests({ numAdults: field.value.numAdults + 1 })}
                        disabled={field.value.numAdults >= MAX_ADULTS}
                        className="flex size-6 items-center justify-center rounded-full"
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </FormItem>

                  <FormItem className="flex justify-between mt-2">
                    <FormLabel>Trẻ em</FormLabel>
                    <div className="flex space-x-2 items-center">
                      <Button
                        onClick={() => setGuests({ numChildren: field.value.numChildren - 1 })}
                        disabled={field.value.numChildren <= MIN_CHILDREN}
                        className="flex size-6 items-center justify-center rounded-full"
                      >
                        <Minus className="size-4" />
                      </Button>
                      <FormControl>
                        <Input value={field.value.numChildren} readOnly className="w-12 text-center" />
                      </FormControl>
                      <Button
                        onClick={() => setGuests({ numChildren: field.value.numChildren + 1 })}
                        disabled={field.value.numChildren >= MAX_CHILDREN}
                        className="flex size-6 items-center justify-center rounded-full"
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </FormItem>

                  <FormItem className="flex justify-between mt-2">
                    <FormLabel>Phòng</FormLabel>
                    <div className="flex space-x-2 items-center">
                      <Button
                        onClick={() => setGuests({ numRooms: field.value.numRooms - 1 })}
                        disabled={field.value.numRooms <= MIN_ROOMS}
                        className="flex size-6 items-center justify-center rounded-full"
                      >
                        <Minus className="size-4" />
                      </Button>
                      <FormControl>
                        <Input value={field.value.numRooms} readOnly className="w-12 text-center" />
                      </FormControl>
                      <Button
                        onClick={() => setGuests({ numRooms: field.value.numRooms + 1 })}
                        disabled={field.value.numRooms >= Math.min(field.value.numAdults, MAX_ROOMS)}
                        className="flex size-6 items-center justify-center rounded-full"
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </FormItem>
                </PopoverContent>
              </Popover>
            </FormItem>
          );
        }}
      />

      <Button type="submit" className="w-full md:w-fit flex items-center text-sm lg:text-base">
        <Search />
        <span className="md:max-lg:hidden">Tìm kiếm</span>
      </Button>
    </form>
  );
}

export function SearchBarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("h-10 flex flex-col md:flex-row gap-2 items-start", className)}>
      <Skeleton className="h-full w-full md:w-3/10 rounded-full" />
      <Skeleton className="h-full w-full md:w-3/10 rounded-full" />
      <Skeleton className="h-full w-full md:w-3/10 rounded-full" />
      <Skeleton className="h-full w-full md:w-1/10 rounded-full" />
    </div>
  );
}

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// TODO: Default suggestions on empty string.
// TODO: value vs display value -> keep showing the name in the input, but store id+type in the form state.
// FIXME: re-render too much + allow free text input that doesn't match any location (currently it does not allow to arrow navigate to the option)
type Location = {
  id: string;
  name: string;
  type: SearchBar_LocationType;
}
function LocationAutocomplete({
  value,
  onValueChange,
}: {
  value: Location;
  onValueChange: (value: Location) => void;
}) {
  // display string shown in the input
  const [display, setDisplay] = useState<string>(value.name); // careful with form initial value to avoid undefined.

  // keep display in sync when parent value changes (e.g. form reset)
  useEffect(() => {
    setDisplay(value?.name ?? "");
  }, [value?.id, value?.type, value?.name]);

  const debouncedDisplay = useDebounced(display, 500);

  const { data = [], isLoading, error } = useSWR(
    debouncedDisplay && debouncedDisplay.trim() !== "" ? ["locations", debouncedDisplay] : null,
    async ([, q]) => user_getLocationOrHotelByQueryString(q),
    { dedupingInterval: 10_000 }
  );

  const isTypingOrLoading = (display.trim() !== "" && display !== debouncedDisplay) || isLoading;

  const items = (data ?? []).slice(0, MAX_LOCATION_AUTOCOMPLETE_RESULTS).filter((it: any) => it && it.id && it.name && it.type);

  const handleRetry = () => {
    mutate(["locations", debouncedDisplay]);
  };

  // The Autocomplete primitive uses string values only. We encode selection as `${type}::${id}`.
  const handleValueChange = (val: string) => {
    if (!val) {
      // cleared
      setDisplay("");
      onValueChange({ id: "", type: "none", name: "" });
      return;
    }

    // If the value looks like our encoded selection, try to resolve it
    if (val.includes("::")) {
      const [type, ...rest] = val.split("::");
      const id = rest.join("::");
      const found = items.find((it: any) => String(it.id) === id && it.type === type);
      if (found) {
        setDisplay(found.name || "");
        onValueChange({ id: String(found.id), type: found.type as SearchBar_LocationType, name: found.name || "" });
        return;
      }
    }

    // Otherwise treat as free text typing: update display and clear structured id/type
    setDisplay(val);
    onValueChange({ id: "", type: "none", name: val });
  };

  return (
    <Autocomplete
      modal={false}
      items={items}
      value={display}
      onValueChange={handleValueChange}
      // itemToStringValue={item => `${item.type}::${item.id}`}
    >
      <AutocompleteInput
        id="location-input"
        placeholder="Bạn muốn đi đâu?"
        showTrigger={false}
        showClear
        className="w-full"
      />
      <AutocompleteContent>
        {isTypingOrLoading && (
          <div className="w-full flex items-center justify-center px-2 py-3 text-sm text-gray-500">
            <div className="flex items-center gap-x-2">
              <LoaderCircleIcon className="size-4 animate-spin" />
              <span>Đang tải...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="w-full flex items-center justify-center px-2 py-3">
            <div className="flex flex-col items-center text-sm text-gray-500 gap-2">
              <span>Tải địa điểm thất bại</span>
              <Button
                type="button"
                onClick={handleRetry}
                className="self-center flex items-center gap-x-1 text-sm"
              >
                <RotateCwIcon className="size-4" />
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {!isTypingOrLoading && !error && items.length === 0 && (
          <AutocompleteEmpty>Không tìm thấy địa điểm này.</AutocompleteEmpty>
        )}

        {!isTypingOrLoading && !error && items.length > 0 && (
          <AutocompleteList>
            {items.map((item: any) => (
              <AutocompleteItem
                key={`${item.type}::${item.id}`}
                value={`${item.type}::${item.id}`}
                className="h-9"
              >
                {item.name}
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-accent text-primary py-0.5 px-2 rounded-full">
                  {item.type === "hotel" ? "Khách sạn" : item.type === "province" ? "Tỉnh/Thành phố" : item.type === "district" ? "Quận/Huyện" : item.type === "ward" ? "Phường/Xã" : ""}
                </span>
              </AutocompleteItem>
            ))}
          </AutocompleteList>
        )}
      </AutocompleteContent>
    </Autocomplete>
  );
}