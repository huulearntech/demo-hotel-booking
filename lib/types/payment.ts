export interface BankOption {
  bank_code: string;
  bank_name: string;
}

export interface PaymentResult {
  success: boolean;
  paymentUrl?: string;
  orderId?: string;
  error?: string;
}