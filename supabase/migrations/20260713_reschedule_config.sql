-- agendaya_services: add rescheduling configuration columns
-- allow_client_reschedule: whether clients can reschedule via the UI
-- min_reschedule_hours: minimum hours before appointment to allow rescheduling

ALTER TABLE public.agendaya_services
  ADD COLUMN IF NOT EXISTS allow_client_reschedule BOOLEAN DEFAULT true;

ALTER TABLE public.agendaya_services
  ADD COLUMN IF NOT EXISTS min_reschedule_hours INTEGER DEFAULT 48;

-- Free-text policy messages written by the business
ALTER TABLE public.agendaya_services
  ADD COLUMN IF NOT EXISTS cancellation_policy_text TEXT;

ALTER TABLE public.agendaya_services
  ADD COLUMN IF NOT EXISTS reschedule_policy_text TEXT;
