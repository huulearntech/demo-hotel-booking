import { Suspense } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "lucide-react";
import { vnpay } from "@/lib/vnpay";
import { type VerifyReturnUrl, parseDate } from "vnpay";
import { verifyReturnUrl } from "@/lib/vnpay";
import Link from "next/link";
import { PrintButton } from "./button-print";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/lib/constants";

// Mark this route as dynamic since it uses searchParams
export const dynamic = "force-dynamic";

interface PaymentReturnProps {
  searchParams: Promise<Record<string, string | string[]>>;
}

function PaymentResultSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function PaymentResult({ searchParams }: PaymentReturnProps) {
  try {
    const params = await searchParams;

    // Verify the return URL
    const verify = verifyReturnUrl(params);

    const isSuccess = verify.isVerified && verify.isSuccess;
    const Icon = isSuccess ? CheckCircleIcon : XCircleIcon;
    const iconColor = isSuccess ? "text-green-500" : "text-red-500";
    const bgColor = isSuccess ? "bg-green-50" : "bg-red-50";
    const borderColor = isSuccess ? "border-green-200" : "border-red-200";

    const paymentDate = verify.vnp_PayDate
      ? parseDate(verify.vnp_PayDate).toLocaleString("vi-VN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "N/A";

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
          <div className={`${bgColor} ${borderColor} border-b px-6 py-4`}>
            <div className="flex items-center">
              <Icon className={`w-8 h-8 ${iconColor} mr-3`} />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại"}
                </h1>
                <p className="text-sm text-gray-600">
                  {isSuccess
                    ? "Giao dịch của bạn đã được xử lý thành công"
                    : "Giao dịch không thể hoàn thành"}
                </p>
              </div>
            </div>
          </div>


          <div className="px-6 py-4 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Mã đơn hàng:
                </span>
                <span className="text-sm text-gray-900 font-mono max-w-62">
                  {verify.vnp_TxnRef}
                </span>
              </div>

              {verify.vnp_Amount && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Số tiền:
                  </span>
                  <span className="text-sm text-gray-900 font-semibold">
                    {Number(verify.vnp_Amount).toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
              )}

              {verify.vnp_OrderInfo && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Nội dung:
                  </span>
                  <span className="text-sm text-gray-900 text-right max-w-62">
                    {verify.vnp_OrderInfo}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Thời gian:
                </span>
                <span className="text-sm text-gray-900">{paymentDate}</span>
              </div>

              {verify.vnp_TransactionNo && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Mã giao dịch:
                  </span>
                  <span className="text-sm text-gray-900 font-mono">
                    {verify.vnp_TransactionNo}
                  </span>
                </div>
              )}

              {verify.vnp_BankCode && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Ngân hàng:
                  </span>
                  <span className="text-sm text-gray-900">
                    {verify.vnp_BankCode}
                  </span>
                </div>
              )}

              {verify.message && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Message:
                  </span>

                  <span className="text-sm text-gray-900 text-right max-w-62">
                    {verify.message}
                  </span>
                </div>
              )}
            </div>

            {!verify.isVerified && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-center">
                  <ClockIcon className="w-5 h-5 text-yellow-500 mr-2" />
                  <p className="text-sm text-yellow-800">
                    Không thể xác minh tính toàn vẹn dữ liệu. Vui lòng liên hệ
                    hỗ trợ.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t">
            <div className="flex space-x-3">
              <Button asChild className="flex-1">
                <Link href={PATHS.home}> Quay về trang chủ </Link>
              </Button>
              {isSuccess && <PrintButton />}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Lỗi xử lý
            </h1>
            <p className="text-gray-600 mb-6">
              Không thể xử lý kết quả thanh toán. Vui lòng thử lại hoặc liên hệ
              hỗ trợ.
            </p>
            <Button asChild className="inline-block">
              <Link href={PATHS.home}> Quay về trang chủ </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default function PaymentReturnPage(props: PaymentReturnProps) {
  return (
    <Suspense fallback={<PaymentResultSkeleton />}>
      <PaymentResult {...props} />
    </Suspense>
  );
}