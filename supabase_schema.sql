-- =============================================
-- Music Capsule SNS - Database Schema
-- Supabase SQL Editor で実行してください
-- =============================================

-- 1. profiles テーブル
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- プロフィール自動作成トリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'user_name', NEW.raw_user_meta_data ->> 'name', 'User'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. posts テーブル
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album_art_url TEXT NOT NULL,
  description TEXT DEFAULT '',
  spotify_link TEXT,
  apple_music_link TEXT,
  youtube_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- 3. likes テーブル
CREATE TABLE IF NOT EXISTS likes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- 4. tags テーブル
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- デフォルトタグの挿入
INSERT INTO tags (name) VALUES
  ('Chill'),
  ('Upbeat'),
  ('作業用'),
  ('ドライブ'),
  ('エモい'),
  ('懐かしい'),
  ('新発見')
ON CONFLICT (name) DO NOTHING;

-- 5. post_tags テーブル
CREATE TABLE IF NOT EXISTS post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (post_id, tag_id)
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

-- profiles: 全員閲覧可、本人のみ更新可
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- posts: 全員閲覧可、認証ユーザーは投稿可、本人のみ削除可
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE USING (auth.uid() = user_id);

-- likes: 全員閲覧可、認証ユーザーはいいね可、本人のみ取消可
CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like"
  ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes"
  ON likes FOR DELETE USING (auth.uid() = user_id);

-- tags: 全員閲覧可
CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT USING (true);

-- post_tags: 全員閲覧可、投稿者のみ追加可
CREATE POLICY "Post tags are viewable by everyone"
  ON post_tags FOR SELECT USING (true);

CREATE POLICY "Post owners can add tags"
  ON post_tags FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_id AND posts.user_id = auth.uid()
    )
  );
