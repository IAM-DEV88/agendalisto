-- ============================================================
-- 20260630_security_rls_fixes.sql
-- Corrige issues críticos de seguridad:
--   1. RLS ausente en 4 tablas (agendaya_business_visits,
--      agendaya_loyalty, agendaya_gift_codes,
--      agendaya_pending_payments)
--   2. Políticas abiertas en agendaya_subscriptions
--      (INSERT/UPDATE USING true)
--   3. SECURITY DEFINER functions sin SET search_path = ''
--      (update_blog_post_likes_count,
--       update_blog_comment_likes_count)
--   4. handle_new_user() sin BEGIN/EXCEPTION por app
--   5. sanitize_signup_role() sin soporte para business_owner
-- ============================================================

BEGIN;

-- ════════════════════════════════════════════════════════════
-- 1. RLS: agendaya_business_visits
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.agendaya_business_visits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS agendaya_business_visits_select_owner ON public.agendaya_business_visits;
  CREATE POLICY agendaya_business_visits_select_owner ON public.agendaya_business_visits
    FOR SELECT USING (
      auth.uid() IN (
        SELECT owner_id FROM public.agendaya_businesses WHERE id = business_id
      )
    );
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS agendaya_business_visits_insert_self ON public.agendaya_business_visits;
  CREATE POLICY agendaya_business_visits_insert_self ON public.agendaya_business_visits
    FOR INSERT WITH CHECK (
      auth.uid() = user_id OR user_id IS NULL
    );
END $$;

-- ════════════════════════════════════════════════════════════
-- 2. RLS: agendaya_loyalty
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.agendaya_loyalty ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS agendaya_loyalty_select_own ON public.agendaya_loyalty;
  CREATE POLICY agendaya_loyalty_select_own ON public.agendaya_loyalty
    FOR SELECT USING (auth.uid() = user_id);
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS agendaya_loyalty_select_business_owner ON public.agendaya_loyalty;
  CREATE POLICY agendaya_loyalty_select_business_owner ON public.agendaya_loyalty
    FOR SELECT USING (
      auth.uid() IN (
        SELECT owner_id FROM public.agendaya_businesses WHERE id = business_id
      )
    );
END $$;

-- ════════════════════════════════════════════════════════════
-- 3. RLS: agendaya_gift_codes
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.agendaya_gift_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS agendaya_gift_codes_select_sender ON public.agendaya_gift_codes;
  CREATE POLICY agendaya_gift_codes_select_sender ON public.agendaya_gift_codes
    FOR SELECT USING (auth.uid() = sender_user_id);
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS agendaya_gift_codes_select_business ON public.agendaya_gift_codes;
  CREATE POLICY agendaya_gift_codes_select_business ON public.agendaya_gift_codes
    FOR SELECT USING (
      auth.uid() IN (
        SELECT owner_id FROM public.agendaya_businesses WHERE id = business_id
      )
    );
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS agendaya_gift_codes_insert_own ON public.agendaya_gift_codes;
  CREATE POLICY agendaya_gift_codes_insert_own ON public.agendaya_gift_codes
    FOR INSERT WITH CHECK (auth.uid() = sender_user_id);
END $$;

-- ════════════════════════════════════════════════════════════
-- 4. RLS: agendaya_pending_payments
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.agendaya_pending_payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS agendaya_pending_payments_insert_self ON public.agendaya_pending_payments;
  CREATE POLICY agendaya_pending_payments_insert_self ON public.agendaya_pending_payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS agendaya_pending_payments_select_self ON public.agendaya_pending_payments;
  CREATE POLICY agendaya_pending_payments_select_self ON public.agendaya_pending_payments
    FOR SELECT USING (auth.role() = 'authenticated');
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS agendaya_pending_payments_update_service ON public.agendaya_pending_payments;
  CREATE POLICY agendaya_pending_payments_update_service ON public.agendaya_pending_payments
    FOR UPDATE USING (auth.role() = 'service_role');
END $$;

-- ════════════════════════════════════════════════════════════
-- 5. Fix: agendaya_subscriptions — restringir INSERT/UPDATE
--    Solo service_role puede insertar/modificar suscripciones
-- ════════════════════════════════════════════════════════════
DO $$ BEGIN
  DROP POLICY IF EXISTS agendaya_subscriptions_insert_system ON public.agendaya_subscriptions;
  CREATE POLICY agendaya_subscriptions_insert_service ON public.agendaya_subscriptions
    FOR INSERT WITH CHECK (auth.role() = 'service_role');
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS agendaya_subscriptions_update_system ON public.agendaya_subscriptions;
  CREATE POLICY agendaya_subscriptions_update_service ON public.agendaya_subscriptions
    FOR UPDATE USING (auth.role() = 'service_role');
END $$;

-- ════════════════════════════════════════════════════════════
-- 6. Fix: SECURITY DEFINER functions sin SET search_path = ''
--    update_blog_post_likes_count y update_blog_comment_likes_count
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_blog_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE public.agendaya_blog_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE public.agendaya_blog_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_blog_comment_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.comment_id IS NOT NULL THEN
      UPDATE public.agendaya_blog_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.comment_id IS NOT NULL THEN
      UPDATE public.agendaya_blog_comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- 7. Fix: sanitize_signup_role() con soporte business_owner
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.sanitize_signup_role(raw_role text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF raw_role IN ('visitor', 'client', 'business_owner') THEN
    RETURN raw_role;
  END IF;
  RETURN 'visitor';
END;
$$;

-- ════════════════════════════════════════════════════════════
-- 8. Fix: handle_new_user() con BEGIN/EXCEPTION por app
--    Cada app externa va envuelta en su propio bloque
--    para tolerancia a fallos (una app caída no bloquea
--    el registro global)
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  safe_role text;
  v_display_name text;
BEGIN
  safe_role := public.sanitize_signup_role(
    COALESCE(NEW.raw_user_meta_data->>'role', 'visitor')
  );
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  -- EncuentrosVIP
  BEGIN
    INSERT INTO public.encuentrosvip_profiles (user_id, display_name, city, plan, role)
    VALUES (NEW.id, v_display_name, '', 'visitor', safe_role)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: encuentrosvip_profiles insert failed for user %: %', NEW.id, SQLERRM;
  END;

  BEGIN
    INSERT INTO public.user_apps (user_id, app_slug, role, status)
    VALUES (NEW.id, 'encuentrosvip', safe_role, 'active')
    ON CONFLICT (user_id, app_slug) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: user_apps (encuentrosvip) insert failed for user %: %', NEW.id, SQLERRM;
  END;

  -- AgendaYa
  BEGIN
    INSERT INTO public.agendaya_profiles (id, full_name, email, created_at, updated_at)
    VALUES (NEW.id, v_display_name, NEW.email, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: agendaya_profiles insert failed for user %: %', NEW.id, SQLERRM;
  END;

  BEGIN
    INSERT INTO public.user_apps (user_id, app_slug, role, status)
    VALUES (NEW.id, 'agendaya', safe_role, 'active')
    ON CONFLICT (user_id, app_slug) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: user_apps (agendaya) insert failed for user %: %', NEW.id, SQLERRM;
  END;

  -- Guild Portal
  BEGIN
    INSERT INTO public.user_apps (user_id, app_slug, role, status)
    VALUES (NEW.id, 'guild_portal', 'visitor', 'active')
    ON CONFLICT (user_id, app_slug) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: user_apps (guild_portal) insert failed for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

COMMIT;
