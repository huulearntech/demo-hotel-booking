"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { customFacilityColumns } from "./columns-for-custom";
import {
  hotelowner_getCommonFacilitiesThatHisHotelHas,
  hotelowner_getCustomFacilities
} from "@/lib/actions/hotel-manager/facilities";
import { CACHE_TAGS } from "@/lib/constants";
import { commonFacilityColumns } from "./columns-for-common";

export function CommonFacilitiesTable() {
  const { data: facilities = [], isLoading, isError } = useQuery({
    queryKey: [CACHE_TAGS.hotelowner_common_facilities],
    queryFn: async () => {
      const result = await hotelowner_getCommonFacilitiesThatHisHotelHas();
      if (!result.ok) throw new Error(result.error || "Failed to load facilities");
      return result.data;
    },
  });

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Đang tải tiện nghi…</div>;
  }

  if (isError) {
    return <div className="py-8 text-center text-sm text-destructive">Không thể tải danh sách tiện nghi. Vui lòng thử lại.</div>;
  }

  if (facilities.length === 0) {
    return (
      <div className="py-8">
        <p className="text-center text-sm text-gray-500">Chưa có tiện nghi nào được tạo.</p>
      </div>
    );
  }

  return <DataTable columns={commonFacilityColumns} data={facilities} />;
}


export function CustomFacilitiesTable() {
  const { data: facilities = [], isLoading, isError } = useQuery({
    queryKey: [CACHE_TAGS.hotelowner_custom_facilities],
    queryFn: async () => {
      const result = await hotelowner_getCustomFacilities();
      if (!result.ok) throw new Error(result.error || "Failed to load facilities");
      return result.data;
    },
  });

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Đang tải tiện nghi…</div>;
  }

  if (isError) {
    return <div className="py-8 text-center text-sm text-destructive">Không thể tải danh sách tiện nghi. Vui lòng thử lại.</div>;
  }

  if (facilities.length === 0) {
    return (
      <div className="py-8">
        <p className="text-center text-sm text-gray-500">Chưa có tiện nghi nào được tạo.</p>
      </div>
    );
  }

  return <DataTable columns={customFacilityColumns} data={facilities} />;
}
