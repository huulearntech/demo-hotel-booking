"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createColumns, RoomRow } from "./columns";
import {
  hotelowner_getRoomsOfType
} from "@/lib/actions/hotel-manager/rooms";

import { DataTable } from "@/components/data-table";
import { hotelowner_getRoomTypesNameAndId } from "@/lib/actions/hotel-manager/room-types";

export interface RoomsTableProps {
  roomTypes: Array<{ id: string; name: string }>;
}

export default function RoomsTable() {
  const [roomTypes, setRoomTypes] = useState<Array<{ id: string; name: string }>>([]);
  const { data: rooms = [], isLoading: isLoadingRooms, isError: roomsError } = useQuery<RoomRow[], Error>({
    queryKey: ["hotelowner_rooms"],
    queryFn: async () => {
      const response = await hotelowner_getRoomsOfType();
      if (!response.ok) {
        throw new Error(response.error || "Failed to load rooms");
      }
      return response.data;
    },
  });
  
  useEffect(() => {
    (async () => {
      const response = await hotelowner_getRoomTypesNameAndId();
      setRoomTypes(response);
    })();
  }, []);
    

  const columns = useMemo(() => createColumns(roomTypes), [roomTypes]);

  if (isLoadingRooms) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Đang tải dữ liệu phòng…</div>;
  }

  if (roomsError) {
    return <div className="py-8 text-center text-sm text-destructive">Không thể tải danh sách phòng. Vui lòng thử lại.</div>;
  }

  if (rooms.length === 0) {
    return (
      <div className="py-8">
        <p className="text-center text-sm text-gray-500">Chưa có phòng nào được tạo cho khách sạn này.</p>
      </div>
    );
  }

  return (
    <DataTable columns={columns} data={rooms} />
  );
}