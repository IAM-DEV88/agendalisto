export interface Subscription {
  id: string;
  user_id: string;
  plan: 'pro' | 'premium';
  paypal_order_id?: string;
  wompi_transaction_id?: string;
  payment_provider?: 'paypal' | 'wompi';
  status: 'active' | 'cancelled' | 'expired';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}
