-- Theme Asset Pack System
-- Tables for managing theme-based batch asset generation and asset pack management

-- AI Asset Packs table
CREATE TABLE IF NOT EXISTS ai_asset_packs (
    id TEXT PRIMARY KEY, -- Custom format: pack_theme_timestamp_random
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Pack metadata
    theme_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    
    -- Generation status
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    generation_job_id UUID REFERENCES ai_generation_jobs(id) ON DELETE SET NULL,
    
    -- Progress tracking
    total_assets INTEGER NOT NULL DEFAULT 0,
    completed_assets INTEGER DEFAULT 0,
    failed_assets_count INTEGER DEFAULT 0,
    current_category TEXT,
    current_asset TEXT,
    
    -- Quality metrics
    quality_scores DECIMAL(3,2)[] DEFAULT '{}',
    consistency_checks JSONB DEFAULT '[]',
    average_quality DECIMAL(3,2) DEFAULT 0,
    consistency_score DECIMAL(3,2) DEFAULT 0,
    
    -- Asset organization
    completed_assets_by_category JSONB DEFAULT '{}',
    failed_assets JSONB DEFAULT '[]',
    
    -- Output files
    package_url TEXT, -- ZIP download URL
    sprite_sheets JSONB DEFAULT '[]', -- Array of sprite sheet info
    
    -- Timing information
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    estimated_completion TIMESTAMPTZ,
    processing_time_ms INTEGER,
    
    -- Credit management
    estimated_credits INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT valid_pack_timing CHECK (
        started_at IS NULL OR started_at >= created_at
    ),
    CONSTRAINT valid_pack_completion CHECK (
        completed_at IS NULL OR (started_at IS NOT NULL AND completed_at >= started_at)
    ),
    CONSTRAINT valid_progress CHECK (
        completed_assets <= total_assets
    )
);

-- Indexes for performance
CREATE INDEX idx_ai_asset_packs_user_id ON ai_asset_packs(user_id);
CREATE INDEX idx_ai_asset_packs_theme_id ON ai_asset_packs(theme_id);
CREATE INDEX idx_ai_asset_packs_status ON ai_asset_packs(status);
CREATE INDEX idx_ai_asset_packs_created_at ON ai_asset_packs(created_at);
CREATE INDEX idx_ai_asset_packs_processing ON ai_asset_packs(status, started_at) WHERE status = 'processing';

-- Theme Asset Pack Templates table (predefined configurations)
CREATE TABLE IF NOT EXISTS ai_theme_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Theme definition
    theme_config JSONB NOT NULL,
    
    -- Pack configuration template
    pack_template JSONB NOT NULL,
    
    -- Preview and marketing
    preview_images TEXT[] DEFAULT '{}',
    sample_assets TEXT[] DEFAULT '{}',
    
    -- Metadata
    target_audience TEXT,
    game_genres TEXT[] DEFAULT '{}',
    complexity_level TEXT CHECK (complexity_level IN ('simple', 'medium', 'complex')),
    estimated_asset_count INTEGER DEFAULT 0,
    estimated_generation_time INTEGER DEFAULT 0, -- minutes
    
    -- Pricing and access
    required_tier TEXT DEFAULT 'free' CHECK (required_tier IN ('free', 'pro', 'max', 'educational')),
    base_credit_cost INTEGER DEFAULT 0,
    
    -- Template management
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for theme templates
CREATE INDEX idx_ai_theme_templates_active ON ai_theme_templates(is_active);
CREATE INDEX idx_ai_theme_templates_featured ON ai_theme_templates(is_featured);
CREATE INDEX idx_ai_theme_templates_tier ON ai_theme_templates(required_tier);
CREATE INDEX idx_ai_theme_templates_complexity ON ai_theme_templates(complexity_level);

-- Asset Pack Reviews table (for user feedback on generated packs)
CREATE TABLE IF NOT EXISTS ai_asset_pack_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pack_id TEXT NOT NULL REFERENCES ai_asset_packs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    consistency_rating INTEGER CHECK (consistency_rating >= 1 AND consistency_rating <= 5),
    usefulness_rating INTEGER CHECK (usefulness_rating >= 1 AND usefulness_rating <= 5),
    
    -- Feedback
    review_text TEXT,
    liked_categories TEXT[] DEFAULT '{}',
    improvement_suggestions TEXT[] DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate reviews
    UNIQUE(pack_id, user_id)
);

-- Index for pack reviews
CREATE INDEX idx_ai_asset_pack_reviews_pack_id ON ai_asset_pack_reviews(pack_id);
CREATE INDEX idx_ai_asset_pack_reviews_rating ON ai_asset_pack_reviews(rating);
CREATE INDEX idx_ai_asset_pack_reviews_created_at ON ai_asset_pack_reviews(created_at);

-- Theme Usage Analytics table (for tracking popular themes and optimization)
CREATE TABLE IF NOT EXISTS ai_theme_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    theme_id TEXT NOT NULL,
    
    -- Usage metrics
    total_packs_generated INTEGER DEFAULT 0,
    total_assets_generated INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    
    -- Success metrics
    successful_packs INTEGER DEFAULT 0,
    failed_packs INTEGER DEFAULT 0,
    cancelled_packs INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Quality metrics
    average_quality DECIMAL(3,2) DEFAULT 0,
    average_consistency DECIMAL(3,2) DEFAULT 0,
    average_user_rating DECIMAL(3,2) DEFAULT 0,
    
    -- Performance metrics
    average_generation_time INTEGER DEFAULT 0, -- seconds
    average_credits_used INTEGER DEFAULT 0,
    
    -- Resource usage
    total_processing_time BIGINT DEFAULT 0, -- milliseconds
    total_credits_consumed INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint for date/theme combination
    UNIQUE(date, theme_id)
);

-- Index for analytics
CREATE INDEX idx_ai_theme_analytics_date ON ai_theme_analytics(date);
CREATE INDEX idx_ai_theme_analytics_theme_id ON ai_theme_analytics(theme_id);
CREATE INDEX idx_ai_theme_analytics_success_rate ON ai_theme_analytics(success_rate);

-- Update game_assets table to reference asset packs
ALTER TABLE game_assets ADD COLUMN IF NOT EXISTS pack_id TEXT REFERENCES ai_asset_packs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_game_assets_pack_id ON game_assets(pack_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE ai_asset_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_theme_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_asset_pack_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_theme_analytics ENABLE ROW LEVEL SECURITY;

-- Asset Packs policies
CREATE POLICY "Users can view their own asset packs" ON ai_asset_packs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own asset packs" ON ai_asset_packs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own asset packs" ON ai_asset_packs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own asset packs" ON ai_asset_packs
    FOR DELETE USING (auth.uid() = user_id);

-- Service role can access all asset packs (for processing)
CREATE POLICY "Service role can access all asset packs" ON ai_asset_packs
    FOR ALL USING (auth.role() = 'service_role');

-- Theme Templates policies (read-only for users)
CREATE POLICY "Anyone can view active theme templates" ON ai_theme_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage theme templates" ON ai_theme_templates
    FOR ALL USING (auth.role() = 'service_role');

-- Asset Pack Reviews policies
CREATE POLICY "Users can view all pack reviews" ON ai_asset_pack_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for packs they own or have access to" ON ai_asset_pack_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON ai_asset_pack_reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON ai_asset_pack_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Theme Analytics policies (read-only for users)
CREATE POLICY "Anyone can view theme analytics" ON ai_theme_analytics
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage theme analytics" ON ai_theme_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_ai_asset_packs_updated_at 
    BEFORE UPDATE ON ai_asset_packs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_theme_templates_updated_at 
    BEFORE UPDATE ON ai_theme_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_asset_pack_reviews_updated_at 
    BEFORE UPDATE ON ai_asset_pack_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_theme_analytics_updated_at 
    BEFORE UPDATE ON ai_theme_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update theme analytics
CREATE OR REPLACE FUNCTION update_theme_analytics(
    p_theme_id TEXT,
    p_pack_status TEXT,
    p_assets_count INTEGER DEFAULT 0,
    p_quality_score DECIMAL DEFAULT 0,
    p_consistency_score DECIMAL DEFAULT 0,
    p_processing_time INTEGER DEFAULT 0,
    p_credits_used INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
BEGIN
    -- Upsert analytics record
    INSERT INTO ai_theme_analytics (
        date,
        theme_id,
        total_packs_generated,
        total_assets_generated,
        total_users,
        successful_packs,
        failed_packs,
        cancelled_packs,
        total_processing_time,
        total_credits_consumed
    ) VALUES (
        current_date,
        p_theme_id,
        CASE WHEN p_pack_status IS NOT NULL THEN 1 ELSE 0 END,
        p_assets_count,
        1,
        CASE WHEN p_pack_status = 'completed' THEN 1 ELSE 0 END,
        CASE WHEN p_pack_status = 'failed' THEN 1 ELSE 0 END,
        CASE WHEN p_pack_status = 'cancelled' THEN 1 ELSE 0 END,
        p_processing_time,
        p_credits_used
    )
    ON CONFLICT (date, theme_id) 
    DO UPDATE SET
        total_packs_generated = ai_theme_analytics.total_packs_generated + 
            (CASE WHEN p_pack_status IS NOT NULL THEN 1 ELSE 0 END),
        total_assets_generated = ai_theme_analytics.total_assets_generated + p_assets_count,
        total_users = ai_theme_analytics.total_users + 1,
        successful_packs = ai_theme_analytics.successful_packs + 
            (CASE WHEN p_pack_status = 'completed' THEN 1 ELSE 0 END),
        failed_packs = ai_theme_analytics.failed_packs + 
            (CASE WHEN p_pack_status = 'failed' THEN 1 ELSE 0 END),
        cancelled_packs = ai_theme_analytics.cancelled_packs + 
            (CASE WHEN p_pack_status = 'cancelled' THEN 1 ELSE 0 END),
        total_processing_time = ai_theme_analytics.total_processing_time + p_processing_time,
        total_credits_consumed = ai_theme_analytics.total_credits_consumed + p_credits_used,
        updated_at = NOW();
        
    -- Update calculated fields
    UPDATE ai_theme_analytics 
    SET 
        success_rate = CASE 
            WHEN (successful_packs + failed_packs + cancelled_packs) > 0 
            THEN (successful_packs::DECIMAL / (successful_packs + failed_packs + cancelled_packs)) * 100
            ELSE 0 
        END,
        average_generation_time = CASE 
            WHEN successful_packs > 0 
            THEN (total_processing_time / 1000) / successful_packs
            ELSE 0 
        END,
        average_credits_used = CASE 
            WHEN successful_packs > 0 
            THEN total_credits_consumed / successful_packs
            ELSE 0 
        END
    WHERE date = current_date AND theme_id = p_theme_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get theme popularity rankings
CREATE OR REPLACE FUNCTION get_theme_popularity_ranking(
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    theme_id TEXT,
    total_packs INTEGER,
    success_rate DECIMAL,
    avg_rating DECIMAL,
    popularity_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ta.theme_id,
        SUM(ta.total_packs_generated)::INTEGER as total_packs,
        AVG(ta.success_rate) as success_rate,
        AVG(ta.average_user_rating) as avg_rating,
        -- Popularity score: weighted combination of usage, success, and ratings
        (
            (SUM(ta.total_packs_generated) * 0.4) +
            (AVG(ta.success_rate) * 0.3) +
            (AVG(ta.average_user_rating) * 20 * 0.3) -- Scale rating to 0-100
        ) as popularity_score
    FROM ai_theme_analytics ta
    WHERE ta.date >= CURRENT_DATE - INTERVAL '1 day' * p_days
    GROUP BY ta.theme_id
    HAVING SUM(ta.total_packs_generated) > 0
    ORDER BY popularity_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed initial theme templates
INSERT INTO ai_theme_templates (id, name, description, theme_config, pack_template, target_audience, game_genres, complexity_level, estimated_asset_count, required_tier, base_credit_cost)
VALUES 
    ('retro_platformer_basic', 'Retro Platformer (Basic)', 'Classic 8-bit platformer style with essential assets', 
     '{"id":"retro_platformer","stylePreferences":["pixel-art","8bit","retro"],"colorPalette":{"primary":["#FF6B6B","#4ECDC4","#45B7D1"]}}',
     '{"assetCategories":{"characters":{"count":4,"priority":"high"},"environments":{"count":8,"priority":"normal"},"items":{"count":6,"priority":"normal"}}}',
     'all', '["platformer","arcade"]', 'simple', 18, 'free', 180),
     
    ('space_shooter_pro', 'Space Shooter (Pro)', 'Complete sci-fi space shooter asset pack with effects', 
     '{"id":"space_shooter","stylePreferences":["pixel-art","16bit","sci-fi"],"colorPalette":{"primary":["#0F3460","#16213E","#1A1A2E"]}}',
     '{"assetCategories":{"characters":{"count":8,"priority":"high"},"environments":{"count":12,"priority":"high"},"items":{"count":10,"priority":"normal"},"effects":{"count":8,"priority":"normal"}}}',
     'teen+', '["shooter","action"]', 'medium', 38, 'pro', 380),
     
    ('fantasy_rpg_complete', 'Fantasy RPG (Complete)', 'Comprehensive medieval fantasy RPG asset collection', 
     '{"id":"fantasy_rpg","stylePreferences":["pixel-art","16bit","fantasy"],"colorPalette":{"primary":["#8B4513","#228B22","#4169E1"]}}',
     '{"assetCategories":{"characters":{"count":15,"priority":"high"},"environments":{"count":20,"priority":"high"},"items":{"count":25,"priority":"normal"},"ui":{"count":12,"priority":"normal"},"effects":{"count":8,"priority":"low"}}}',
     'teen+', '["rpg","adventure"]', 'complex', 80, 'max', 800)
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON ai_asset_packs TO service_role;
GRANT ALL ON ai_theme_templates TO service_role;
GRANT ALL ON ai_asset_pack_reviews TO service_role;
GRANT ALL ON ai_theme_analytics TO service_role;

GRANT SELECT, INSERT, UPDATE ON ai_asset_packs TO authenticated;
GRANT SELECT ON ai_theme_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_asset_pack_reviews TO authenticated;
GRANT SELECT ON ai_theme_analytics TO authenticated;

-- Comments for documentation
COMMENT ON TABLE ai_asset_packs IS 'Theme-based asset pack generations with batch processing and progress tracking';
COMMENT ON TABLE ai_theme_templates IS 'Predefined theme templates and configurations for asset pack generation';
COMMENT ON TABLE ai_asset_pack_reviews IS 'User reviews and feedback for generated asset packs';
COMMENT ON TABLE ai_theme_analytics IS 'Analytics and performance metrics for theme usage and success rates';