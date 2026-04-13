import Link from "next/link";

import RoomTable from "./room-table";
import { hotelowner_getRoomTypes } from "@/lib/actions/hotel-manager/rooms";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function RoomsPage() {
  const result = await hotelowner_getRoomTypes();
  if (!result.ok) {
    return null;
  }
  const rooms = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Rooms</h1>
          <p className="text-sm text-muted-foreground">
            Manage rooms for your hotel — view, edit or remove rooms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/rooms/new">
            <Button variant="default" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add room
            </Button>
          </Link>
        </div>
      </div>

      <RoomTable rooms={rooms} />
    </div>
  );
}