import ReviewsClient from "./reviews-client";

export default async function Page() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Đánh giá từ khách hàng</h1>
        <p className="text-sm text-muted-foreground">
          Xem và quản lý các đánh giá mà khách hàng đã gửi về khách sạn của bạn.
        </p>
      </header>

      <ReviewsClient />
    </div>
  );
}