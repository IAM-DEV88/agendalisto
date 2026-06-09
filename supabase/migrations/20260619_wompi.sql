-- Migration: Wompi payment support
-- Fecha: 2026-06-19

ALTER TABLE agendaya_subscriptions
  ADD COLUMN IF NOT EXISTS wompi_transaction_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'paypal';
