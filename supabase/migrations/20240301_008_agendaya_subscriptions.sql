-- ============================================================
-- 008_agendaya_subscriptions.sql
-- Tabla de suscripciones para pagos vía PayPal
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agendaya_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'premium')),
  paypal_order_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agendaya_subscriptions_user_id ON public.agendaya_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_agendaya_subscriptions_paypal_order_id ON public.agendaya_subscriptions(paypal_order_id);

-- RLS: usuario solo ve su propia suscripción
ALTER TABLE public.agendaya_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY agendaya_subscriptions_select_own ON public.agendaya_subscriptions
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY agendaya_subscriptions_insert_system ON public.agendaya_subscriptions
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY agendaya_subscriptions_update_system ON public.agendaya_subscriptions
    FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
