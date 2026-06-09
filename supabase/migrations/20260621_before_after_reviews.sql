-- Migration: Before/After images in reviews
-- Fecha: 2026-06-21

ALTER TABLE agendaya_reviews
  ADD COLUMN IF NOT EXISTS before_image_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS after_image_url TEXT DEFAULT NULL;
