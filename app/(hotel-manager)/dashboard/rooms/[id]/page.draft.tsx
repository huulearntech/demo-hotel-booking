import { notFound } from "next/navigation";
import {
  hotelowner_getRoomById,
  //  hotelowner_updateRoomById
} from "@/lib/actions/hotel-manager/rooms";

import { Separator } from "@/components/ui/separator";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = await params;
  const result = await hotelowner_getRoomById(roomId);

  if (!result.ok) {
    // Handle common HTTP statuses with professional, shadcn-like UI
    const errorBoxBase =
      "max-w-2xl mx-auto p-6 rounded-lg shadow-sm border border-muted-foreground/10 bg-card flex items-start gap-4";

    switch (result.status) {
      case 404:
        notFound();

      case 401:
        return (
          <div className="p-6">
            <div className={errorBoxBase}>
              <svg
                className="w-6 h-6 text-amber-500 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path d="M12 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path
                  d="M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="flex-1">
                <h3 className="text-lg font-semibold">Unauthorized</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  You must be signed in to view this room. Please sign in with an account that belongs to the hotel owner.
                </p>
                <div className="mt-4 flex gap-2">
                  <a
                    href="/login"
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-95"
                  >
                    Sign in
                  </a>
                  <a
                    href="/"
                    className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm text-muted-foreground hover:bg-muted"
                  >
                    Back to home
                  </a>
                </div>
              </div>
            </div>
          </div>
        );

      case 403:
        return (
          <div className="p-6">
            <div className={errorBoxBase}>
              <svg
                className="w-6 h-6 text-red-500 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path d="M12 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path
                  d="M10.29 3.86L1.82 12.34A9 9 0 1012 3a8.96 8.96 0 00-1.71.86z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="flex-1">
                <h3 className="text-lg font-semibold">Access denied</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  You don't have permission to view or manage this room. If you believe this is an error, contact your account administrator.
                </p>
                <div className="mt-4 flex gap-2">
                  <a
                    href="/dashboard"
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-muted text-sm hover:opacity-95"
                  >
                    Go to dashboard
                  </a>
                  <button
                    type="button"
                    onClick={() => {}}
                    className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm text-muted-foreground"
                    disabled
                  >
                    Request access
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-6">
            <div className={errorBoxBase}>
              <svg
                className="w-6 h-6 text-slate-500 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path d="M12 8v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path
                  d="M21 12A9 9 0 113 12a9 9 0 0118 0z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="flex-1">
                <h3 className="text-lg font-semibold">Something went wrong</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  An unexpected error occurred{result.error ? `: ${result.error}` : "."} Please try again later.
                </p>
                <div className="mt-4">
                  <a
                    href="/dashboard"
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-muted text-sm hover:opacity-95"
                  >
                    Return to dashboard
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
    }
  }

  const room = result.data;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{room.name}</h1>
        <h2 className="text-xl font-semibold">{room.type.name}</h2>
        <p className="text-sm text-muted-foreground">
          {`Hotel: ${room.type.hotel.name} • Created ${new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }).format(new Date(room.createdAt))}`}
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 bg-card p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-2">Details</h2>
          <dl className="grid grid-cols-1 gap-y-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Price per night</dt>
              <dd className="font-medium">${room.type.price.toNumber()}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Adult capacity</dt>
              <dd className="font-medium">{room.type.adultCapacity}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Children capacity</dt>
              <dd className="font-medium">{room.type.childrenCapacity}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Beds</dt>
              <dd className="font-medium">{room.type.bedType}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Images</dt>
              <dd className="mt-2">
                {room.type.imageUrls && room.type.imageUrls.length > 0 ? (
                  <ul className="flex gap-2 flex-wrap">
                    {room.type.imageUrls.map((src, i) => (
                      <li key={i} className="w-28 h-20 bg-muted rounded overflow-hidden">
                        {/* TODO next/Image */}
                        <img src={src} alt={`room-${i}`} className="object-cover w-full h-full" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-muted-foreground">No images</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <aside className="bg-card p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium mb-3">Manage Room</h3>
          {/* <RoomForm room={roomSerialized} onSubmit={hotelowner_updateRoomById}/> */}

          <Separator />
          <div className="text-xs text-muted-foreground">
            {/* <p>Room ID: {room.id}</p> */}
            {/* <p>Hotel ID: {room.hotelId}</p> */}
          </div>
        </aside>
      </section>
    </div>
  );
};

import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const session = await auth();
  if (session?.user.role !== "HOTEL_OWNER") {
    return { title: "Unauthorized" };
  }
  const { id: roomId } = await params;
  const room = await prisma.room.findUnique({
    where: { id: roomId, type: { hotel: { ownerId: session.user.id } } },
    select: { name: true },
  });
  return {
    title: room?.name ? `Chi tiết phòng - ${room.name}`: "Không tìm thấy phòng",
  };
}