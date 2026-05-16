"use client";

import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { hotelowner_getReviews, hotelowner_replyToReview } from "@/lib/actions/hotel-manager/reviews";
import { hotelowner_getReviews as core_hotelowner_getReviews } from "@/lib/generated/prisma/sql";

import Image from "next/image";
import { tvlk_favicon } from "@/public/logos";
import { MAX_RATING } from "@/lib/constants";
import { vi } from "date-fns/locale";


type ReviewType = core_hotelowner_getReviews.Result;

export default function ReviewsClient() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"unreplied" | "replied">("unreplied");
  const repliedFilter = tab === "replied";

  const {
    data: reviewsData,
    isLoading: reviewsLoading,
  } = useInfiniteQuery({
    queryKey: ["reviews", repliedFilter],
    queryFn: async ({ pageParam }: { pageParam: { createdAt: Date; id: string } | null }) => {
      const res = await hotelowner_getReviews(20, repliedFilter, pageParam);
      return res;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    refetchOnWindowFocus: false,
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, reply }: { id: string; reply: string }) => {
      // Call server action directly
      return await hotelowner_replyToReview(id, reply);
    },
    onMutate: async ({ id, reply }: { id: string; reply: string }) => {
      // optimistic update: move from unreplied to replied list
      await qc.cancelQueries({ queryKey: ["reviews", false] });
      await qc.cancelQueries({ queryKey: ["reviews", true] });

      const prevUnreplied = qc.getQueryData<ReviewType[]>(["reviews", false]);
      const prevReplied = qc.getQueryData<ReviewType[]>(["reviews", true]);

      if (prevUnreplied) {
        const updated = prevUnreplied.filter((r) => r.id !== id);
        qc.setQueryData<ReviewType[]>(["reviews", false], updated);
      }

      if (prevUnreplied) {
        const moved = prevUnreplied.find((r) => r.id === id);
        if (moved) {
          const newItem = {
            ...moved,
            reply,
            repliedAt: new Date().toISOString(),
          } as unknown as ReviewType;
          qc.setQueryData<ReviewType[]>(["reviews", true], (old: ReviewType[] = []) => [
            newItem,
            ...old,
          ]);
        }
      }

      return { prevUnreplied, prevReplied };
    },
    onError: (err: unknown, _variables: { id: string; reply: string }, context?: { prevUnreplied?: ReviewType[]; prevReplied?: ReviewType[] }) => {
      // rollback
      if (context?.prevUnreplied) {
        qc.setQueryData<ReviewType[]>(["reviews", false], context.prevUnreplied);
      }
      if (context?.prevReplied) {
        qc.setQueryData<ReviewType[]>(["reviews", true], context.prevReplied);
      }
      // optional: you can log or surface `err` here
    },
    onSettled: () => {
      // refresh both lists to keep UI consistent
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  const replying = replyMutation.status === "pending";

  const items = reviewsData?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Tabs value={tab} className="w-full" onValueChange={(v) => setTab(v as "unreplied" | "replied")}>
      <header className="flex justify-between items-center mb-2">
        <div className="flex flex-col gap-y-2">
          <h1 className="font-semibold">Đánh giá từ khách hàng</h1>
          <p className="text-sm text-muted-foreground">
            Xem và quản lý các đánh giá mà khách hàng đã gửi về khách sạn của bạn.
          </p>
        </div>

        <TabsList className="mb-4">
          <TabsTrigger value="unreplied">Chưa phản hồi</TabsTrigger>
          <TabsTrigger value="replied">Đã phản hồi</TabsTrigger>
        </TabsList>
      </header>

      <TabsContent value="unreplied">
        <ScrollArea className="max-h-120 pr-2">
          {reviewsLoading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : items.length > 0 ? (
            <div className="space-y-4">
              {items.map((r) => (
                <ReviewItem
                  key={r.id}
                  review={r}
                  onReply={(reply) => replyMutation.mutate({ id: r.id, reply })}
                  replying={replying}
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
          {reviewsLoading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : items.length > 0 ? (
            <div className="space-y-4">
              {items.map((r) => (
                <RepliedItem key={r.id} review={r} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No replied reviews yet.</div>
          )}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}

function ReviewItem({
  review,
  onReply,
  replying,
}: {
  review: ReviewType;
  onReply: (reply: string) => void;
  replying: boolean;
}) {
  const [text, setText] = useState("");
  const replyMutation = useMutation({
    mutationFn: async (reply: string) => {
      return await hotelowner_replyToReview(review.id, reply);
    },
    onSuccess: (_data, reply) => {
      if (onReply) onReply(reply);
    },
  });

  const timeAgo = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: vi });

  return (
    <div className="group data-[open=true]:h-fit px-6 py-4 rounded-xl border bg-card flex flex-col md:flex-row gap-x-12 gap-y-2 md:gap-y-0">
      <div className="flex md:flex-col items-center gap-x-4 md:gap-x-0 md:gap-y-2 shrink-0 w-full md:w-1/6">
        <Avatar size="lg">
          <AvatarImage src={review.authorProfileImageUrl ?? undefined} alt={review.authorName} />
          <AvatarFallback>{(review.authorName ?? "U").slice(0, 1)}</AvatarFallback>
        </Avatar>

        <div className="truncate flex flex-col gap-1">
          <span className="font-bold">{review.authorName}</span>

          <div className="flex gap-x-4 items-center md:hidden">
            <div className="px-2.5 py-0.5 rounded-full bg-blue-50 flex items-center justify-center space-x-1">
              <Image src={tvlk_favicon} alt="" aria-hidden className="size-4.5" />
              <div className="flex items-end gap-x-0.5">
                <div className="text-primary font-bold">{review.rating}</div>
                <div className="text-sm font-medium">/</div>
                <div className="text-sm font-medium">{MAX_RATING}</div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground"> Đánh giá {timeAgo} </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="hidden md:flex gap-x-4 items-center">
          <div className="px-2.5 py-0.5 rounded-full bg-blue-50 flex items-center justify-center space-x-1">
            <Image src={tvlk_favicon} alt="" aria-hidden className="size-4.5" />
            <div className="flex items-end gap-x-0.5">
              <div className="text-primary font-bold">{review.rating}</div>
              <div className="text-sm font-medium">/</div>
              <div className="text-sm font-medium">{MAX_RATING}</div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground"> Đánh giá {timeAgo} </div>
        </div>

        <p className="text-sm font-medium mt-3 whitespace-pre-wrap">{review.comment}</p>

        <Separator className="my-3" />

        <div className="flex flex-col gap-2">
          <Textarea
            className="w-full"
            placeholder="Viết phản hồi..."
            aria-label="Phản hồi cho đánh giá"
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
            rows={2}
          />
          <div className="flex justify-end">
            <Button
              onClick={() => {
                const replyText = text.trim();
                if (!replyText) return;
                replyMutation.mutate(replyText);
                setText("");
              }}
              disabled={replying || replyMutation.isPending || text.trim().length === 0}
              className="w-fit"
            >
              Phản hồi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RepliedItem({ review }: { review: ReviewType }) {
  const [open, setOpen] = useState(false);
  const timeAgo = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: vi });

  return (
    <div className="group data-[open=false]:h-fit px-6 py-4 rounded-xl border bg-card flex flex-col md:flex-row gap-x-12 gap-y-2 md:gap-y-0" data-open={open}>
      <div className="flex md:flex-col items-center gap-x-4 md:gap-x-0 md:gap-y-2 shrink-0 w-full md:w-1/6">
        <Avatar size="lg">
          <AvatarImage src={review.authorProfileImageUrl ?? undefined} alt={review.authorName ?? "User avatar"} />
          <AvatarFallback>{(review.authorName ?? "U").slice(0, 1)}</AvatarFallback>
        </Avatar>

        <div className="truncate flex flex-col gap-1">
          <span className="font-bold">{review.authorName}</span>

          <div className="flex gap-x-4 items-center md:hidden">
            <div className="px-2.5 py-0.5 rounded-full bg-blue-50 flex items-center justify-center space-x-1">
              <Image src={tvlk_favicon} alt="" aria-hidden className="size-4.5" />
              <div className="flex items-end gap-x-0.5">
                <div className="text-primary font-bold">{review.rating}</div>
                <div className="text-sm font-medium">/</div>
                <div className="text-sm font-medium">{MAX_RATING}</div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground"> Đánh giá {timeAgo} </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="hidden md:flex gap-x-4 items-center">
          <div className="px-2.5 py-0.5 rounded-full bg-blue-50 flex items-center justify-center space-x-1">
            <Image src={tvlk_favicon} alt="" aria-hidden className="size-4.5" />
            <div className="flex items-end gap-x-0.5">
              <div className="text-primary font-bold">{review.rating}</div>
              <div className="text-sm font-medium">/</div>
              <div className="text-sm font-medium">{MAX_RATING}</div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground"> Đánh giá {timeAgo} </div>
        </div>

        <p className="text-sm font-medium mt-3 whitespace-pre-wrap">{review.comment}</p>

        <div className="relative overflow-hidden transition-all duration-200 mt-3 h-24 group-data-[open=true]:h-fit" >
          <div className="px-4 py-3 rounded-md bg-gray-50 border text-sm text-gray-800 whitespace-pre-wrap">
            <div className="text-sm font-medium text-gray-600 mb-2">Phản hồi từ chủ khách sạn:</div>
            <div>{review.reply}</div>

            {review.repliedAt && (
              <div className="text-xs text-muted-foreground mt-2 hidden data-[open=true]:block">
                {new Date(review.repliedAt).toLocaleString()}
              </div>
            )}
          </div>

          <div className="group-data-[open=true]:hidden pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-white to-transparent" />
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-x-1 mt-1 cursor-pointer text-sm text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {open ? "Thu gọn" : "Xem thêm"}
            <ChevronDownIcon className="size-5 transition-transform group-data-[open=true]:-rotate-180" />
          </button>
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