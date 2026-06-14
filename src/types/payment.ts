export interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  paypal_order_id?: string | null;
  wompi_transaction_id?: string | null;
  payment_provider?: string | null;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  created_at?: string;
  updated_at?: string;
}

export type PaymentProvider = 'paypal' | 'wompi';

export interface PaymentIntent {
  provider: PaymentProvider;
  orderId?: string;
  checkoutUrl?: string;
  transactionId?: string;
  amount: number;
  currency: string;
}

export interface PaymentResult {
  success: boolean;
  provider: PaymentProvider;
  paymentId: string;
  amount: number;
  currency: string;
  error?: string;
}
