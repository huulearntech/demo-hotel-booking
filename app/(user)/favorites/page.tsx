import FavoritesList from "./favorites-client";

export default async function FavoritesPage() {
  return (
    <main className="content py-8 gap-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Khách sạn yêu thích</h1>
        <p className="text-sm text-muted-foreground">Các khách sạn bạn đã thêm vào danh sách yêu thích sẽ được hiển thị ở đây.</p>
      </div>

      <section className="space-y-6">
        <FavoritesList />
      </section>
    </main>
  );
}

export const metadata = {
  title: "Khách sạn yêu thích",
  description: "Xem và quản lý danh sách khách sạn yêu thích của bạn.",
};