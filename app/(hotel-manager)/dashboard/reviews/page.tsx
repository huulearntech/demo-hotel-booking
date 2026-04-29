import ReviewsClient from "./reviews-client";

export default async function Page() {
  return (
    <div className="flex flex-col gap-y-6">
      <header className="flex flex-col gap-y-2">
        <h1 className="font-semibold">Đánh giá từ khách hàng</h1>
        <p className="text-sm text-muted-foreground">
          Xem và quản lý các đánh giá mà khách hàng đã gửi về khách sạn của bạn.
        </p>
      </header>

      <ReviewsClient />
    </div>
  );
}