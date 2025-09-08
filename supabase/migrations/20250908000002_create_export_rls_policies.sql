-- Migration: Create Export System RLS Policies
-- Description: Row Level Security policies for export system tables
-- Date: 2025-09-08

-- Enable RLS on all export tables
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_platform_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_queue_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_export_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_webhooks ENABLE ROW LEVEL SECURITY;

-- Export Jobs Policies
CREATE POLICY "Users can view their own export jobs"
ON export_jobs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create export jobs for their games"
ON export_jobs FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
        SELECT 1 FROM games 
        WHERE games.id = export_jobs.game_id 
        AND games.creator_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own export jobs"
ON export_jobs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own export jobs"
ON export_jobs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Service role can manage all export jobs for background processing
CREATE POLICY "Service role can manage all export jobs"
ON export_jobs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Export Artifacts Policies
CREATE POLICY "Users can view artifacts from their export jobs"
ON export_artifacts FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM export_jobs
        WHERE export_jobs.id = export_artifacts.export_job_id
        AND export_jobs.user_id = auth.uid()
    )
);

CREATE POLICY "Service role can manage all export artifacts"
ON export_artifacts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Export Platform Configs Policies (Read-only for authenticated users)
CREATE POLICY "Authenticated users can view platform configs"
ON export_platform_configs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage platform configs"
ON export_platform_configs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Export Queue Stats Policies (Read-only for authenticated users)
CREATE POLICY "Authenticated users can view queue stats"
ON export_queue_stats FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage queue stats"
ON export_queue_stats FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- User Export Usage Policies
CREATE POLICY "Users can view their own export usage"
ON user_export_usage FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own export usage"
ON user_export_usage FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all user export usage"
ON user_export_usage FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Export Analytics Policies
CREATE POLICY "Users can view analytics for their export jobs"
ON export_analytics FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM export_jobs
        WHERE export_jobs.id = export_analytics.export_job_id
        AND export_jobs.user_id = auth.uid()
    )
);

CREATE POLICY "Service role can manage all export analytics"
ON export_analytics FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Export Webhooks Policies
CREATE POLICY "Users can manage their own webhooks"
ON export_webhooks FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all webhooks"
ON export_webhooks FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Additional security functions
CREATE OR REPLACE FUNCTION can_create_export_job(
    p_game_id UUID,
    p_platform export_platform,
    p_subscription_tier TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    game_exists BOOLEAN;
    is_game_owner BOOLEAN;
    tier_allowed BOOLEAN;
    daily_limit INTEGER;
    current_usage INTEGER;
BEGIN
    -- Check if game exists and user owns it
    SELECT 
        EXISTS(SELECT 1 FROM games WHERE id = p_game_id),
        EXISTS(SELECT 1 FROM games WHERE id = p_game_id AND creator_id = auth.uid())
    INTO game_exists, is_game_owner;
    
    IF NOT game_exists OR NOT is_game_owner THEN
        RETURN FALSE;
    END IF;
    
    -- Check subscription tier permissions
    SELECT CASE p_subscription_tier
        WHEN 'free' THEN p_platform IN ('web', 'pwa')
        WHEN 'pro' THEN p_platform IN ('web', 'pwa', 'desktop-windows', 'desktop-macos', 'desktop-linux', 'mobile-android', 'mobile-ios')
        WHEN 'max' THEN TRUE -- All platforms
        WHEN 'educational' THEN p_platform IN ('web', 'pwa', 'source-code')
        ELSE FALSE
    END INTO tier_allowed;
    
    IF NOT tier_allowed THEN
        RETURN FALSE;
    END IF;
    
    -- Check daily limits based on subscription tier
    daily_limit := CASE p_subscription_tier
        WHEN 'free' THEN 5
        WHEN 'pro' THEN 25
        WHEN 'max' THEN 100
        WHEN 'educational' THEN 15
        ELSE 0
    END;
    
    -- Get current daily usage
    SELECT COALESCE(exports_today, 0) 
    FROM user_export_usage 
    WHERE user_id = auth.uid() 
    AND usage_date = CURRENT_DATE
    INTO current_usage;
    
    RETURN COALESCE(current_usage, 0) < daily_limit;
END;
$$;

-- Function to increment user export usage
CREATE OR REPLACE FUNCTION increment_user_export_usage(
    p_user_id UUID,
    p_platform export_platform
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO user_export_usage (
        user_id,
        usage_date,
        exports_today,
        total_exports,
        web_exports,
        desktop_exports,
        mobile_exports,
        source_exports
    ) VALUES (
        p_user_id,
        CURRENT_DATE,
        1,
        1,
        CASE WHEN p_platform IN ('web', 'pwa') THEN 1 ELSE 0 END,
        CASE WHEN p_platform IN ('desktop-windows', 'desktop-macos', 'desktop-linux') THEN 1 ELSE 0 END,
        CASE WHEN p_platform IN ('mobile-android', 'mobile-ios') THEN 1 ELSE 0 END,
        CASE WHEN p_platform = 'source-code' THEN 1 ELSE 0 END
    )
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET
        exports_today = user_export_usage.exports_today + 1,
        total_exports = user_export_usage.total_exports + 1,
        web_exports = user_export_usage.web_exports + 
            CASE WHEN p_platform IN ('web', 'pwa') THEN 1 ELSE 0 END,
        desktop_exports = user_export_usage.desktop_exports + 
            CASE WHEN p_platform IN ('desktop-windows', 'desktop-macos', 'desktop-linux') THEN 1 ELSE 0 END,
        mobile_exports = user_export_usage.mobile_exports + 
            CASE WHEN p_platform IN ('mobile-android', 'mobile-ios') THEN 1 ELSE 0 END,
        source_exports = user_export_usage.source_exports + 
            CASE WHEN p_platform = 'source-code' THEN 1 ELSE 0 END,
        updated_at = NOW();
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION can_create_export_job TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_user_export_usage TO service_role;