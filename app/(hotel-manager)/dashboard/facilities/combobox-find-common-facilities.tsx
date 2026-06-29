"use client"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { getAllCommonFacilities, hotelowner_connectCommonFacility, hotelowner_getCustomFacilities } from "@/lib/actions/hotel-manager/facilities";
import { CACHE_TAGS } from "@/lib/constants";
import { FacilityType } from "@/lib/generated/prisma/enums";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


export function ComboboxFindCustomFacilities({ onItemSelect }: {
  onItemSelect: (item: { id: string, name: string, type: FacilityType }) => void
}) {
  const {
    data: facilities = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["hotelowner_getCustomFacilities"],
    queryFn: async () => { return await hotelowner_getCustomFacilities() },
    select: (res) => {
      if (!res?.ok) throw new Error(res?.error ?? "Có lỗi xảy ra khi tải tiện nghi.");
      return res.data ?? [];
    },
  });

  return (
    <Combobox items={facilities} autoHighlight>
      <ComboboxInput placeholder="Tìm tiện nghi để thêm..." />
      <ComboboxContent>
        <ComboboxEmpty>Không tìm thấy tiện nghi nào.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem
              key={item.id}
              value={item.id}
              onSelect={() => onItemSelect(item)}
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


export function ComboboxFindCommonFacilities() {

  const {
    data: facilities = [],
    // isLoading,
    // isError,
    // error,
  } = useQuery({
    queryKey: ["hotelowner_getCommonFacilities"], // NOTE: This is not correct. this only rely on all common facilities
    queryFn: async () => { return await getAllCommonFacilities() },
    select: (res) => {
      if (!res?.ok) throw new Error(res?.error ?? "Có lỗi xảy ra khi tải tiện nghi.");
      return res.data ?? [];
    },
  });

  const qc = useQueryClient();

  return (
    <Combobox items={facilities} autoHighlight>
      <ComboboxInput placeholder="Tìm tiện nghi để thêm..." />
      <ComboboxContent>
        <ComboboxEmpty>Không tìm thấy tiện nghi nào.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem
              key={item.id}
              value={item.id}
              onClick={async () => {
                const result = await hotelowner_connectCommonFacility(item.id);
                if (result.ok) {
                  qc.invalidateQueries({ queryKey: [CACHE_TAGS.hotelowner_common_facilities]})
                  toast.success("Thêm tiện nghi thành công!");
                } else {
                  toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
                }
              }}
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