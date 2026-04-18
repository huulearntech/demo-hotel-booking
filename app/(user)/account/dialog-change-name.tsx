"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

import { user_updateName } from "@/lib/actions/user-account";
import { useTransition } from "react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { userUpdateNameSchema } from "@/lib/zod_schemas/auth";

export default function ChangeNameDialog({ originalName }: { originalName: string }) {
  const [nameOnUi, setNameOnUi] = useState(originalName);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } }
    = useForm<z.infer<typeof userUpdateNameSchema>>({
      resolver: zodResolver(userUpdateNameSchema),
      defaultValues: { name: originalName },
    });

  const onSubmit = (formValues: z.infer<typeof userUpdateNameSchema>) => {
    const rollbackName = nameOnUi;

    // Optimistically update UI
    setNameOnUi(formValues.name);
    setOpen(false);

    startTransition(async () => {
      const res = await user_updateName(formValues);
      if (res.ok) {
        toast.success("Cập nhật tên thành công");
      } else {
        // rollback on failure
        setNameOnUi(rollbackName);
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <li>
          <div
           className="group flex items-center justify-between w-full rounded-lg border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-accent/5 cursor-pointer"
           role="group"
           >
            <div className="flex flex-col">
              <span className="text-sm font-medium">Họ và tên người dùng</span>
              <span className="text-sm text-muted-foreground">{nameOnUi}</span>
            </div>
            <PencilIcon className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-1" />
          </div>
        </li>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thay đổi tên người dùng</DialogTitle>
          <DialogDescription>Cập nhật tên của bạn ở dưới đây.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register("name", { required: true })}
            placeholder="Nhập tên mới"
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
              Huỷ
            </Button>
            <Button type="submit" variant="default" size="sm" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}