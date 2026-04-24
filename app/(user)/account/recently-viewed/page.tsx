import RecentlyViewedList from "./recently-viewed-list";

export default async function AccountRecentlyViewedPage() {

  return (
    <main className="content py-8 gap-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-semibold">Khách sạn đã xem gần đây</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">Các mục bạn xem sẽ được lưu và hiển thị tại đây.</p>
      </div>

      <section className="space-y-6">
        {/* {hotelsRecentlyViewedByUser.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
            <p className="text-lg text-gray-600">Hiện chưa có khách sạn nào trong lịch sử xem của bạn.</p>
            <p className="mt-2 text-sm text-gray-500">Hãy tìm kiếm và xem các khách sạn; những mục bạn xem sẽ được lưu và hiển thị tại đây.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            { // TODO: href
              hotelsRecentlyViewedByUser.map(hotel => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  href="#"
                  onFavoriteToggle={undefined}
                />
              ))
            }
          </div>
        )} */}
        <RecentlyViewedList />
      </section>
    </main>
  );
}