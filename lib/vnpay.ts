import "dotenv/config";
import { VNPay, HashAlgorithm } from "vnpay";

// Export configuration for server-side use only
export const vnpayConfig = {
  tmnCode: process.env.VNPAY_TMN_CODE!,
  secureSecret: process.env.VNPAY_SECURE_SECRET!,
  vnpayHost: process.env.VNPAY_HOST!,
  testMode: process.env.VNPAY_TEST_MODE! === "true",
  returnUrl: process.env.VNPAY_RETURN_URL,
};

// Initialize VNPay instance
export const vnpay = new VNPay({
  tmnCode: vnpayConfig.tmnCode,
  secureSecret: vnpayConfig.secureSecret,
  vnpayHost: vnpayConfig.vnpayHost,
  testMode: vnpayConfig.testMode,
  hashAlgorithm: HashAlgorithm.SHA512,
  enableLog: true,
});