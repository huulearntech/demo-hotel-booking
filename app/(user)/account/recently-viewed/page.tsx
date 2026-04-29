import RecentlyViewedList from "./recently-viewed-list";

export default async function AccountRecentlyViewedPage() {

  return (
    <main className="content flex flex-col py-6 gap-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold">Khách sạn đã xem gần đây</h1>
        <p className="text-sm text-muted-foreground">Các mục bạn xem sẽ được lưu và hiển thị tại đây.</p>
      </div>

      <section>
        <RecentlyViewedList />
      </section>
    </main>
  );
}