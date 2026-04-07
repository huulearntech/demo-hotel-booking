// Maybe useful for update

"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";

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

// FIXME: Fragmented definitions.
import { schema_Room, type RoomFormInput, RoomFormOutput } from "@/lib/zod_schemas/create-room";


export default function RoomForm({ onSubmit }: { onSubmit: (data: RoomFormOutput) => Promise<void> }) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RoomFormInput, unknown, RoomFormOutput>({
    resolver: zodResolver(RoomFormSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "imageUrls",
  });

  // fuck javashit.
  async function onSubmitLocal(data: RoomFormOutput) {
    startTransition(async () => {
      const res = await onSubmit(data); // await network
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
          <div>
            <Label htmlFor="type">Type</Label>
            <Input id="type" {...register("type")} />
            {errors.type && <p className="text-xs text-destructive mt-1">{errors.type.message}</p>}
          </div>

          <div>
            <Label htmlFor="price">Price per night (USD)</Label>
            <Input id="price" type="number" step="0.01" {...register("price", { valueAsNumber: true })} />
            {errors.price && <p className="text-xs text-destructive mt-1">{errors.price.message}</p>}
          </div>

          <div>
            <Label htmlFor="adultCapacity">Adult capacity</Label>
            <Input id="adultCapacity" type="number" {...register("adultCapacity")} />
            {errors.adultCapacity && <p className="text-xs text-destructive mt-1">{errors.adultCapacity.message}</p>}
          </div>

          <div>
            <Label htmlFor="childrenCapacity">Children capacity</Label>
            <Input id="childrenCapacity" type="number" {...register("childrenCapacity")} />
            {errors.childrenCapacity && <p className="text-xs text-destructive mt-1">{errors.childrenCapacity.message}</p>}
          </div>

          <div>
            <Label htmlFor="areaM2">Area (m2)</Label>
            <Input id="areaM2" type="number" {...register("areaM2")} />
            {errors.areaM2 && <p className="text-xs text-destructive mt-1">{errors.areaM2.message}</p>}
          </div>

          <div>
            <Label htmlFor="bedType">Bed Type</Label>
            <Input id="bedType" {...register("bedType")} />
            {errors.bedType && <p className="text-xs text-destructive mt-1">{errors.bedType.message}</p>}
          </div>


          <div>
            <Label htmlFor="imageUrls">Image URLs</Label>

            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2 mb-2">
                <Input
                  placeholder="https://placehold.co/400x300.png?text=Room+Image"
                  {...register(`imageUrls.${index}.url` as const)}
                />
                <Button type="button" variant="ghost" onClick={() => remove(index)}>
                  Remove
                </Button>
              </div>
            ))}

            <Button type="button" onClick={() => append({ url: "" })}>
              Add image URL
            </Button>

            {errors.imageUrls && <p className="text-xs text-destructive mt-1">{errors.imageUrls.message ?? "Invalid image URLs"}</p>}
          </div>

          {/* {error && <div className="text-sm text-destructive">{error}</div>} */}

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