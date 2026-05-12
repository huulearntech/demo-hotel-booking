// Maybe useful for update

// room form not room type form.
// so how about room type form?

"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import { schema_Room, type RoomFormInput, RoomFormOutput } from "@/lib/zod_schemas/create-room";


export default function RoomForm({ onSubmit }: { onSubmit: (data: RoomFormOutput) => Promise<void> }) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoomFormInput, unknown, RoomFormOutput>({
    resolver: zodResolver(schema_Room),
  });

  // fuck javashit.
  async function onSubmitLocal(data: RoomFormOutput) {
    startTransition(async () => {
      const res = await onSubmit(data);
      // if (res instanceof Error) {
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add new room</CardTitle>
        <CardDescription>Fill in the details of the new room.</CardDescription>
      </CardHeader>
      <CardContent>

        <form onSubmit={handleSubmit(onSubmitLocal)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>
          {/** There should be a select component here for type id under the hood (but render as type) */}
          <div>
            <Label htmlFor="type">Type</Label>
            <Input id="type" {...register("typeId")} />
            {errors.typeId && <p className="text-xs text-destructive mt-1">{errors.typeId.message}</p>}
          </div>

          <p className="text-sm text-destructive"> {errors.root?.message} </p>

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter>

      </CardFooter>
    </Card>
  );
}