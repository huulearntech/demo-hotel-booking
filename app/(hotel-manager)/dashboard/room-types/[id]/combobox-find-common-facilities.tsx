"use client"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { getAllCommonFacilities, hotelowner_connectCommonFacility, hotelowner_connectCustomFacilityToRoomType, hotelowner_getCommonFacilitiesOfRoomType, hotelowner_getCustomFacilities } from "@/lib/actions/hotel-manager/facilities";
import { CACHE_TAGS } from "@/lib/constants";
import { FacilityType } from "@/lib/generated/prisma/enums";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


export function ComboboxFindCustomFacilities({ roomTypeId, onItemSelect }: {
  roomTypeId: string;
  onItemSelect: (item: { id: string, name: string, type: FacilityType }) => void
}) {
  const {
    data: facilities = [],
    // isLoading,
    // isError,
    // error,
  } = useQuery({
    queryKey: [CACHE_TAGS.hotelowner_custom_facilities_of_room_type, roomTypeId],
    queryFn: async () => { return await hotelowner_getCustomFacilities() },
    select: (res) => {
      if (!res?.ok) throw new Error(res?.error ?? "Có lỗi xảy ra khi tải tiện nghi.");
      return res.data ?? [];
    },
  });

  const qc = useQueryClient();

  return (
    <Combobox items={facilities} autoHighlight>
      <ComboboxInput placeholder="Tìm tiện nghi..." />
      <ComboboxContent>
        <ComboboxEmpty>Không tìm thấy tiện nghi nào.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem
              key={item.id}
              value={item.id}
              onClick={async () => {
                const result = await hotelowner_connectCustomFacilityToRoomType(item.id, roomTypeId);
                if (result.ok) {
                  qc.invalidateQueries({ queryKey: [CACHE_TAGS.hotelowner_custom_facilities_of_room_type, roomTypeId] })
                  onItemSelect(item)
                  toast.success("Thêm tiện nghi thành công!")
                } else {
                  toast.error(result.error || "Có lỗi xảy ra. Vui lòng thử lại sau.")
                }
              }}
              className="h-12 flex justify-between items-center px-4"
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


export function ComboboxFindCommonFacilities({
  roomTypeId,
  onItemSelect
}: {
  roomTypeId: string;
  onItemSelect: (facility: { id: string, name: string, type: FacilityType }) => void
}) {

  const {
    data: facilities = [],
    // isLoading,
    // isError,
    // error,
  } = useQuery({
    queryKey: [CACHE_TAGS.hotelowner_common_facilities],
    queryFn: async () => { return await getAllCommonFacilities() },
    select: (res) => {
      if (!res?.ok) throw new Error(res?.error ?? "Có lỗi xảy ra khi tải tiện nghi.");
      return res.data ?? [];
    },
  });

  const {
    data: existing_facilities = [],
    // isLoading,
    // isError,
    // error,
  } = useQuery({
    queryKey: [CACHE_TAGS.hotelowner_common_facilities_of_room_type, roomTypeId],
    queryFn: async () => { return await hotelowner_getCommonFacilitiesOfRoomType(roomTypeId) },
    select: (res) => {
      if (!res?.ok) throw new Error(res?.error ?? "Có lỗi xảy ra khi tải tiện nghi.");
      return res.data ?? [];
    },
  });

  const qc = useQueryClient();

  return (
    <Combobox
      items={facilities}
      itemToStringValue={item => item.id}
      autoHighlight
      multiple
      value={existing_facilities}
      // onValueChange={setValue}
      // defaultValue={[]}
    >
      <ComboboxInput placeholder="Tìm tiện nghi..." />
      <ComboboxContent>
        <ComboboxEmpty>Không tìm thấy tiện nghi nào.</ComboboxEmpty>
        <ComboboxList>
          {(item: {id: string, name: string, type: FacilityType}) => (
            <ComboboxItem
              key={item.id}
              value={item.id}
              onClick={async () => {
                const result = await hotelowner_connectCommonFacility(item.id, roomTypeId);
                if (result.ok) {
                  qc.invalidateQueries({ queryKey: [CACHE_TAGS.hotelowner_common_facilities_of_room_type, roomTypeId] })
                  onItemSelect(item);
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