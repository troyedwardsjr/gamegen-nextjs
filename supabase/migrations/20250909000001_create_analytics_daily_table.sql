-- Create analytics_daily table for pre-computed daily aggregates
CREATE TABLE IF NOT EXISTS public.analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Overview metrics
  total_plays INTEGER DEFAULT 0,
  unique_players INTEGER DEFAULT 0,
  total_projects INTEGER DEFAULT 0,
  new_projects INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  new_followers INTEGER DEFAULT 0,
  
  -- Engagement metrics
  avg_session_duration NUMERIC DEFAULT 0,
  completion_rate NUMERIC DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0,
  
  -- Device/Platform breakdown (JSON for flexibility)
  device_breakdown JSONB DEFAULT '{"desktop": 0, "mobile": 0, "tablet": 0}'::jsonb,
  platform_breakdown JSONB DEFAULT '{"web": 0, "desktop": 0, "mobile": 0}'::jsonb,
  
  -- Geographic breakdown (top countries)
  country_breakdown JSONB DEFAULT '{}'::jsonb,
  
  -- Project performance (top 10 projects for the day)
  top_projects JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT analytics_daily_creator_date_unique UNIQUE(creator_id, date),
  CONSTRAINT analytics_daily_metrics_positive CHECK (
    total_plays >= 0 AND 
    unique_players >= 0 AND 
    total_projects >= 0 AND 
    new_projects >= 0 AND 
    total_likes >= 0 AND 
    total_comments >= 0 AND
    new_followers >= 0
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_daily_creator_id ON public.analytics_daily(creator_id);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON public.analytics_daily(date);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_creator_date ON public.analytics_daily(creator_id, date);

-- Enable RLS
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only see their own analytics
CREATE POLICY "Users can view own analytics data" ON public.analytics_daily
  FOR SELECT USING (auth.uid() = creator_id);

-- Create policy for inserting/updating analytics data (for system processes)
CREATE POLICY "System can manage analytics data" ON public.analytics_daily
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR 
    auth.uid() = creator_id
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_analytics_daily_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analytics_daily_updated_at_trigger
  BEFORE UPDATE ON public.analytics_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_daily_updated_at();

-- Create function to aggregate daily analytics data
CREATE OR REPLACE FUNCTION aggregate_daily_analytics(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS INTEGER AS $$
DECLARE
  rec RECORD;
  analytics_record RECORD;
  total_processed INTEGER := 0;
BEGIN
  -- Loop through each creator who had activity on the target date
  FOR rec IN 
    SELECT DISTINCT ps.player_id as creator_id
    FROM play_sessions ps 
    WHERE DATE(ps.created_at) = target_date
    AND ps.player_id IS NOT NULL
  LOOP
    -- Calculate analytics for this creator and date
    SELECT 
      rec.creator_id,
      target_date,
      COUNT(DISTINCT ps.id) as total_plays,
      COUNT(DISTINCT ps.player_id) as unique_players,
      COUNT(DISTINCT ps.game_id) as total_projects,
      -- Games created on this date
      (SELECT COUNT(*) FROM games g WHERE g.creator_id = rec.creator_id AND DATE(g.created_at) = target_date) as new_projects,
      -- Likes received on this date
      (SELECT COUNT(*) FROM game_likes gl 
       JOIN games g ON gl.game_id = g.id 
       WHERE g.creator_id = rec.creator_id AND DATE(gl.created_at) = target_date) as total_likes,
      -- Comments received on this date  
      (SELECT COUNT(*) FROM game_comments gc 
       JOIN games g ON gc.game_id = g.id 
       WHERE g.creator_id = rec.creator_id AND DATE(gc.created_at) = target_date) as total_comments,
      -- New followers on this date
      (SELECT COUNT(*) FROM user_follows uf 
       WHERE uf.following_id = rec.creator_id AND DATE(uf.created_at) = target_date) as new_followers,
      -- Average session duration (in seconds)
      COALESCE(AVG(ps.session_duration), 0) as avg_session_duration,
      -- Completion rate
      COALESCE(AVG(ps.completion_percentage), 0) as completion_rate,
      -- Device breakdown
      json_build_object(
        'desktop', COUNT(*) FILTER (WHERE ps.platform = 'web'),
        'mobile', COUNT(*) FILTER (WHERE ps.platform = 'mobile'),
        'tablet', COUNT(*) FILTER (WHERE ps.device_info->>'deviceType' = 'tablet')
      ) as device_breakdown,
      -- Platform breakdown
      json_build_object(
        'web', COUNT(*) FILTER (WHERE ps.platform = 'web'),
        'desktop', COUNT(*) FILTER (WHERE ps.platform = 'desktop'),
        'mobile', COUNT(*) FILTER (WHERE ps.platform = 'mobile')
      ) as platform_breakdown
    INTO analytics_record
    FROM play_sessions ps
    WHERE DATE(ps.created_at) = target_date
    AND ps.player_id = rec.creator_id
    GROUP BY rec.creator_id;
    
    -- Insert or update the analytics record
    INSERT INTO analytics_daily (
      creator_id, date, total_plays, unique_players, total_projects, 
      new_projects, total_likes, total_comments, new_followers,
      avg_session_duration, completion_rate, device_breakdown, platform_breakdown
    ) VALUES (
      analytics_record.creator_id, analytics_record.date, 
      analytics_record.total_plays, analytics_record.unique_players, 
      analytics_record.total_projects, analytics_record.new_projects,
      analytics_record.total_likes, analytics_record.total_comments, 
      analytics_record.new_followers, analytics_record.avg_session_duration,
      analytics_record.completion_rate, analytics_record.device_breakdown,
      analytics_record.platform_breakdown
    ) ON CONFLICT (creator_id, date) 
    DO UPDATE SET
      total_plays = EXCLUDED.total_plays,
      unique_players = EXCLUDED.unique_players,
      total_projects = EXCLUDED.total_projects,
      new_projects = EXCLUDED.new_projects,
      total_likes = EXCLUDED.total_likes,
      total_comments = EXCLUDED.total_comments,
      new_followers = EXCLUDED.new_followers,
      avg_session_duration = EXCLUDED.avg_session_duration,
      completion_rate = EXCLUDED.completion_rate,
      device_breakdown = EXCLUDED.device_breakdown,
      platform_breakdown = EXCLUDED.platform_breakdown,
      updated_at = NOW();
    
    total_processed := total_processed + 1;
  END LOOP;
  
  RETURN total_processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;