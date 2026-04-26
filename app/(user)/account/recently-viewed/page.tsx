import RecentlyViewedList from "./recently-viewed-list";

export default async function AccountRecentlyViewedPage() {

  return (
    <main className="content py-8 gap-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-semibold">Khách sạn đã xem gần đây</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">Các mục bạn xem sẽ được lưu và hiển thị tại đây.</p>
      </div>

      <section className="space-y-6">
        <RecentlyViewedList />
      </section>
    </main>
  );
}