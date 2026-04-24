import Image from "next/image";
import { notFound } from "next/navigation";
import {
  hotelowner_getRoomTypeById,
  //  hotelowner_updateRoomById
} from "@/lib/actions/hotel-manager/rooms";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash, UploadCloud } from "lucide-react";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomTypeId } = await params;
  const result = await hotelowner_getRoomTypeById(roomTypeId);
  if (!result.ok) {
    if (result.status === 404) notFound();
    if (result.status === 403) return <p className="p-6 text-center text-red-500">You do not have permission to view this room.</p>;
    else return <p className="p-6 text-center text-red-500">An error occurred: {result.error}</p>;
  }

  const roomType = result.data;
  const priceNumber = roomType.price?.toNumber ? roomType.price.toNumber() : Number(roomType.price || 0);
  const formattedPrice = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(priceNumber);

  return (
    <div className="content">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{roomType.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{roomType.hotel?.name ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Edit className="size-4" />
            Chỉnh sửa
          </Button>
          <Button size="sm" variant="destructive" className="flex items-center gap-2">
            <Trash className="size-4" />
            Xóa
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết loại phòng</CardTitle>
              <CardDescription>Quản lý thông tin cơ bản của loại phòng này</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label htmlFor="price" className="text-xs font-medium text-muted-foreground">Giá phòng (vnđ / đêm)</label>
                  <div className="mt-2 flex items-center gap-2">
                    <input id="price" name="price" type="text" defaultValue={formattedPrice} className="flex-1 rounded-r-md border px-3 py-2 text-sm" aria-label="Price per night" />
                  </div>
                </div>

                <div>
                  <label htmlFor="adultCapacity" className="text-xs font-medium text-muted-foreground">Sức chứa người lớn</label>
                  <input id="adultCapacity" name="adultCapacity" type="number" defaultValue={roomType.adultCapacity} min={1} className="mt-2 w-full rounded-md border px-3 py-2 text-sm" />
                </div>

                <div>
                  <label htmlFor="childrenCapacity" className="text-xs font-medium text-muted-foreground">Sức chứa trẻ em</label>
                  <input id="childrenCapacity" name="childrenCapacity" type="number" defaultValue={roomType.childrenCapacity} min={0} className="mt-2 w-full rounded-md border px-3 py-2 text-sm" />
                </div>

                <div>
                  <label htmlFor="bedType" className="text-xs font-medium text-muted-foreground">Loại giường</label>
                  <input id="bedType" name="bedType" type="text" defaultValue={roomType.bedType} className="mt-2 w-full rounded-md border px-3 py-2 text-sm" />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Số phòng thuộc loại này</label>
                  <div className="mt-2 text-lg font-medium">{roomType._count.rooms}</div>
                </div>

                <div className="md:col-span-2 flex items-center gap-2 mt-2">
                  <Button type="button">Lưu thay đổi</Button>
                  <Button variant="outline">Hủy</Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">Thay đổi sẽ được áp dụng sau khi lưu.</CardFooter>
          </Card>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Mô tả</CardTitle>
                <CardDescription>Thông tin bổ sung về loại phòng (nếu có)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{roomType.description ?? "Chưa có mô tả cho loại phòng này."}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>Hình ảnh</CardTitle>
              <CardDescription>Ảnh minh họa cho loại phòng</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {roomType.imageUrls && roomType.imageUrls.length > 0 ? (
                  roomType.imageUrls.map((src, i) => (
                    <div key={i} className="relative w-full h-28 bg-muted rounded overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <Image src={src} alt={`room-${i}`} fill className="object-cover" />
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-6 text-center text-sm text-muted-foreground">Chưa có hình ảnh</div>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <label className="text-xs font-medium text-muted-foreground">Thêm ảnh</label>
                <div className="flex gap-2">
                  <input id="images" name="images" type="file" multiple className="sr-only" />
                  <Button variant="outline" className="flex items-center gap-2">
                    <UploadCloud className="size-4" /> Tải lên
                  </Button>
                  <Button variant="ghost">Xoá tất cả</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">Kích thước tối ưu: 1200x800. Các tệp lớn có thể được nén tự động.</CardFooter>
          </Card>

          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Nhanh</CardTitle>
                <CardDescription>Hành động nhanh với loại phòng</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button size="sm" className="w-full">Tạo phòng mới</Button>
                  <Button size="sm" variant="outline" className="w-full">Xem danh sách phòng</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </section>
    </div>
  );
}