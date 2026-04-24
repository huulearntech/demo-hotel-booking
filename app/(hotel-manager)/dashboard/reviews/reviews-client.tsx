"use client";

import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { fetchUnrepliedReviews, fetchRepliedReviews, hotelowner_replyToReview } from "./tmp-actions";
import { RepliedReviewType, UnrepliedReviewType } from "./tmp-actions";


export default function ReviewsClient({
  initialUnreplied,
  initialReplied,
}: {
  initialUnreplied: UnrepliedReviewType[];
  initialReplied: RepliedReviewType[];
}) {
  const qc = useQueryClient();

  // Queries with initialData from the server component
  const unrepliedQuery = useQuery<UnrepliedReviewType[]>({
    queryKey: ["reviews", "unreplied"],
    queryFn: async () => {
      // fetch and map backend shape to the client Review shape
      const data = await fetchUnrepliedReviews();
      return data.map((item: any) => ({
        id: item.id,
        booking: item.booking ?? null,
        customerName: item.booking?.customerName ?? null,
        rating: item.rating,
        comment: item.comment ?? null,
        createdAt: new Date(item.createdAt).toISOString(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
        reply: item.reply ?? null,
        repliedAt: item.repliedAt ? new Date(item.repliedAt).toISOString() : null,
      })) as UnrepliedReviewType[];
    },
    initialData: initialUnreplied,
  });

  const repliedQuery = useQuery<RepliedReviewType[]>({
    queryKey: ["reviews", "replied"],
    queryFn: async () => {
      const data = await fetchRepliedReviews();
      return data.map((item: any) => ({
        id: item.id,
        booking: item.booking ?? null,
        customerName: item.booking?.customerName ?? null,
        rating: item.rating,
        comment: item.comment ?? null,
        createdAt: new Date(item.createdAt).toISOString(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
        reply: item.reply ?? null,
        repliedAt: item.repliedAt ? new Date(item.repliedAt).toISOString() : null,
      })) as RepliedReviewType[];
    },
    initialData: initialReplied,
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, reply }: { id: string; reply: string }) => {
      // Call server action directly
      return await hotelowner_replyToReview(id, reply);
    },
    onMutate: async ({ id, reply }: { id: string; reply: string }) => {
      // optimistic update: move from unreplied to replied list
      await qc.cancelQueries({ queryKey: ["reviews", "unreplied"] });
      await qc.cancelQueries({ queryKey: ["reviews", "replied"] });

      const prevUnreplied = qc.getQueryData<UnrepliedReviewType[]>(["reviews", "unreplied"]);
      const prevReplied = qc.getQueryData<RepliedReviewType[]>(["reviews", "replied"]);

      if (prevUnreplied) {
        const updated = prevUnreplied.filter((r) => r.id !== id);
        qc.setQueryData<UnrepliedReviewType[]>(["reviews", "unreplied"], updated);
      }

      if (prevUnreplied) {
        const moved = prevUnreplied.find((r) => r.id === id);
        if (moved) {
          const newItem = {
            ...moved,
            reply,
            repliedAt: new Date().toISOString(),
          } as unknown as RepliedReviewType;
          qc.setQueryData<RepliedReviewType[]>(["reviews", "replied"], (old: RepliedReviewType[] = []) => [
            newItem,
            ...old,
          ]);
        }
      }

      return { prevUnreplied, prevReplied };
    },
    onError: (err: unknown, _variables: { id: string; reply: string }, context?: { prevUnreplied?: UnrepliedReviewType[]; prevReplied?: RepliedReviewType[] }) => {
      // rollback
      if (context?.prevUnreplied) {
        qc.setQueryData<UnrepliedReviewType[]>(["reviews", "unreplied"], context.prevUnreplied);
      }
      if (context?.prevReplied) {
        qc.setQueryData<RepliedReviewType[]>(["reviews", "replied"], context.prevReplied);
      }
      // optional: you can log or surface `err` here
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  return (
    <div>
      <Tabs defaultValue="unreplied" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="unreplied">Unreplied</TabsTrigger>
          <TabsTrigger value="replied">Replied</TabsTrigger>
        </TabsList>

        <TabsContent value="unreplied">
          <ScrollArea className="max-h-120 pr-2">
            {unrepliedQuery.isLoading ? (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : unrepliedQuery.data && unrepliedQuery.data.length > 0 ? (
              <div className="space-y-4">
                {unrepliedQuery.data.map((r) => (
                  <ReviewItem
                    key={r.id}
                    review={r}
                    onReply={(reply) => replyMutation.mutate({ id: r.id, reply })}
                    replying={replyMutation.status === "pending"}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No unreplied reviews.</div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="replied">
          <ScrollArea className="max-h-120 pr-2">
            {repliedQuery.isLoading ? (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : repliedQuery.data && repliedQuery.data.length > 0 ? (
              <div className="space-y-4">
                {repliedQuery.data.map((r) => (
                  <RepliedItem key={r.id} review={r} />
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No replied reviews yet.</div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReviewItem({
  review,
  onReply,
  replying,
}: {
  review: UnrepliedReviewType;
  onReply: (reply: string) => void;
  replying: boolean;
}) {
  const [text, setText] = useState("");
  return (
    <div className="flex gap-4 p-4 rounded-md border bg-card">
      <Avatar className="h-10 w-10">
        <AvatarFallback>{(review.booking?.customerName ?? "U").slice(0, 1)}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-medium">{review.booking?.customerName ?? "Guest"}</div>
            <div className="text-sm text-muted-foreground">{review.comment}</div>
          </div>

          <div className="text-right">
            <div className="text-sm">
              <Badge variant="secondary">{review.rating} ★</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>

        <Separator className="my-3" />

        <div className="flex gap-2 items-center">
          <Textarea
            className="flex-1"
            placeholder="Write a polite reply..."
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
            rows={2}
          />
          <Button
            onClick={() => {
              if (!text.trim()) return;
              onReply(text.trim());
              setText("");
            }}
            disabled={replying || text.trim().length === 0}
          >
            Reply
          </Button>
        </div>
      </div>
    </div>
  );
}

function RepliedItem({ review }: { review: RepliedReviewType }) {
  return (
    <div className="flex gap-4 p-4 rounded-md border bg-card">
      <Avatar className="h-10 w-10">
        <AvatarFallback>{(review.booking?.customerName ?? "U").slice(0, 1)}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-medium">{review.booking?.customerName ?? "Guest"}</div>
            <div className="text-sm text-muted-foreground">{review.comment}</div>
          </div>

          <div className="text-right">
            <div className="text-sm">
              <Badge variant="secondary">{review.rating} ★</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Replied {formatDistanceToNow(new Date(review.repliedAt ?? review.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>

        <Separator className="my-3" />

        <div className="rounded-md border p-3 bg-muted text-sm">
          {review.reply}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex gap-4 p-4 rounded-md border animate-pulse">
      <div className="h-10 w-10 rounded-full bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-3/4 bg-slate-200 rounded" />
        <div className="h-8 w-full bg-slate-200 rounded" />
      </div>
    </div>
  );
}