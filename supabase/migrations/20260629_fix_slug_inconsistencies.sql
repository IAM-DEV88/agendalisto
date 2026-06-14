-- ============================================================
-- 20260629_fix_slug_inconsistencies.sql
-- Corrige slugs inconsistentes o nulos en agendaya_businesses.
--
-- Problemas conocidos:
-- 1. Slugs NULL (filas creadas antes del trigger o sin slug)
-- 2. Slugs desactualizados (nombre cambió pero slug no se actualizó
--    porque el trigger usa UPDATE OF name y algunos updates lo
--    evadieron)
-- 3. Slugs duplicados (mismo nombre normalizado)
-- 4. Sin constraint NOT NULL
-- ============================================================

-- ════════════════════════════════════════════
-- 1. Regenerar slugs para TODAS las filas
--    usando la misma lógica del trigger
--    (LOWER + REGEXP_REPLACE + TRIM)
-- ════════════════════════════════════════════

-- Primero desactivamos temporalmente el trigger para poder
-- regenerar sin que intervenga
ALTER TABLE public.agendaya_businesses DISABLE TRIGGER trg_agendaya_business_slug;

-- Actualizamos todas las filas con el slug generado desde name
-- (incluye las que ya tienen slug, para corregir discrepancias)
UPDATE public.agendaya_businesses
SET slug = LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9áéíóúüñ\-]+', '-', 'g'))
WHERE slug IS DISTINCT FROM LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9áéíóúüñ\-]+', '-', 'g'))
   OR slug IS NULL;

-- ════════════════════════════════════════════
-- 2. Resolver slugs duplicados
--    Agrega un sufijo numérico a los repetidos
-- ════════════════════════════════════════════

DO $$
DECLARE
  dup RECORD;
  counter INT;
  new_slug TEXT;
BEGIN
  FOR dup IN
    SELECT id, name, slug
    FROM public.agendaya_businesses
    WHERE slug IN (
      SELECT slug
      FROM public.agendaya_businesses
      WHERE slug IS NOT NULL
      GROUP BY slug
      HAVING COUNT(*) > 1
    )
    ORDER BY slug, created_at
  LOOP
    -- El primero en orden cronológico se queda con el slug original
    -- Los siguientes reciben un sufijo: slug-1, slug-2, etc.
    counter := 0;
    LOOP
      IF counter = 0 THEN
        new_slug := dup.slug;
      ELSE
        new_slug := dup.slug || '-' || counter;
      END IF;

      -- Verificar si este slug ya está ocupado por OTRA fila
      IF NOT EXISTS (
        SELECT 1 FROM public.agendaya_businesses
        WHERE slug = new_slug AND id <> dup.id
      ) THEN
        EXIT;
      END IF;

      counter := counter + 1;
    END LOOP;

    IF counter > 0 THEN
      UPDATE public.agendaya_businesses
      SET slug = new_slug
      WHERE id = dup.id;
    END IF;
  END LOOP;
END;
$$;

-- ════════════════════════════════════════════
-- 3. Agregar constraint NOT NULL
--    (seguro porque ya no hay nulls después del paso 1)
-- ════════════════════════════════════════════

ALTER TABLE public.agendaya_businesses
  ALTER COLUMN slug SET NOT NULL;

-- ════════════════════════════════════════════
-- 4. Reactivar el trigger
-- ════════════════════════════════════════════

ALTER TABLE public.agendaya_businesses ENABLE TRIGGER trg_agendaya_business_slug;

-- Recargar schema cache de PostgREST
NOTIFY pgrst, 'reload schema';
