"use client"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { getAllCommonFacilities, hotelowner_connectCommonFacility, hotelowner_getCustomFacilities } from "@/lib/actions/hotel-manager/facilities";
import { CACHE_TAGS } from "@/lib/constants";
import { FacilityType } from "@/lib/generated/prisma/enums";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";


export function ComboboxFindCustomFacilities({ onItemSelect }: {
  onItemSelect: (item: { id: string, name: string, type: FacilityType }) => void
}) {
  const {
    data: facilities = [],
    // isLoading,
    // isError,
    // error,
  } = useQuery({
    queryKey: [CACHE_TAGS.hotelowner_custom_facilities],
    queryFn: async () => { return await hotelowner_getCustomFacilities() },
    select: (res) => {
      if (!res?.ok) throw new Error(res?.error ?? "Có lỗi xảy ra khi tải tiện nghi.");
      return res.data ?? [];
    },
  });

  return (
    <Combobox items={facilities} autoHighlight>
      <ComboboxInput placeholder="Tiện nghi của riêng khách sạn..." />
      <ComboboxContent>
        <ComboboxEmpty>Không tìm thấy tiện nghi nào.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem
              key={item.id}
              value={item.id}
              onClick={() => onItemSelect(item)}
            >
              <span className="font-semibold truncate">
                {item.name}
              </span>
              <span className="text-xs bg-accent text-primary rounded-full px-2 py-1">
                {item.type.charAt(0) + item.type.slice(1).replace(/_/g, " ").toLowerCase()}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}


export function ComboboxFindCommonFacilities({ onItemSelect }: {
  onItemSelect: (item: { id: string, name: string, type: FacilityType }) => void
}) {

  const {
    data: facilities = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["hotelowner_getCustomFacilities"],
    queryFn: async () => { return await getAllCommonFacilities() },
    select: (res) => {
      if (!res?.ok) throw new Error(res?.error ?? "Có lỗi xảy ra khi tải tiện nghi.");
      return res.data ?? [];
    },
  });

  const [value, setValue] = useState<string[]>([
     'be20d885-d542-4b12-8817-d602825ead5b'
  ])

  return (
    <Combobox
      items={facilities}
      // itemToStringValue={item => item.id}
      autoHighlight
      multiple
      // value={value}
      // onValueChange={setValue}
      defaultValue={[      'be20d885-d542-4b12-8817-d602825ead5b']}
    >
      <ComboboxInput placeholder="Tiện nghi phổ biến..." />
      <ComboboxContent>
        <ComboboxEmpty>Không tìm thấy tiện nghi nào.</ComboboxEmpty>
        <ComboboxList>
          {(item: {id: string, name: string, type: FacilityType}) => (
            <ComboboxItem
              key={item.id}
              value={item.id}
              onClick={async () => {
                const result = await hotelowner_connectCommonFacility(item.id);
                if (result.ok) {
                  onItemSelect(item)
                  toast.success("Thêm tiện nghi thành công!")
                } else {
                  toast.error(result.error || "Có lỗi xảy ra. Vui lòng thử lại sau.")
                }
              }}
              className="h-12 flex justify-between items-center px-4"
            >
              <span className="font-semibold clamp-2 overflow-ellipsis">
                {item.name}
              </span>
              <span className="text-xs bg-accent text-primary rounded-full px-2 py-1 text-center">
                {item.type.charAt(0) + item.type.slice(1).replace(/_/g, " ").toLowerCase()}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}