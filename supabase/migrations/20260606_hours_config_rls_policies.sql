-- ============================================================
-- 20260606_hours_config_rls_policies.sql
-- Agrega políticas faltantes INSERT/UPDATE/DELETE para
-- agendaya_business_hours y agendaya_business_config.
--
-- coexistence.sql solo creó políticas SELECT para estas tablas,
-- dejando sin acceso a los dueños de negocio para guardar cambios.
-- ============================================================

-- ════════════════════════════════════════════
-- agendaya_business_hours
-- ════════════════════════════════════════════

DO $$ BEGIN
  DROP POLICY IF EXISTS "agendaya_business_hours dueño inserta" ON public.agendaya_business_hours;
  CREATE POLICY "agendaya_business_hours dueño inserta"
    ON public.agendaya_business_hours
    FOR INSERT
    WITH CHECK (
      auth.uid() IN (SELECT owner_id FROM public.agendaya_businesses WHERE id = business_id)
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "agendaya_business_hours dueño actualiza" ON public.agendaya_business_hours;
  CREATE POLICY "agendaya_business_hours dueño actualiza"
    ON public.agendaya_business_hours
    FOR UPDATE
    USING (
      auth.uid() IN (SELECT owner_id FROM public.agendaya_businesses WHERE id = business_id)
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "agendaya_business_hours dueño elimina" ON public.agendaya_business_hours;
  CREATE POLICY "agendaya_business_hours dueño elimina"
    ON public.agendaya_business_hours
    FOR DELETE
    USING (
      auth.uid() IN (SELECT owner_id FROM public.agendaya_businesses WHERE id = business_id)
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ════════════════════════════════════════════
-- agendaya_business_config
-- ════════════════════════════════════════════

DO $$ BEGIN
  DROP POLICY IF EXISTS "agendaya_business_config dueño inserta" ON public.agendaya_business_config;
  CREATE POLICY "agendaya_business_config dueño inserta"
    ON public.agendaya_business_config
    FOR INSERT
    WITH CHECK (
      auth.uid() IN (SELECT owner_id FROM public.agendaya_businesses WHERE id = business_id)
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "agendaya_business_config dueño actualiza" ON public.agendaya_business_config;
  CREATE POLICY "agendaya_business_config dueño actualiza"
    ON public.agendaya_business_config
    FOR UPDATE
    USING (
      auth.uid() IN (SELECT owner_id FROM public.agendaya_businesses WHERE id = business_id)
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
