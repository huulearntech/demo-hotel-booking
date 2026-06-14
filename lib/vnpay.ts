import "dotenv/config";
import { VNPay, HashAlgorithm } from "vnpay";
import moment from "moment";
import crypto from "crypto";
import qs from "qs";

// Export configuration for server-side use only
export const vnpayConfig = {
  tmnCode: process.env.VNPAY_TMN_CODE!,
  secureSecret: process.env.VNPAY_SECURE_SECRET!,
  vnpayHost: process.env.VNPAY_HOST!,
  testMode: process.env.VNPAY_TEST_MODE! === "true",
  returnUrl: process.env.VNPAY_RETURN_URL!,
};

// Initialize VNPay instance
export const vnpay = new VNPay({
  tmnCode: vnpayConfig.tmnCode,
  secureSecret: vnpayConfig.secureSecret,
  vnpayHost: vnpayConfig.vnpayHost,
  testMode: vnpayConfig.testMode,
  hashAlgorithm: HashAlgorithm.SHA256,
  enableLog: true,
});


export function createVnpayUrl(
  totalAmount: number,
  orderId: string,
  clientIpAddr: string,
  orderInfo: string
) {
  const createDate = moment().format('YYYYMMDDHHmmss');
  const amount = Math.round(totalAmount);

  const vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: vnpayConfig.tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: vnpayConfig.returnUrl,
    vnp_IpAddr: clientIpAddr,
    vnp_CreateDate: createDate,
  };

  // 4. Ký và tạo link
  const sortedParams = sortObject(vnp_Params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac('sha512', vnpayConfig.secureSecret);
  const signed = hmac.update(signData).digest('hex');

  sortedParams['vnp_SecureHash'] = signed;

  const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  // Tạo URL
  const paymentUrl = `${vnpUrl}?${qs.stringify(sortedParams, { encode: false })}`;
  return paymentUrl;
};

export function verifyReturnUrl(params: Record<string, string | string[]>): {
  isVerified: boolean;
  isSuccess: boolean;
  vnp_TxnRef: string;
  vnp_PayDate: string;
  vnp_Amount: number;
  vnp_OrderInfo: string;
  vnp_TransactionNo: string;
  vnp_BankCode: string;
  message: string;
} {
  const secureHash = params['vnp_SecureHash'] as string;
  const hashType = params['vnp_SecureHashType'] as string;

  // Loại bỏ các tham số không cần thiết
  const filteredParams: Record<string, string> = {};
  for (const key in params) {
    if (key.startsWith('vnp_') && key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
      filteredParams[key] = params[key] as string;
    }
  }

  const sortedParams = sortObject(filteredParams);
  const signData = qs.stringify(sortedParams, { encode: false });

  const hmac = crypto.createHmac(hashType === 'SHA256' ? 'sha256' : 'sha512', vnpayConfig.secureSecret);
  const signed = hmac.update(signData).digest('hex');

  const isVerified = signed === secureHash;
  const isSuccess = params['vnp_ResponseCode'] === '00';
  const vnp_PayDate = params['vnp_PayDate'] as string;
  const vnp_TxnRef = params['vnp_TxnRef'] as string;
  // VNPAY gửi về số tiền đã nhân 100, nên cần chia lại cho đúng
  const vnp_Amount = /^\d+$/.test(params['vnp_Amount'] as string)
    ? parseInt(params['vnp_Amount'] as string, 10) / 100
    : NaN;
  const vnp_OrderInfo = params['vnp_OrderInfo'] as string;
  const vnp_TransactionNo = params['vnp_TransactionNo'] as string;
  const vnp_BankCode = params['vnp_BankCode'] as string;
  const message = isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại";

  return {
    isVerified,
    isSuccess,
    vnp_PayDate,
    vnp_TxnRef,
    vnp_Amount,
    vnp_OrderInfo,
    vnp_TransactionNo,
    vnp_BankCode,
    message,
  };
}

export function verifyIpn(params: Record<string, string | string[]>): {
  isVerified: boolean;
  isSuccess: boolean;
  vnp_TxnRef: string;
  vnp_Amount: number;
} {
  const secureHash = params['vnp_SecureHash'] as string;
  const hashType = params['vnp_SecureHashType'] as string;

  // Loại bỏ các tham số không cần thiết
  const filteredParams: Record<string, string> = {};
  for (const key in params) {
    if (key.startsWith('vnp_') && key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
      filteredParams[key] = params[key] as string;
    }
  }

  const sortedParams = sortObject(filteredParams);
  const signData = qs.stringify(sortedParams, { encode: false });

  const hmac = crypto.createHmac(hashType === 'SHA256' ? 'sha256' : 'sha512', vnpayConfig.secureSecret);
  const signed = hmac.update(signData).digest('hex');

  const isVerified = signed === secureHash;
  const isSuccess = params['vnp_ResponseCode'] === '00';
  const vnp_TxnRef = params['vnp_TxnRef'] as string;
  // VNPAY gửi về số tiền đã nhân 100, nên cần chia lại cho đúng
  const vnp_Amount = /^\d+$/.test(params['vnp_Amount'] as string)
    ? parseInt(params['vnp_Amount'] as string, 10) / 100
    : NaN;

  return {
    isVerified,
    isSuccess,
    vnp_TxnRef,
    vnp_Amount,
  };
}

// Helper function to sort object keys and encode values
const sortObject = <T extends Record<string, string | number>>(obj: T): Record<string, string> => {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();

  keys.forEach((key) => {
    const value = obj[key];
    sorted[encodeURIComponent(key)] = encodeURIComponent(String(value)).replace(/%20/g, "+");
  });

  return sorted;
};
