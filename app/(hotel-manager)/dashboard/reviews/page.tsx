import ReviewsClient from "./reviews-client";
import { fetchRepliedReviews, fetchUnrepliedReviews } from "./tmp-actions";

export default async function Page() {
  // TODO: move this data fetching logic into the client component and use SWR for caching and revalidation
  const [unreplied, replied] = await Promise.all([
    fetchUnrepliedReviews(),
    fetchRepliedReviews(),
  ]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Đánh giá từ khách hàng</h1>
        <p className="text-sm text-muted-foreground">
          Xem và quản lý các đánh giá mà khách hàng đã gửi về khách sạn của bạn.
        </p>
      </header>

      <ReviewsClient
        initialUnreplied={unreplied}
        initialReplied={replied}
      />
    </div>
  );
}