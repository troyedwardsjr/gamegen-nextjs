-- Asset Approval Workflow System
-- Tables for managing asset review, approval, and quality control processes

-- AI Asset Reviews table (main review tracking)
CREATE TABLE IF NOT EXISTS ai_asset_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id TEXT NOT NULL REFERENCES game_assets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Review status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision', 'flagged', 'escalated')),
    
    -- Quality assessment
    quality_score DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (quality_score >= 0 AND quality_score <= 1),
    consistency_score DECIMAL(3,2) DEFAULT 0.5 CHECK (consistency_score >= 0 AND consistency_score <= 1),
    
    -- Technical quality checks
    technical_quality JSONB DEFAULT '{
        "resolution": true,
        "format": true, 
        "fileIntegrity": true,
        "pixelArtCompliance": true
    }',
    
    -- Content moderation flags
    content_flags JSONB DEFAULT '{
        "inappropriate": false,
        "copyright": false,
        "violence": false,
        "adult": false,
        "offensive": false,
        "spam": false
    }',
    flagged_content_score DECIMAL(3,2) DEFAULT 0 CHECK (flagged_content_score >= 0 AND flagged_content_score <= 1),
    
    -- Review process tracking
    auto_processed BOOLEAN DEFAULT false,
    requires_manual_review BOOLEAN DEFAULT false,
    reviewer_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewer_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    
    -- Community feedback
    community_rating DECIMAL(3,2) CHECK (community_rating >= 1 AND community_rating <= 5),
    report_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    
    -- Timestamps
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    
    -- Revision tracking
    revision_count INTEGER DEFAULT 0,
    revision_requested TEXT,
    parent_asset_id TEXT REFERENCES game_assets(id) ON DELETE SET NULL,
    
    -- Metadata
    generation_metadata JSONB DEFAULT '{}',
    review_metadata JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT valid_review_timing CHECK (
        processed_at IS NULL OR processed_at >= submitted_at
    ),
    CONSTRAINT valid_approval_timing CHECK (
        approved_at IS NULL OR (processed_at IS NOT NULL AND approved_at >= processed_at)
    )
);

-- Indexes for performance
CREATE INDEX idx_ai_asset_reviews_asset_id ON ai_asset_reviews(asset_id);
CREATE INDEX idx_ai_asset_reviews_user_id ON ai_asset_reviews(user_id);
CREATE INDEX idx_ai_asset_reviews_status ON ai_asset_reviews(status);
CREATE INDEX idx_ai_asset_reviews_reviewer ON ai_asset_reviews(reviewer_user_id) WHERE reviewer_user_id IS NOT NULL;
CREATE INDEX idx_ai_asset_reviews_pending ON ai_asset_reviews(submitted_at) WHERE status = 'pending';
CREATE INDEX idx_ai_asset_reviews_quality ON ai_asset_reviews(quality_score);
CREATE INDEX idx_ai_asset_reviews_flagged ON ai_asset_reviews(flagged_content_score) WHERE flagged_content_score > 0.5;

-- AI Reviewers table (reviewer management and assignments)
CREATE TABLE IF NOT EXISTS ai_reviewers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Reviewer profile
    specializations TEXT[] DEFAULT '{}', -- Asset types they specialize in
    experience_level TEXT DEFAULT 'junior' CHECK (experience_level IN ('junior', 'mid', 'senior', 'expert')),
    
    -- Current workload
    workload INTEGER DEFAULT 0, -- Current number of pending reviews
    max_concurrent_reviews INTEGER DEFAULT 10,
    
    -- Performance metrics
    total_reviews INTEGER DEFAULT 0,
    total_approved INTEGER DEFAULT 0,
    total_rejected INTEGER DEFAULT 0,
    average_review_time INTEGER DEFAULT 0, -- Minutes
    review_quality_score DECIMAL(3,2) DEFAULT 0.5, -- Based on review accuracy
    
    -- Availability
    is_active BOOLEAN DEFAULT true,
    available_hours JSONB DEFAULT '{"timezone": "UTC", "hours": [9,10,11,12,13,14,15,16,17]}',
    last_active TIMESTAMPTZ DEFAULT NOW(),
    
    -- Approval thresholds for this reviewer
    auto_approve_threshold DECIMAL(3,2) DEFAULT 0.8,
    escalation_threshold DECIMAL(3,2) DEFAULT 0.3,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for reviewer management
CREATE INDEX idx_ai_reviewers_user_id ON ai_reviewers(user_id);
CREATE INDEX idx_ai_reviewers_active ON ai_reviewers(is_active);
CREATE INDEX idx_ai_reviewers_workload ON ai_reviewers(workload) WHERE is_active = true;
CREATE INDEX idx_ai_reviewers_specializations ON ai_reviewers USING GIN(specializations);

-- AI Asset Reports table (community reports and flagging)
CREATE TABLE IF NOT EXISTS ai_asset_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id TEXT NOT NULL REFERENCES game_assets(id) ON DELETE CASCADE,
    reporter_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Report details
    reason TEXT NOT NULL CHECK (reason IN (
        'inappropriate_content', 'copyright_violation', 'violence', 
        'adult_content', 'offensive_language', 'spam', 'low_quality',
        'duplicate', 'misleading', 'other'
    )),
    details TEXT,
    
    -- Report status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    
    -- Review of the report
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Resolution
    resolution_action TEXT CHECK (resolution_action IN (
        'no_action', 'asset_removed', 'asset_flagged', 'user_warned', 
        'user_suspended', 'escalated'
    )),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    
    -- Prevent duplicate reports
    UNIQUE(asset_id, reporter_user_id)
);

-- Index for asset reports
CREATE INDEX idx_ai_asset_reports_asset_id ON ai_asset_reports(asset_id);
CREATE INDEX idx_ai_asset_reports_reporter ON ai_asset_reports(reporter_user_id);
CREATE INDEX idx_ai_asset_reports_status ON ai_asset_reports(status);
CREATE INDEX idx_ai_asset_reports_reason ON ai_asset_reports(reason);
CREATE INDEX idx_ai_asset_reports_pending ON ai_asset_reports(created_at) WHERE status = 'pending';

-- AI Approval Thresholds table (configurable approval settings)
CREATE TABLE IF NOT EXISTS ai_approval_thresholds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- Auto-approval thresholds
    auto_approve_quality_score DECIMAL(3,2) DEFAULT 0.8,
    auto_approve_consistency_score DECIMAL(3,2) DEFAULT 0.75,
    auto_approve_flagged_content_max DECIMAL(3,2) DEFAULT 0.1,
    auto_approve_community_rating_min DECIMAL(3,2) DEFAULT 4.0,
    
    -- Auto-rejection thresholds
    auto_reject_quality_score DECIMAL(3,2) DEFAULT 0.3,
    auto_reject_flagged_content_min DECIMAL(3,2) DEFAULT 0.8,
    auto_reject_technical_issues BOOLEAN DEFAULT true,
    
    -- Manual review triggers
    manual_review_quality_range DECIMAL(3,2)[] DEFAULT '{0.3,0.8}',
    manual_review_flagged_range DECIMAL(3,2)[] DEFAULT '{0.1,0.8}',
    manual_review_community_reports INTEGER DEFAULT 3,
    manual_review_new_users BOOLEAN DEFAULT true,
    
    -- Escalation rules
    escalation_community_reports INTEGER DEFAULT 5,
    escalation_quality_disputes BOOLEAN DEFAULT true,
    escalation_reviewer_disagreement BOOLEAN DEFAULT true,
    
    -- Configuration
    is_active BOOLEAN DEFAULT false,
    applies_to_asset_types TEXT[] DEFAULT '{}',
    applies_to_user_tiers TEXT[] DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for approval thresholds
CREATE INDEX idx_ai_approval_thresholds_active ON ai_approval_thresholds(is_active);
CREATE INDEX idx_ai_approval_thresholds_asset_types ON ai_approval_thresholds USING GIN(applies_to_asset_types);

-- AI Review Analytics table (tracking review performance and trends)
CREATE TABLE IF NOT EXISTS ai_review_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Review volume
    total_submissions INTEGER DEFAULT 0,
    total_reviews_completed INTEGER DEFAULT 0,
    total_approved INTEGER DEFAULT 0,
    total_rejected INTEGER DEFAULT 0,
    total_needs_revision INTEGER DEFAULT 0,
    
    -- Processing metrics
    auto_processed_count INTEGER DEFAULT 0,
    manual_review_count INTEGER DEFAULT 0,
    escalated_count INTEGER DEFAULT 0,
    average_review_time INTEGER DEFAULT 0, -- Minutes
    
    -- Quality metrics
    average_quality_score DECIMAL(3,2) DEFAULT 0,
    average_consistency_score DECIMAL(3,2) DEFAULT 0,
    quality_score_distribution JSONB DEFAULT '{"excellent":0,"good":0,"fair":0,"poor":0}',
    
    -- Content moderation
    flagged_content_count INTEGER DEFAULT 0,
    community_reports_count INTEGER DEFAULT 0,
    content_violations JSONB DEFAULT '{}',
    
    -- Reviewer performance
    active_reviewers INTEGER DEFAULT 0,
    reviewer_workload_distribution JSONB DEFAULT '{}',
    top_reviewers JSONB DEFAULT '[]',
    
    -- Asset type breakdown
    submissions_by_type JSONB DEFAULT '{}',
    approval_rates_by_type JSONB DEFAULT '{}',
    
    -- User tier analysis
    submissions_by_tier JSONB DEFAULT '{}',
    approval_rates_by_tier JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint for daily analytics
    UNIQUE(date)
);

-- Index for review analytics
CREATE INDEX idx_ai_review_analytics_date ON ai_review_analytics(date);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE ai_asset_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_asset_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_approval_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_review_analytics ENABLE ROW LEVEL SECURITY;

-- Asset Reviews policies
CREATE POLICY "Users can view reviews of their own assets" ON ai_asset_reviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reviews for their own assets" ON ai_asset_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Reviewers can view assigned reviews" ON ai_asset_reviews
    FOR SELECT USING (
        auth.uid() = reviewer_user_id OR 
        auth.uid() = user_id OR
        auth.role() = 'service_role'
    );

CREATE POLICY "Reviewers can update assigned reviews" ON ai_asset_reviews
    FOR UPDATE USING (auth.uid() = reviewer_user_id OR auth.role() = 'service_role');

CREATE POLICY "Service role can access all reviews" ON ai_asset_reviews
    FOR ALL USING (auth.role() = 'service_role');

-- Reviewers policies
CREATE POLICY "Reviewers can view their own profile" ON ai_reviewers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Reviewers can update their own profile" ON ai_reviewers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage reviewers" ON ai_reviewers
    FOR ALL USING (auth.role() = 'service_role');

-- Asset Reports policies
CREATE POLICY "Users can view reports they created" ON ai_asset_reports
    FOR SELECT USING (auth.uid() = reporter_user_id);

CREATE POLICY "Users can create asset reports" ON ai_asset_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Asset owners can view reports on their assets" ON ai_asset_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM game_assets 
            WHERE game_assets.id = ai_asset_reports.asset_id 
            AND game_assets.created_by = auth.uid()
        )
    );

CREATE POLICY "Reviewers can view and manage reports" ON ai_asset_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ai_reviewers 
            WHERE ai_reviewers.user_id = auth.uid() 
            AND ai_reviewers.is_active = true
        ) OR auth.role() = 'service_role'
    );

-- Approval Thresholds policies (read-only for most users)
CREATE POLICY "Anyone can view active thresholds" ON ai_approval_thresholds
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage thresholds" ON ai_approval_thresholds
    FOR ALL USING (auth.role() = 'service_role');

-- Review Analytics policies (read-only)
CREATE POLICY "Anyone can view review analytics" ON ai_review_analytics
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage analytics" ON ai_review_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_ai_asset_reviews_updated_at 
    BEFORE UPDATE ON ai_asset_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_reviewers_updated_at 
    BEFORE UPDATE ON ai_reviewers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_approval_thresholds_updated_at 
    BEFORE UPDATE ON ai_approval_thresholds 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_review_analytics_updated_at 
    BEFORE UPDATE ON ai_review_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update review analytics
CREATE OR REPLACE FUNCTION update_review_analytics()
RETURNS VOID AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    submissions_count INTEGER;
    completed_count INTEGER;
    approved_count INTEGER;
    rejected_count INTEGER;
    revision_count INTEGER;
    auto_count INTEGER;
    manual_count INTEGER;
    escalated_count INTEGER;
BEGIN
    -- Count submissions for today
    SELECT COUNT(*) INTO submissions_count
    FROM ai_asset_reviews 
    WHERE DATE(submitted_at) = current_date;
    
    -- Count completed reviews for today
    SELECT COUNT(*) INTO completed_count
    FROM ai_asset_reviews 
    WHERE DATE(processed_at) = current_date;
    
    -- Count by status for today
    SELECT COUNT(*) INTO approved_count
    FROM ai_asset_reviews 
    WHERE status = 'approved' AND DATE(processed_at) = current_date;
    
    SELECT COUNT(*) INTO rejected_count
    FROM ai_asset_reviews 
    WHERE status = 'rejected' AND DATE(processed_at) = current_date;
    
    SELECT COUNT(*) INTO revision_count
    FROM ai_asset_reviews 
    WHERE status = 'needs_revision' AND DATE(processed_at) = current_date;
    
    -- Count processing types for today
    SELECT COUNT(*) INTO auto_count
    FROM ai_asset_reviews 
    WHERE auto_processed = true AND DATE(processed_at) = current_date;
    
    SELECT COUNT(*) INTO manual_count
    FROM ai_asset_reviews 
    WHERE requires_manual_review = true AND DATE(processed_at) = current_date;
    
    SELECT COUNT(*) INTO escalated_count
    FROM ai_asset_reviews 
    WHERE status = 'escalated' AND DATE(processed_at) = current_date;
    
    -- Upsert analytics record
    INSERT INTO ai_review_analytics (
        date,
        total_submissions,
        total_reviews_completed,
        total_approved,
        total_rejected,
        total_needs_revision,
        auto_processed_count,
        manual_review_count,
        escalated_count
    ) VALUES (
        current_date,
        submissions_count,
        completed_count,
        approved_count,
        rejected_count,
        revision_count,
        auto_count,
        manual_count,
        escalated_count
    )
    ON CONFLICT (date) 
    DO UPDATE SET
        total_submissions = EXCLUDED.total_submissions,
        total_reviews_completed = EXCLUDED.total_reviews_completed,
        total_approved = EXCLUDED.total_approved,
        total_rejected = EXCLUDED.total_rejected,
        total_needs_revision = EXCLUDED.total_needs_revision,
        auto_processed_count = EXCLUDED.auto_processed_count,
        manual_review_count = EXCLUDED.manual_review_count,
        escalated_count = EXCLUDED.escalated_count,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign review to best available reviewer
CREATE OR REPLACE FUNCTION assign_review_to_reviewer(
    p_review_id UUID,
    p_asset_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    selected_reviewer_id UUID;
BEGIN
    -- Find the best reviewer based on specialization, workload, and availability
    SELECT user_id INTO selected_reviewer_id
    FROM ai_reviewers
    WHERE is_active = true
    AND workload < max_concurrent_reviews
    AND (p_asset_type IS NULL OR p_asset_type = ANY(specializations))
    ORDER BY 
        -- Prioritize specialists
        CASE WHEN p_asset_type = ANY(specializations) THEN 0 ELSE 1 END,
        -- Then by lowest workload
        workload ASC,
        -- Then by review quality
        review_quality_score DESC
    LIMIT 1;
    
    IF selected_reviewer_id IS NULL THEN
        -- No specialized reviewers available, find any available reviewer
        SELECT user_id INTO selected_reviewer_id
        FROM ai_reviewers
        WHERE is_active = true
        AND workload < max_concurrent_reviews
        ORDER BY workload ASC, review_quality_score DESC
        LIMIT 1;
    END IF;
    
    IF selected_reviewer_id IS NOT NULL THEN
        -- Assign the review
        UPDATE ai_asset_reviews 
        SET reviewer_user_id = selected_reviewer_id
        WHERE id = p_review_id;
        
        -- Update reviewer workload
        UPDATE ai_reviewers 
        SET workload = workload + 1
        WHERE user_id = selected_reviewer_id;
    END IF;
    
    RETURN selected_reviewer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed default approval thresholds
INSERT INTO ai_approval_thresholds (
    name, 
    description, 
    is_active,
    applies_to_asset_types,
    applies_to_user_tiers
) VALUES (
    'default_thresholds',
    'Default approval thresholds for all asset types and user tiers',
    true,
    '{"sprite", "background", "tile", "ui", "tileset"}',
    '{"free", "pro", "max", "educational"}'
),
(
    'strict_thresholds',
    'Strict approval thresholds for high-quality requirements',
    false,
    '{"sprite", "background", "tile", "ui", "tileset"}',
    '{"max"}',
    0.9, -- auto_approve_quality_score
    0.85, -- auto_approve_consistency_score
    0.05, -- auto_approve_flagged_content_max
    4.5, -- auto_approve_community_rating_min
    0.5, -- auto_reject_quality_score
    0.6 -- auto_reject_flagged_content_min
);

-- Create initial analytics record for today
INSERT INTO ai_review_analytics (date) VALUES (CURRENT_DATE) ON CONFLICT (date) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON ai_asset_reviews TO service_role;
GRANT ALL ON ai_reviewers TO service_role;
GRANT ALL ON ai_asset_reports TO service_role;
GRANT ALL ON ai_approval_thresholds TO service_role;
GRANT ALL ON ai_review_analytics TO service_role;

GRANT SELECT, INSERT, UPDATE ON ai_asset_reviews TO authenticated;
GRANT SELECT, UPDATE ON ai_reviewers TO authenticated;
GRANT SELECT, INSERT ON ai_asset_reports TO authenticated;
GRANT SELECT ON ai_approval_thresholds TO authenticated;
GRANT SELECT ON ai_review_analytics TO authenticated;

-- Comments for documentation
COMMENT ON TABLE ai_asset_reviews IS 'Asset review and approval workflow tracking with quality and content moderation';
COMMENT ON TABLE ai_reviewers IS 'Reviewer management with specializations, workload tracking, and performance metrics';
COMMENT ON TABLE ai_asset_reports IS 'Community reports and flagging system for asset content moderation';
COMMENT ON TABLE ai_approval_thresholds IS 'Configurable approval thresholds and rules for different asset types and user tiers';
COMMENT ON TABLE ai_review_analytics IS 'Analytics and performance tracking for the review and approval workflow';