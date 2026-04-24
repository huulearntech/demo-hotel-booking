import BookingsInfiniteScrollList from "./bookings-infinite-list";

export default async function AccountHistoryPage() {
  return (
    <div className="content py-8 gap-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-semibold">
          Lịch sử đặt phòng
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Tất cả các đơn đặt phòng bạn đã thực hiện sẽ được hiển thị ở đây.
        </p>
      </div>

      <section className="space-y-4">
        <BookingsInfiniteScrollList />
      </section>
    </div>
  );
}