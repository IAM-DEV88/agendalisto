-- ============================================================
-- 20260616_admin_dashboard_metrics.sql
-- RPC para métricas profesionales del panel de administración.
-- Devuelve todos los indicadores clave, tops y actividad en
-- una sola llamada.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_role TEXT;
  v_result JSON;
BEGIN
  -- Verificar que quien llama es admin
  SELECT role INTO v_caller_role
  FROM public.agendaya_profiles
  WHERE id = auth.uid();

  IF v_caller_role IS NULL OR v_caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Solo administradores pueden ejecutar esta función';
  END IF;

  WITH
    -- ── Totals ──
    totals AS (
      SELECT
        (SELECT COUNT(*) FROM public.agendaya_profiles)::int AS users,
        (SELECT COUNT(*) FROM public.agendaya_businesses)::int AS businesses,
        (SELECT COUNT(*) FROM public.agendaya_blog_posts)::int AS posts,
        (SELECT COUNT(*) FROM public.agendaya_blog_comments)::int AS comments
    ),
    -- ── Visits ──
    visits AS (
      SELECT
        COALESCE((SELECT COUNT(*) FROM public.agendaya_business_visits), 0)::int AS total,
        COALESCE((SELECT COUNT(*) FROM public.agendaya_business_visits WHERE visited_at::date = CURRENT_DATE), 0)::int AS today,
        COALESCE((SELECT COUNT(*) FROM public.agendaya_business_visits WHERE visited_at >= date_trunc('week', CURRENT_DATE)), 0)::int AS week
    ),
    -- ── Appointments ──
    appointments AS (
      SELECT
        COALESCE((SELECT COUNT(*) FROM public.agendaya_appointments), 0)::int AS total,
        COALESCE((SELECT COUNT(*) FROM public.agendaya_appointments WHERE status = 'pending'), 0)::int AS pending,
        COALESCE((SELECT COUNT(*) FROM public.agendaya_appointments WHERE status = 'confirmed'), 0)::int AS confirmed,
        COALESCE((SELECT COUNT(*) FROM public.agendaya_appointments WHERE status = 'completed'), 0)::int AS completed,
        COALESCE((SELECT COUNT(*) FROM public.agendaya_appointments WHERE status = 'cancelled'), 0)::int AS cancelled
    ),
    -- ── Reviews ──
    reviews AS (
      SELECT
        COALESCE((SELECT COUNT(*) FROM public.agendaya_reviews), 0)::int AS total,
        COALESCE((SELECT COUNT(*) FROM public.agendaya_reviews WHERE status = 'pending'), 0)::int AS pending,
        COALESCE((SELECT COUNT(*) FROM public.agendaya_reviews WHERE status = 'approved'), 0)::int AS approved,
        COALESCE((SELECT COUNT(*) FROM public.agendaya_reviews WHERE status = 'rejected'), 0)::int AS rejected,
        COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM public.agendaya_reviews WHERE status = 'approved'), 0)::float AS avg_rating
    ),
    -- ── Likes ──
    likes AS (
      SELECT
        COALESCE((SELECT SUM(likes_count) FROM public.agendaya_businesses), 0)::int AS businesses,
        COALESCE((SELECT SUM(likes_count) FROM public.agendaya_services), 0)::int AS services,
        COALESCE((SELECT SUM(likes_count) FROM public.agendaya_businesses) + (SELECT SUM(likes_count) FROM public.agendaya_services), 0)::int AS total
    ),
    -- ── Subscriptions ──
    subscriptions AS (
      SELECT COALESCE((SELECT COUNT(*) FROM public.agendaya_subscriptions WHERE status = 'active'), 0)::int AS active
    ),
    -- ── Roles distribution ──
    roles_dist AS (
      SELECT
        COALESCE((SELECT COUNT(*) FROM public.agendaya_profiles WHERE role = 'visitor'), 0)::int AS visitor,
        COALESCE((SELECT COUNT(*) FROM public.agendaya_profiles WHERE role = 'client'), 0)::int AS client,
        COALESCE((SELECT COUNT(*) FROM public.agendaya_profiles WHERE role = 'business_owner'), 0)::int AS business_owner,
        COALESCE((SELECT COUNT(*) FROM public.agendaya_profiles WHERE role = 'moderator'), 0)::int AS moderator,
        COALESCE((SELECT COUNT(*) FROM public.agendaya_profiles WHERE role = 'admin'), 0)::int AS admin
    ),
    -- ── Plans distribution ──
    plans_dist AS (
      SELECT
        COALESCE((SELECT COUNT(*) FROM public.agendaya_profiles WHERE plan = 'starter'), 0)::int AS starter,
        COALESCE((SELECT COUNT(*) FROM public.agendaya_profiles WHERE plan = 'pro'), 0)::int AS pro,
        COALESCE((SELECT COUNT(*) FROM public.agendaya_profiles WHERE plan = 'premium'), 0)::int AS premium
    ),
    -- ── Top 10 businesses by visits ──
    top_businesses AS (
      SELECT json_agg(t) FROM (
        SELECT
          b.id,
          b.name,
          b.logo_url,
          COALESCE(v.visits, 0)::int AS visits,
          b.likes_count::int,
          COALESCE(a.appointments, 0)::int AS appointments
        FROM public.agendaya_businesses b
        LEFT JOIN (
          SELECT business_id, COUNT(*) AS visits
          FROM public.agendaya_business_visits
          GROUP BY business_id
        ) v ON v.business_id = b.id
        LEFT JOIN (
          SELECT business_id, COUNT(*) AS appointments
          FROM public.agendaya_appointments
          GROUP BY business_id
        ) a ON a.business_id = b.id
        ORDER BY COALESCE(v.visits, 0) DESC, b.likes_count DESC
        LIMIT 10
      ) t
    ),
    -- ── Top active users ──
    active_users AS (
      SELECT json_agg(t) FROM (
        SELECT
          p.id,
          p.full_name,
          p.email,
          p.avatar_url,
          COALESCE(a.appointments, 0)::int AS appointments_count,
          COALESCE(r.reviews, 0)::int AS reviews_count
        FROM public.agendaya_profiles p
        LEFT JOIN (
          SELECT user_id, COUNT(*) AS appointments
          FROM public.agendaya_appointments
          GROUP BY user_id
        ) a ON a.user_id = p.id
        LEFT JOIN (
          SELECT user_id, COUNT(*) AS reviews
          FROM public.agendaya_reviews
          WHERE status = 'approved'
          GROUP BY user_id
        ) r ON r.user_id = p.id
        WHERE a.appointments > 0 OR r.reviews > 0
        ORDER BY COALESCE(a.appointments, 0) + COALESCE(r.reviews, 0) DESC
        LIMIT 10
      ) t
    ),
    -- ── Top services by likes ──
    top_services AS (
      SELECT json_agg(t) FROM (
        SELECT
          s.id,
          s.name,
          b.name AS business_name,
          s.likes_count::int
        FROM public.agendaya_services s
        JOIN public.agendaya_businesses b ON b.id = s.business_id
        ORDER BY s.likes_count DESC
        LIMIT 10
      ) t
    ),
    -- ── Recent activity ──
    activity AS (
      SELECT json_agg(t) FROM (
        -- New businesses
        SELECT 'business' AS type, 'Nuevo negocio: ' || b.name AS description, b.created_at AS created_at
        FROM public.agendaya_businesses b
        ORDER BY b.created_at DESC
        LIMIT 5
      ) t
    )
  SELECT json_build_object(
    'totals', (SELECT row_to_json(totals.*) FROM totals),
    'visits', (SELECT row_to_json(visits.*) FROM visits),
    'appointments', (SELECT row_to_json(appointments.*) FROM appointments),
    'reviews', (SELECT row_to_json(reviews.*) FROM reviews),
    'likes', (SELECT row_to_json(likes.*) FROM likes),
    'subscriptions', (SELECT row_to_json(subscriptions.*) FROM subscriptions),
    'roles', (SELECT row_to_json(roles_dist.*) FROM roles_dist),
    'plans', (SELECT row_to_json(plans_dist.*) FROM plans_dist),
    'top_businesses', COALESCE((SELECT * FROM top_businesses), '[]'::json),
    'active_users', COALESCE((SELECT * FROM active_users), '[]'::json),
    'top_services', COALESCE((SELECT * FROM top_services), '[]'::json),
    'activity', COALESCE((SELECT * FROM activity), '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
