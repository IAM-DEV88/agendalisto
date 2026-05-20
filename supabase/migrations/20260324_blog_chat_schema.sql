-- Blog Posts Table
CREATE TABLE IF NOT EXISTS public.agendaya_blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_name TEXT DEFAULT 'Guía del Sitio',
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Comments Table
CREATE TABLE IF NOT EXISTS public.agendaya_blog_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.agendaya_blog_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_agent_reply BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Likes Table (for both posts and comments)
CREATE TABLE IF NOT EXISTS public.agendaya_blog_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.agendaya_blog_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.agendaya_blog_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT one_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    UNIQUE(user_id, post_id, comment_id)
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS public.agendaya_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for anonymous
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.agendaya_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendaya_blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendaya_blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendaya_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Blog Posts
CREATE POLICY "Blog posts are viewable by everyone" ON public.agendaya_blog_posts FOR SELECT USING (true);

-- RLS Policies for Blog Comments
CREATE POLICY "Comments are viewable by everyone" ON public.agendaya_blog_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post comments" ON public.agendaya_blog_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for Blog Likes
CREATE POLICY "Likes are viewable by everyone" ON public.agendaya_blog_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON public.agendaya_blog_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own likes" ON public.agendaya_blog_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Chat Messages
CREATE POLICY "Users can view their own chat messages" ON public.agendaya_chat_messages FOR SELECT USING (auth.uid() = user_id OR session_id = current_setting('request.jwt.claims', true)::json->>'session_id');
CREATE POLICY "Anyone can insert chat messages" ON public.agendaya_chat_messages FOR INSERT WITH CHECK (true);

-- Trigger for updating likes_count on posts
CREATE OR REPLACE FUNCTION update_blog_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.post_id IS NOT NULL THEN
            UPDATE agendaya_blog_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.post_id IS NOT NULL THEN
            UPDATE agendaya_blog_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_blog_post_like_change
AFTER INSERT OR DELETE ON public.agendaya_blog_likes
FOR EACH ROW EXECUTE FUNCTION update_blog_post_likes_count();

-- Trigger for updating likes_count on comments
CREATE OR REPLACE FUNCTION update_blog_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.comment_id IS NOT NULL THEN
            UPDATE agendaya_blog_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.comment_id IS NOT NULL THEN
            UPDATE agendaya_blog_comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_blog_comment_like_change
AFTER INSERT OR DELETE ON public.agendaya_blog_likes
FOR EACH ROW EXECUTE FUNCTION update_blog_comment_likes_count();
