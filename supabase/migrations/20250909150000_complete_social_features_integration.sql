-- Migration: Complete Social Features Integration
-- Description: Add missing social features tables and fix references
-- Date: 2025-09-09

-- Create social_shares table for tracking social media shares
CREATE TABLE IF NOT EXISTS social_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL CHECK (share_type IN ('link', 'twitter', 'facebook', 'discord', 'reddit', 'embed', 'whatsapp', 'telegram')),
  platform_data JSONB DEFAULT '{}', -- Platform-specific metadata
  referrer TEXT, -- Where the share originated from
  user_agent TEXT, -- Browser/client info for analytics
  ip_address INET, -- For basic analytics
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for social_shares
CREATE INDEX IF NOT EXISTS idx_social_shares_user_id ON social_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_game_id ON social_shares(game_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_type ON social_shares(share_type);
CREATE INDEX IF NOT EXISTS idx_social_shares_created_at ON social_shares(created_at DESC);

-- Create game_likes_detailed view for better analytics
CREATE OR REPLACE VIEW game_likes_detailed AS
SELECT 
  gl.*,
  p.username,
  p.display_name,
  p.avatar_url,
  g.title as game_title,
  g.creator_id as game_creator_id
FROM game_likes gl
JOIN profiles p ON gl.user_id = p.id
JOIN games g ON gl.game_id = g.id;

-- Create social activity summary view
CREATE OR REPLACE VIEW user_social_activity AS
SELECT 
  p.id as user_id,
  p.username,
  p.display_name,
  COUNT(DISTINCT gl.id) as total_likes_given,
  COUNT(DISTINCT gc.id) as total_comments_made,
  COUNT(DISTINCT gr.id) as total_ratings_given,
  COUNT(DISTINCT ss.id) as total_shares_made,
  COUNT(DISTINCT uf.id) as total_following,
  COUNT(DISTINCT uf2.id) as total_followers,
  COUNT(DISTINCT ua.id) as total_achievements,
  -- Games created by user receiving social engagement
  COALESCE(SUM(g.like_count), 0) as total_likes_received,
  COALESCE(SUM(g.play_count), 0) as total_plays_received,
  MAX(GREATEST(gl.created_at, gc.created_at, gr.created_at, ss.created_at)) as last_social_activity
FROM profiles p
LEFT JOIN game_likes gl ON p.id = gl.user_id
LEFT JOIN game_comments gc ON p.id = gc.author_id AND gc.is_deleted = false
LEFT JOIN game_ratings gr ON p.id = gr.user_id
LEFT JOIN social_shares ss ON p.id = ss.user_id
LEFT JOIN user_follows uf ON p.id = uf.follower_id
LEFT JOIN user_follows uf2 ON p.id = uf2.following_id
LEFT JOIN user_achievements ua ON p.id = ua.user_id
LEFT JOIN games g ON p.id = g.creator_id
GROUP BY p.id, p.username, p.display_name;

-- Create function to get trending games with social metrics
CREATE OR REPLACE FUNCTION get_trending_games_with_social(
  limit_count INTEGER DEFAULT 20,
  days_back INTEGER DEFAULT 7
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  creator_id UUID,
  creator_username TEXT,
  creator_display_name TEXT,
  thumbnail_url TEXT,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  play_count INTEGER,
  like_count INTEGER,
  comment_count BIGINT,
  rating_count BIGINT,
  average_rating NUMERIC,
  share_count BIGINT,
  trending_score NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.title,
    g.creator_id,
    p.username as creator_username,
    p.display_name as creator_display_name,
    g.thumbnail_url,
    g.description,
    g.tags,
    g.created_at,
    g.play_count,
    g.like_count,
    COUNT(DISTINCT gc.id) as comment_count,
    COUNT(DISTINCT gr.id) as rating_count,
    COALESCE(AVG(gr.rating), 0) as average_rating,
    COUNT(DISTINCT ss.id) as share_count,
    -- Enhanced trending score calculation
    (
      COALESCE(g.play_count, 0) * 1.0 +
      COALESCE(g.like_count, 0) * 3.0 +
      COALESCE(g.fork_count, 0) * 2.0 +
      COUNT(DISTINCT gc.id) * 2.0 +
      COUNT(DISTINCT gr.id) * 2.5 +
      COUNT(DISTINCT ss.id) * 1.5 +
      -- Time decay factor (newer games get boost)
      CASE 
        WHEN g.created_at > NOW() - INTERVAL '7 days' THEN 20.0
        WHEN g.created_at > NOW() - INTERVAL '30 days' THEN 10.0
        ELSE 0.0
      END
    ) / (EXTRACT(EPOCH FROM (NOW() - g.created_at)) / 86400 + 1) as trending_score
  FROM games g 
  JOIN profiles p ON g.creator_id = p.id
  LEFT JOIN game_comments gc ON g.id = gc.game_id 
    AND gc.is_deleted = false 
    AND gc.created_at > NOW() - INTERVAL concat(days_back, ' days')
  LEFT JOIN game_ratings gr ON g.id = gr.game_id
    AND gr.created_at > NOW() - INTERVAL concat(days_back, ' days')
  LEFT JOIN social_shares ss ON g.id = ss.game_id
    AND ss.created_at > NOW() - INTERVAL concat(days_back, ' days')
  WHERE g.visibility = 'public' 
    AND g.published_at IS NOT NULL
  GROUP BY g.id, g.title, g.creator_id, p.username, p.display_name, 
           g.thumbnail_url, g.description, g.tags, g.created_at, 
           g.play_count, g.like_count, g.fork_count
  ORDER BY trending_score DESC, g.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Create function to get user social stats
CREATE OR REPLACE FUNCTION get_user_social_stats(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'followers_count', (
      SELECT COUNT(*) FROM user_follows 
      WHERE following_id = target_user_id
    ),
    'following_count', (
      SELECT COUNT(*) FROM user_follows 
      WHERE follower_id = target_user_id
    ),
    'total_likes_received', COALESCE((
      SELECT SUM(like_count) FROM games 
      WHERE creator_id = target_user_id
    ), 0),
    'total_achievements', (
      SELECT COUNT(*) FROM user_achievements 
      WHERE user_id = target_user_id
    ),
    'games_created', (
      SELECT COUNT(*) FROM games 
      WHERE creator_id = target_user_id 
        AND visibility = 'public'
        AND published_at IS NOT NULL
    ),
    'total_plays_received', COALESCE((
      SELECT SUM(play_count) FROM games 
      WHERE creator_id = target_user_id
    ), 0),
    'total_comments_received', (
      SELECT COUNT(*) FROM game_comments gc
      JOIN games g ON gc.game_id = g.id
      WHERE g.creator_id = target_user_id 
        AND gc.is_deleted = false
    ),
    'total_ratings_received', (
      SELECT COUNT(*) FROM game_ratings gr
      JOIN games g ON gr.game_id = g.id
      WHERE g.creator_id = target_user_id
    ),
    'average_rating_received', COALESCE((
      SELECT AVG(gr.rating) FROM game_ratings gr
      JOIN games g ON gr.game_id = g.id
      WHERE g.creator_id = target_user_id
    ), 0)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Create function to record social share
CREATE OR REPLACE FUNCTION record_social_share(
  p_user_id UUID,
  p_game_id UUID,
  p_share_type TEXT,
  p_platform_data JSONB DEFAULT '{}',
  p_referrer TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  share_id UUID;
BEGIN
  -- Insert the share record
  INSERT INTO social_shares (user_id, game_id, share_type, platform_data, referrer, user_agent)
  VALUES (p_user_id, p_game_id, p_share_type, p_platform_data, p_referrer, p_user_agent)
  RETURNING id INTO share_id;
  
  -- Create activity record if activities table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
    INSERT INTO activities (
      user_id, 
      activity_type, 
      target_game_id, 
      activity_data,
      visibility
    )
    VALUES (
      p_user_id,
      'game_shared',
      p_game_id,
      json_build_object(
        'share_type', p_share_type,
        'platform_data', p_platform_data
      ),
      'followers'
    );
  END IF;
  
  RETURN share_id;
END;
$$;

-- Enable RLS on social_shares
ALTER TABLE social_shares ENABLE ROW LEVEL SECURITY;

-- RLS policies for social_shares
CREATE POLICY "Users can view all public social shares"
  ON social_shares FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own social shares"
  ON social_shares FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own social shares"
  ON social_shares FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Add helpful comments to the tables
COMMENT ON TABLE social_shares IS 'Tracks when users share games on social platforms';
COMMENT ON COLUMN social_shares.share_type IS 'The platform or method used to share (twitter, facebook, discord, etc.)';
COMMENT ON COLUMN social_shares.platform_data IS 'Platform-specific metadata like tweet ID, post ID, etc.';

-- Create trigger to update games.like_count when game_likes changes
CREATE OR REPLACE FUNCTION update_game_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE games SET like_count = like_count + 1 WHERE id = NEW.game_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN  
    UPDATE games SET like_count = like_count - 1 WHERE id = OLD.game_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_update_game_like_count ON game_likes;
CREATE TRIGGER trigger_update_game_like_count
  AFTER INSERT OR DELETE ON game_likes
  FOR EACH ROW EXECUTE FUNCTION update_game_like_count();

-- Grant appropriate permissions
GRANT SELECT ON social_shares TO authenticated;
GRANT INSERT ON social_shares TO authenticated;
GRANT USAGE ON SEQUENCE social_shares_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_games_with_social TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_social_stats TO authenticated;
GRANT EXECUTE ON FUNCTION record_social_share TO authenticated;