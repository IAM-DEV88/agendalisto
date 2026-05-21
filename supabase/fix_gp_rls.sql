-- =====================================================
-- FIX: RLS policies for Guild-Portal renamed tables
-- =====================================================
-- Ejecutar DESPUÉS de coexistence.sql para restaurar
-- políticas de acceso público en tablas guild_portal_*
-- =====================================================

-- guild_portal_game_sessions: restaurar policy pública
ALTER TABLE public.guild_portal_game_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for game sessions" ON public.guild_portal_game_sessions;
CREATE POLICY "Public access for game sessions" 
  ON public.guild_portal_game_sessions FOR ALL 
  USING (true) WITH CHECK (true);

-- guild_portal_config: habilitar RLS + policy pública
ALTER TABLE public.guild_portal_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for config" ON public.guild_portal_config;
CREATE POLICY "Public access for config" 
  ON public.guild_portal_config FOR ALL 
  USING (true) WITH CHECK (true);

-- guild_portal_game_rewards_log: habilitar RLS + policy pública
ALTER TABLE public.guild_portal_game_rewards_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for game_rewards_log" ON public.guild_portal_game_rewards_log;
CREATE POLICY "Public access for game_rewards_log" 
  ON public.guild_portal_game_rewards_log FOR ALL 
  USING (true) WITH CHECK (true);

-- guild_portal_raid_registrations: habilitar RLS + policy pública
ALTER TABLE public.guild_portal_raid_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for raid_registrations" ON public.guild_portal_raid_registrations;
CREATE POLICY "Public access for raid_registrations" 
  ON public.guild_portal_raid_registrations FOR ALL 
  USING (true) WITH CHECK (true);

-- guild_portal_roster_players: habilitar RLS + policy pública
ALTER TABLE public.guild_portal_roster_players ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for roster_players" ON public.guild_portal_roster_players;
CREATE POLICY "Public access for roster_players" 
  ON public.guild_portal_roster_players FOR ALL 
  USING (true) WITH CHECK (true);

-- guild_portal_guides: habilitar RLS + policy pública
ALTER TABLE public.guild_portal_guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for guides" ON public.guild_portal_guides;
CREATE POLICY "Public access for guides" 
  ON public.guild_portal_guides FOR ALL 
  USING (true) WITH CHECK (true);

-- guild_portal_guide_votes: habilitar RLS + policy pública
ALTER TABLE public.guild_portal_guide_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for guide_votes" ON public.guild_portal_guide_votes;
CREATE POLICY "Public access for guide_votes" 
  ON public.guild_portal_guide_votes FOR ALL 
  USING (true) WITH CHECK (true);

-- guild_portal_guide_comments: habilitar RLS + policy pública
ALTER TABLE public.guild_portal_guide_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for guide_comments" ON public.guild_portal_guide_comments;
CREATE POLICY "Public access for guide_comments" 
  ON public.guild_portal_guide_comments FOR ALL 
  USING (true) WITH CHECK (true);

-- guild_portal_schedule_votes: habilitar RLS + policy pública
ALTER TABLE public.guild_portal_schedule_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for schedule_votes" ON public.guild_portal_schedule_votes;
CREATE POLICY "Public access for schedule_votes" 
  ON public.guild_portal_schedule_votes FOR ALL 
  USING (true) WITH CHECK (true);

-- guild_portal_section_comments: habilitar RLS + policy pública
ALTER TABLE public.guild_portal_section_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for section_comments" ON public.guild_portal_section_comments;
CREATE POLICY "Public access for section_comments" 
  ON public.guild_portal_section_comments FOR ALL 
  USING (true) WITH CHECK (true);

-- guild_portal_redemption_codes: habilitar RLS + policy pública
ALTER TABLE public.guild_portal_redemption_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for redemption_codes" ON public.guild_portal_redemption_codes;
CREATE POLICY "Public access for redemption_codes" 
  ON public.guild_portal_redemption_codes FOR ALL 
  USING (true) WITH CHECK (true);

-- guild_portal_blog_posts: habilitar RLS + policy pública
ALTER TABLE public.guild_portal_blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for blog_posts" ON public.guild_portal_blog_posts;
CREATE POLICY "Public access for blog_posts" 
  ON public.guild_portal_blog_posts FOR ALL 
  USING (true) WITH CHECK (true);

-- guild_portal_blog_comments: habilitar RLS + policy pública
ALTER TABLE public.guild_portal_blog_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for blog_comments" ON public.guild_portal_blog_comments;
CREATE POLICY "Public access for blog_comments" 
  ON public.guild_portal_blog_comments FOR ALL 
  USING (true) WITH CHECK (true);

-- guild_portal_blog_likes: habilitar RLS + policy pública
ALTER TABLE public.guild_portal_blog_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for blog_likes" ON public.guild_portal_blog_likes;
CREATE POLICY "Public access for blog_likes" 
  ON public.guild_portal_blog_likes FOR ALL 
  USING (true) WITH CHECK (true);

-- guild_portal_blog_comment_likes: habilitar RLS + policy pública
ALTER TABLE public.guild_portal_blog_comment_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for blog_comment_likes" ON public.guild_portal_blog_comment_likes;
CREATE POLICY "Public access for blog_comment_likes" 
  ON public.guild_portal_blog_comment_likes FOR ALL 
  USING (true) WITH CHECK (true);
