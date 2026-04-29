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

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { fetchUnrepliedReviews, fetchRepliedReviews, hotelowner_replyToReview } from "./tmp-actions";
import { RepliedReviewType, UnrepliedReviewType } from "./tmp-actions";
import Image from "next/image";
import { tvlk_favicon } from "@/public/logos";
import { MAX_REVIEW_POINTS } from "@/lib/constants";


// TODO: Clean up
export default function ReviewsClient() {
  const qc = useQueryClient();

  // Queries with initialData from the server component
  const unrepliedQuery = useQuery<UnrepliedReviewType[]>({
    queryKey: ["reviews", "unreplied"],
    queryFn: () => fetchUnrepliedReviews(),
    initialData: [],
    refetchOnWindowFocus: false,
  });

  const repliedQuery = useQuery<RepliedReviewType[]>({
    queryKey: ["reviews", "replied"],
    queryFn: () => fetchRepliedReviews(),
    initialData: [],
    refetchOnWindowFocus: false,
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
    <Tabs defaultValue="unreplied" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="unreplied">Chưa phản hồi</TabsTrigger>
        <TabsTrigger value="replied">Đã phản hồi</TabsTrigger>
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

  const timeAgo = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });

  return (
    <div className="group data-[open=true]:h-fit px-6 py-4 rounded-xl border bg-card flex flex-col md:flex-row gap-x-12 gap-y-2 md:gap-y-0">
      <div className="flex md:flex-col items-center gap-x-4 md:gap-x-0 md:gap-y-2 shrink-0 w-full md:w-1/6">
        <Avatar size="lg">
          <AvatarImage src={review.booking?.user?.profileImageUrl ?? undefined} alt={review.booking?.user?.name ?? "User avatar"} />
          <AvatarFallback>{(review.booking?.user?.name ?? "U").slice(0, 1)}</AvatarFallback>
        </Avatar>

        <div className="truncate flex flex-col gap-1">
          <span className="font-bold">{review.booking?.user?.name ?? "Guest"}</span>

          <div className="flex gap-x-4 items-center md:hidden">
            <div className="px-2.5 py-0.5 rounded-full bg-blue-50 flex items-center justify-center space-x-1">
              <Image src={tvlk_favicon} alt="" aria-hidden className="size-4.5" />
              <div className="flex items-end gap-x-0.5">
                <div className="text-primary font-bold">{review.rating}</div>
                <div className="text-sm font-medium">/</div>
                <div className="text-sm font-medium">{MAX_REVIEW_POINTS}</div>
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
              <div className="text-sm font-medium">{MAX_REVIEW_POINTS}</div>
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
                if (!text.trim()) return;
                onReply(text.trim());
                setText("");
              }}
              disabled={replying || text.trim().length === 0}
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

function RepliedItem({ review }: { review: RepliedReviewType }) {
  const [open, setOpen] = useState(false);
  const timeAgo = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });

  return (
    <div className="group data-[open=false]:h-fit px-6 py-4 rounded-xl border bg-card flex flex-col md:flex-row gap-x-12 gap-y-2 md:gap-y-0" data-open={open}>
      <div className="flex md:flex-col items-center gap-x-4 md:gap-x-0 md:gap-y-2 shrink-0 w-full md:w-1/6">
        <Avatar size="lg">
          <AvatarImage src={review.booking?.user?.profileImageUrl ?? undefined} alt={review.booking?.user?.name ?? "User avatar"} />
          <AvatarFallback>{(review.booking?.user?.name ?? "U").slice(0, 1)}</AvatarFallback>
        </Avatar>

        <div className="truncate flex flex-col gap-1">
          <span className="font-bold">{review.booking?.user?.name ?? "Guest"}</span>

          <div className="flex gap-x-4 items-center md:hidden">
            <div className="px-2.5 py-0.5 rounded-full bg-blue-50 flex items-center justify-center space-x-1">
              <Image src={tvlk_favicon} alt="" aria-hidden className="size-4.5" />
              <div className="flex items-end gap-x-0.5">
                <div className="text-primary font-bold">{review.rating}</div>
                <div className="text-sm font-medium">/</div>
                <div className="text-sm font-medium">{MAX_REVIEW_POINTS}</div>
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
              <div className="text-sm font-medium">{MAX_REVIEW_POINTS}</div>
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