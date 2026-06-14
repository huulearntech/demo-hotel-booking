"use client";

import { ComponentProps, useLayoutEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, usePathname } from "next/navigation";

import { vi } from "react-day-picker/locale";
import { cn } from "@/lib/utils";

import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@/components/autocomplete";

import { ArrowRight, ChevronDown, Minus, Plus, Search, RotateCwIcon, LoaderCircleIcon } from "lucide-react";

import { codec_SearchSpecWithoutLocation_Params, schema_searchBar, type SearchBar_FormInput, type SearchBar_FormOutput, SearchBar_LocationType, codec_SearchSpec_Params } from "@/lib/zod_schemas/search-bar";
import {
  MAX_ADULTS,
  MAX_CHILDREN,
  MAX_LOCATION_AUTOCOMPLETE_RESULTS,
  MAX_ROOMS,
  MIN_ADULTS,
  MIN_CHILDREN,
  MIN_ROOMS,
  PATHS,
  DEFAULT_SEARCH_BAR_VALUES,
} from "@/lib/constants";

import useSWR, { mutate } from "swr";
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { user_getLocationNameOrHotelNameById, user_getLocationOrHotelByQueryString } from "@/lib/actions/search-bar";


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
    defaultValues: defaultValues ?? DEFAULT_SEARCH_BAR_VALUES,
  });

  // Avoid hydration mismatch.
  useLayoutEffect(() => {
    if (defaultValues) return;
    try {
      const raw = sessionStorage.getItem("searchBarForm");
      if (!raw) return;
      const parsed = codec_SearchSpec_Params.safeDecode(JSON.parse(raw));
      if (parsed.success) {
        form.reset(parsed.data);
      }
    } catch (e) {
      console.error("Failed to load search bar form data from sessionStorage:", e);
    }
  }, [defaultValues, form]);


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
  const [locationQuery, setLocationQuery] = useState("");
  useLayoutEffect(() => {
    const fetchLocationName = async () => {
      const defaultSearchBarLocation = control._defaultValues?.location;
      if (!defaultSearchBarLocation) return;
      if (
        defaultSearchBarLocation.id &&
        defaultSearchBarLocation.type &&
        ["province", "ward", "hotel"].includes(defaultSearchBarLocation.type)
      ) {
        const locationName = await user_getLocationNameOrHotelNameById(defaultSearchBarLocation.id, defaultSearchBarLocation.type);
        setLocationQuery(locationName || "");
      }
    };
    fetchLocationName();
  }, [control._defaultValues.location]);

  const router = useRouter();
  const pathname = usePathname();
  const onSubmit = (formValues: SearchBar_FormOutput) => {
    if (formValues.location.type === "none" || !formValues.location.id) return;

    sessionStorage.setItem("searchBarForm", JSON.stringify(codec_SearchSpec_Params.encode(formValues)));

    if (formValues.location.type === "hotel") {
      const dest = PATHS.hotels + "/" + formValues.location.id;
      const { location, ...specWithoutLocation } = formValues;
      const encodedSpecWithoutLocation = codec_SearchSpecWithoutLocation_Params.encode(specWithoutLocation);
      const searchParams = new URLSearchParams(encodedSpecWithoutLocation).toString();
      router.push(`${dest}?${searchParams}`);
    } else {
      const dest = (pathname === PATHS.searchMap) ? PATHS.searchMap : PATHS.search;
      const encodedSpec = codec_SearchSpec_Params.encode(formValues);
      const searchParams = new URLSearchParams(encodedSpec).toString();
      router.push(`${dest}?${searchParams}`);
    }
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
            <FormLabel htmlFor="location-input">Khách sạn hoặc điểm đến</FormLabel>
            <LocationAutocomplete
              query={locationQuery}
              setQuery={setLocationQuery}
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
            <FormLabel htmlFor="date-range-picker">Ngày nhận / trả phòng</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-range-picker"
                  variant="outline"
                  className="text-sm lg:text-base overflow-hidden cursor-pointer"
                >
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
                      after: addDays(new Date(), 30),
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
              <FormLabel htmlFor="guests-and-rooms">Khách và phòng </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="guests-and-rooms"
                    variant="outline"
                    className="text-sm lg:text-base overflow-hidden cursor-pointer"
                  >
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
                        disabled={field.value.numAdults <= Math.max(MIN_ADULTS, field.value.numRooms)}
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


function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

type Location = {
  id: string;
  type: SearchBar_LocationType;
}

// TODO: This has reduced rerender compared to the original. But still rerender a lot. One keystroke causes 3 renders.
// NOTE: BaseUI will close when the query is empty. We want to show default suggestions in that case
import { user_getDefaultSearchBarLocations } from "@/lib/actions/search-bar";
import { addDays } from "date-fns";
function LocationAutocomplete({
  query,
  setQuery,
  onValueChange,
}: {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  onValueChange: (value: Location) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debouncedQuery = useDebounced(query, 500);

  const swrKey: readonly [string, string | null] =
    debouncedQuery.trim() !== ""
      ? ["locations", debouncedQuery.trim()]
      : ["locations", null];

  const { data = [], isLoading, error } = useSWR(
    swrKey,
    async ([, q]) => {
      if (q == null) {
        return await user_getDefaultSearchBarLocations();
      }
      return await user_getLocationOrHotelByQueryString(q as string);
    },
    { dedupingInterval: 10_000 }
  );

  useEffect(() => {
    // Prefetch default results once and populate SWR cache so clearing the query
    // doesn't trigger another network fetch for the default set.
    const prefetchDefault = async () => {
      try {
        const defaultData = await user_getDefaultSearchBarLocations();
        // Populate SWR cache for the default key without revalidating.
        mutate(["locations", null], defaultData, false);
      } catch (e) {
        // ignore prefetch errors
      }
    };
    prefetchDefault();
  }, []);

  // Only auto-open when input is focused. This prevents the list from being visible
  // when the input is not focused while keeping the behavior of showing defaults
  // for an empty query when focused.
  useEffect(() => {
    if (query.trim() === "" && isFocused && data.length > 0) {
      setIsOpen(true);
    }
  }, [query, data.length, isFocused]);

  // When the query becomes empty but the input is focused, show defaults.
  useEffect(() => {
    if (query.trim() === "" && isFocused) {
      setIsOpen(true);
    }
  }, [query, isFocused]);

  const isTypingOrLoading = (query !== debouncedQuery && query.trim() !== "") || isLoading;

  const handleRetry = () => {
    mutate(swrKey);
  };

  return (
    <Autocomplete
      open={isOpen}
      onOpenChange={setIsOpen}
      items={data as { id: string; type: SearchBar_LocationType; name: string, ward_name: string | null, province_name: string | null }[]}
      filter={null}
      limit={MAX_LOCATION_AUTOCOMPLETE_RESULTS}
      itemToStringValue={item => item.name}
      value={query}
      onValueChange={(v) => {
        // Autocomplete may pass either a string (query) or an item; normalize to string query
        if (typeof v === "string") {
          setQuery(v);
          // typing should open the list (only if focused)
          if (v.trim() !== "" && isFocused) setIsOpen(true);
        } else if (v && typeof v === "object") {
          setQuery((v as { name?: string }).name ?? "");
        } else {
          setQuery("");
        }
      }}
    >
      <AutocompleteInput
        id="location-input"
        placeholder="Bạn muốn đi đâu?"
        showTrigger={false}
        showClear
        className="w-full hover:bg-accent"
        onFocus={() => {
          setIsFocused(true);
          // When focused, open the list (respecting whether query is empty or not)
          setIsOpen(true);
        }}
        onBlur={() => {
          setIsFocused(false);
          // Let Autocomplete's onOpenChange decide closing, but still ensure we don't
          // leave the list open when input is not focused and there's a non-empty query.
          // We do not forcibly close here to avoid interfering with item clicks.
        }}
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

        {!isTypingOrLoading && !error && data.length === 0 && (
          <AutocompleteEmpty>Không tìm thấy địa điểm này.</AutocompleteEmpty>
        )}

        {!error && data.length > 0 && (
          <AutocompleteList>
            {data.map(item => (
              <AutocompleteItem
                key={`${item.type}::${item.id}`}
                value={item}
                className="h-12 flex justify-between items-center px-4"
                onClick={() => {
                  onValueChange({ id: item.id, type: item.type as SearchBar_LocationType });
                  // close when an item is selected
                  setIsOpen(false);
                }}
              >
                <div className="flex flex-col gap-y-1">
                  <span className="font-semibold truncate">
                    {item.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {[item.ward_name, item.province_name].filter(Boolean).join(", ")}
                  </span>
                </div>
                <span className="text-xs bg-accent text-primary rounded-full px-2 py-1">
                  {item.type === "hotel" ? "Khách sạn" : item.type === "province" ? "Tỉnh/Thành phố" : item.type === "ward" ? "Phường/Xã" : ""}
                </span>
              </AutocompleteItem>
            ))}
          </AutocompleteList>
        )}
      </AutocompleteContent>
    </Autocomplete>
  );
}
// NOTE: should experiment removing useSWR