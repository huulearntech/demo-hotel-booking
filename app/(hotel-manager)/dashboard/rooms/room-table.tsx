"use client";

import { useState } from "react";

import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { createColumns } from "./columns";
import { hotelowner_deleteRoomById } from "@/lib/actions/hotel-manager/rooms";

import type { RoomType } from "@/lib/actions/hotel-manager/rooms";

export default function RoomTable({ rooms }: { rooms: RoomType[] }) {
  const [roomsSerialized, setRoomsSerialized] = useState<RoomType[]>(rooms);

  // TODO: Handle user quit or refresh during the optimistic delete window (e.g. by using a "pendingDelete" state and checking it on mount to restore any rooms that were pending delete but not confirmed by the server)
  const columns = createColumns((id: string) => {
    // Find the room being deleted and its index so we can restore it on Undo
    const originalIndex = roomsSerialized.findIndex((r) => r.id === id);
    const deletedRoom = roomsSerialized[originalIndex];

    if (!deletedRoom) return;

    // Optimistically remove the room from UI
    setRoomsSerialized((prev) => prev.filter((r) => r.id !== id));

    // Delay the actual delete to allow an "Undo" window (optimistic UX).
    const DELETE_DELAY = 5000;
    const timer = window.setTimeout(async () => {
      try {
        await hotelowner_deleteRoomById(id);
      } catch (error) {
        // If server delete failed, restore the room and show an error
        setRoomsSerialized((prev) => {
          // Avoid duplicating if already restored
          if (prev.some((r) => r.id === id)) return prev;
          const next = [...prev];
          const insertAt = Math.min(Math.max(originalIndex, 0), next.length);
          next.splice(insertAt, 0, deletedRoom);
          return next;
        });
        toast("Failed to delete room");
      }
    }, DELETE_DELAY);

    // Show toast with Undo action
    toast("Deleted room", {
      description: deletedRoom.name,
      action: {
        label: "Undo",
        onClick: () => {
          // Cancel the pending delete and restore the room in UI
          clearTimeout(timer);
          setRoomsSerialized((prev) => {
            // Avoid duplicating if already present
            if (prev.some((r) => r.id === id)) return prev;
            const next = [...prev];
            const insertAt = Math.min(Math.max(originalIndex, 0), next.length);
            next.splice(insertAt, 0, deletedRoom);
            return next;
          });
          toast.dismiss();
          toast("Restored room");
        },
      },
    });
  });

  return (
    <>
      <DataTable columns={columns} data={roomsSerialized} />
      <div className="mt-4 text-sm text-muted-foreground">
        Showing {roomsSerialized.length} room{roomsSerialized.length !== 1 ? "s" : ""}.
      </div>
    </>
  );
}