-- Migration: Add payment_methods column to agendaya_business_config
-- Created: 2026-07-31
-- Description: Adds JSONB column for storing payment method configurations (PayPal, Wompi, custom)

ALTER TABLE public.agendaya_business_config
  ADD COLUMN IF NOT EXISTS payment_methods JSONB NOT NULL DEFAULT '{}'::jsonb;
