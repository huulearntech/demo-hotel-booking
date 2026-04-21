import ReviewsClient from "./reviews-client";
import { fetchRepliedReviews, fetchUnrepliedReviews } from "./tmp-actions";

export default async function Page() {
  const [unreplied, replied] = await Promise.all([
    fetchUnrepliedReviews(),
    fetchRepliedReviews(),
  ]);

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Customer Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Manage and reply to customer reviews for your hotel.
        </p>
      </header>

      {/* Client-side manager receives server-fetched initial data */}
      <ReviewsClient
        initialUnreplied={unreplied}
        initialReplied={replied}
      />
    </div>
  );
}