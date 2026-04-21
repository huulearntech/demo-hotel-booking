import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { PATHS } from "@/lib/constants";

export default async function Page({ searchParams }: { searchParams: Promise<{ id: string; message: string }> }) {
  const { id, message } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="max-w-lg w-full shadow-lg">
        <CardHeader className="flex flex-col items-center gap-2 pt-8">
          <div
            aria-hidden
            className="rounded-full bg-green-50 p-6 inline-flex items-center justify-center"
          >
            <CheckCircle className="text-green-600 w-20 h-20" />
          </div>
          <CardTitle className="text-2xl">Thanh toán thành công</CardTitle>
          <CardDescription className="text-sm text-muted-foreground text-center max-w-prose">
            {message}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 pb-8 px-6">
          <dl className="grid grid-cols-1 gap-y-4">
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Mã số giao dịch</dt>
              <dd className="font-medium text-sm wrap-break-word">{id}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Trạng thái</dt>
              <dd className="font-medium text-sm text-green-600">Thành công</dd>
            </div>
          </dl>

          <div className="mt-6 flex gap-3">
            <Link href={PATHS.home} className="w-full">
              <Button variant="outline" className="w-full">
                Trở về trang chủ
              </Button>
            </Link>

            <Link href={PATHS.accountHistory} className="w-full">
              <Button className="w-full">
                Xem đơn đặt phòng
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}