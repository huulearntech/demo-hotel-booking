import BookingsInfiniteScrollList from "./bookings-infinite-list";

export default async function AccountHistoryPage() {
  return (
    <div className="content flex flex-col gap-y-6 py-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold">
          Lịch sử đặt phòng
        </h1>
        <p className="text-sm text-muted-foreground">
          Tất cả các đơn đặt phòng bạn đã thực hiện sẽ được hiển thị ở đây.
        </p>
      </div>

      <section>
        <BookingsInfiniteScrollList />
      </section>
    </div>
  );
}