-- Asset Style Management System Tables
-- Tables for style templates, project style profiles, and consistency tracking

-- Asset Style Templates table
CREATE TABLE IF NOT EXISTS asset_style_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    
    -- Style characteristics
    style TEXT NOT NULL CHECK (style IN ('pixel-art', 'retro', '8bit', '16bit', '32bit', 'modern', 'minimalist', 'cartoon', 'realistic', 'abstract')),
    color_palette TEXT[] DEFAULT '{}',
    art_direction TEXT,
    
    -- Generation parameters
    default_prompt_modifiers TEXT[] DEFAULT '{}',
    negative_prompt TEXT,
    preferred_dimensions JSONB DEFAULT '[]', -- Array of {width, height} objects
    
    -- Usage and performance metrics
    usage_count INTEGER DEFAULT 0,
    average_quality DECIMAL(3,2) DEFAULT 0,
    
    -- Permissions and sharing
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    
    -- Categorization
    tags TEXT[] DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_quality CHECK (average_quality >= 0 AND average_quality <= 1),
    CONSTRAINT valid_usage_count CHECK (usage_count >= 0)
);

-- Indexes for performance
CREATE INDEX idx_asset_style_templates_created_by ON asset_style_templates(created_by);
CREATE INDEX idx_asset_style_templates_style ON asset_style_templates(style);
CREATE INDEX idx_asset_style_templates_public ON asset_style_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_asset_style_templates_premium ON asset_style_templates(is_premium) WHERE is_premium = true;
CREATE INDEX idx_asset_style_templates_usage ON asset_style_templates(usage_count DESC);
CREATE INDEX idx_asset_style_templates_tags ON asset_style_templates USING GIN(tags);

-- Project Style Profiles table
CREATE TABLE IF NOT EXISTS project_style_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID UNIQUE, -- Can reference games table if needed
    
    -- Style characteristics extracted from project assets
    dominant_styles TEXT[] DEFAULT '{}',
    color_palette TEXT[] DEFAULT '{}',
    visual_themes TEXT[] DEFAULT '{}',
    
    -- Technical specifications
    technical_specs JSONB DEFAULT '{}', -- Includes preferredDimensions, qualityThreshold, etc.
    
    -- Consistency metrics
    consistency_score DECIMAL(3,2) DEFAULT 0,
    last_consistency_check TIMESTAMPTZ,
    
    -- Asset tracking
    asset_count INTEGER DEFAULT 0,
    last_asset_added TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_consistency_score CHECK (consistency_score >= 0 AND consistency_score <= 1),
    CONSTRAINT valid_asset_count CHECK (asset_count >= 0)
);

-- Indexes for project style profiles
CREATE INDEX idx_project_style_profiles_user_id ON project_style_profiles(user_id);
CREATE INDEX idx_project_style_profiles_project_id ON project_style_profiles(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_project_style_profiles_dominant_styles ON project_style_profiles USING GIN(dominant_styles);
CREATE INDEX idx_project_style_profiles_consistency ON project_style_profiles(consistency_score DESC);

-- Asset Style Analysis table (for tracking style consistency of individual assets)
CREATE TABLE IF NOT EXISTS asset_style_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL, -- References game_assets.id
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID, -- Optional project association
    
    -- Style analysis results
    dominant_colors TEXT[] DEFAULT '{}',
    color_harmony DECIMAL(3,2) DEFAULT 0,
    visual_complexity DECIMAL(3,2) DEFAULT 0,
    pixel_art_score DECIMAL(3,2) DEFAULT 0,
    style_coherence DECIMAL(3,2) DEFAULT 0,
    technical_quality DECIMAL(3,2) DEFAULT 0,
    
    -- Aesthetic categorization
    aesthetic_categories TEXT[] DEFAULT '{}',
    detected_style TEXT,
    confidence_score DECIMAL(3,2) DEFAULT 0,
    
    -- Analysis metadata
    analysis_version TEXT DEFAULT '1.0',
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_scores CHECK (
        color_harmony >= 0 AND color_harmony <= 1 AND
        visual_complexity >= 0 AND visual_complexity <= 1 AND
        pixel_art_score >= 0 AND pixel_art_score <= 1 AND
        style_coherence >= 0 AND style_coherence <= 1 AND
        technical_quality >= 0 AND technical_quality <= 1 AND
        confidence_score >= 0 AND confidence_score <= 1
    )
);

-- Indexes for style analysis
CREATE INDEX idx_asset_style_analysis_asset_id ON asset_style_analysis(asset_id);
CREATE INDEX idx_asset_style_analysis_user_id ON asset_style_analysis(user_id);
CREATE INDEX idx_asset_style_analysis_project_id ON asset_style_analysis(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_asset_style_analysis_style ON asset_style_analysis(detected_style);
CREATE INDEX idx_asset_style_analysis_categories ON asset_style_analysis USING GIN(aesthetic_categories);

-- Style Consistency Reports table (for project-wide consistency tracking)
CREATE TABLE IF NOT EXISTS style_consistency_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Report data
    overall_consistency DECIMAL(3,2) NOT NULL,
    color_consistency DECIMAL(3,2) DEFAULT 0,
    style_coherence DECIMAL(3,2) DEFAULT 0,
    technical_consistency DECIMAL(3,2) DEFAULT 0,
    
    -- Analysis details
    assets_analyzed INTEGER NOT NULL,
    dominant_styles TEXT[] DEFAULT '{}',
    recommended_improvements TEXT[] DEFAULT '{}',
    similar_assets JSONB DEFAULT '[]', -- Array of asset IDs with similarity scores
    
    -- Report metadata
    report_type TEXT DEFAULT 'automated' CHECK (report_type IN ('automated', 'manual', 'scheduled')),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_consistency_scores CHECK (
        overall_consistency >= 0 AND overall_consistency <= 1 AND
        color_consistency >= 0 AND color_consistency <= 1 AND
        style_coherence >= 0 AND style_coherence <= 1 AND
        technical_consistency >= 0 AND technical_consistency <= 1
    ),
    CONSTRAINT valid_assets_analyzed CHECK (assets_analyzed > 0)
);

-- Indexes for consistency reports
CREATE INDEX idx_style_consistency_reports_project_id ON style_consistency_reports(project_id);
CREATE INDEX idx_style_consistency_reports_user_id ON style_consistency_reports(user_id);
CREATE INDEX idx_style_consistency_reports_consistency ON style_consistency_reports(overall_consistency DESC);
CREATE INDEX idx_style_consistency_reports_generated_at ON style_consistency_reports(generated_at DESC);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE asset_style_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_style_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_style_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_consistency_reports ENABLE ROW LEVEL SECURITY;

-- Style Templates policies
CREATE POLICY "Users can view their own style templates" ON asset_style_templates
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can view public style templates" ON asset_style_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own style templates" ON asset_style_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own style templates" ON asset_style_templates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own style templates" ON asset_style_templates
    FOR DELETE USING (auth.uid() = created_by);

-- Project Style Profiles policies
CREATE POLICY "Users can view their own project style profiles" ON project_style_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own project style profiles" ON project_style_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project style profiles" ON project_style_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project style profiles" ON project_style_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Asset Style Analysis policies
CREATE POLICY "Users can view analysis for their own assets" ON asset_style_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create analysis for their own assets" ON asset_style_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Style Consistency Reports policies
CREATE POLICY "Users can view their own consistency reports" ON style_consistency_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consistency reports" ON style_consistency_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role policies (for automated processing)
CREATE POLICY "Service role can manage all style data" ON asset_style_templates
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all project profiles" ON project_style_profiles
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all style analysis" ON asset_style_analysis
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all consistency reports" ON style_consistency_reports
    FOR ALL USING (auth.role() = 'service_role');

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_asset_style_templates_updated_at 
    BEFORE UPDATE ON asset_style_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_style_profiles_updated_at 
    BEFORE UPDATE ON project_style_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_style_analysis_updated_at 
    BEFORE UPDATE ON asset_style_analysis 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update project style profile when new analysis is added
CREATE OR REPLACE FUNCTION update_project_style_profile_on_analysis()
RETURNS TRIGGER AS $$
BEGIN
    -- Update project style profile asset count and last asset date
    IF NEW.project_id IS NOT NULL THEN
        INSERT INTO project_style_profiles (user_id, project_id, asset_count, last_asset_added)
        VALUES (NEW.user_id, NEW.project_id, 1, NEW.created_at)
        ON CONFLICT (project_id)
        DO UPDATE SET
            asset_count = project_style_profiles.asset_count + 1,
            last_asset_added = NEW.created_at,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_style_profile
    AFTER INSERT ON asset_style_analysis
    FOR EACH ROW EXECUTE FUNCTION update_project_style_profile_on_analysis();

-- Function to calculate and update consistency scores
CREATE OR REPLACE FUNCTION calculate_project_consistency_score(p_project_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    avg_color_harmony DECIMAL(3,2);
    avg_style_coherence DECIMAL(3,2);
    avg_technical_quality DECIMAL(3,2);
    overall_score DECIMAL(3,2);
BEGIN
    -- Calculate average scores from analyses
    SELECT 
        COALESCE(AVG(color_harmony), 0),
        COALESCE(AVG(style_coherence), 0),
        COALESCE(AVG(technical_quality), 0)
    INTO avg_color_harmony, avg_style_coherence, avg_technical_quality
    FROM asset_style_analysis
    WHERE project_id = p_project_id;
    
    -- Calculate overall consistency score
    overall_score := (avg_color_harmony + avg_style_coherence + avg_technical_quality) / 3.0;
    
    -- Update project style profile
    UPDATE project_style_profiles
    SET 
        consistency_score = overall_score,
        last_consistency_check = NOW(),
        updated_at = NOW()
    WHERE project_id = p_project_id;
    
    RETURN overall_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed some default style templates
INSERT INTO asset_style_templates (
    name,
    description,
    style,
    color_palette,
    art_direction,
    default_prompt_modifiers,
    negative_prompt,
    preferred_dimensions,
    created_by,
    is_public
) VALUES 
    (
        'Classic Pixel Art',
        'Traditional pixel art style with limited color palette and sharp edges',
        'pixel-art',
        ARRAY['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
        'Classic pixel art with crisp, clean pixels and no anti-aliasing',
        ARRAY['pixel perfect', 'no blur', 'sharp edges', 'limited colors'],
        'blurry, anti-aliasing, gradient, smooth',
        '[{"width": 32, "height": 32}, {"width": 64, "height": 64}, {"width": 128, "height": 128}]',
        (SELECT id FROM profiles WHERE email = 'system@gamegen.ai' LIMIT 1),
        true
    ),
    (
        '8-bit Retro Gaming',
        'Authentic 8-bit gaming style inspired by classic consoles',
        '8bit',
        ARRAY['#0F0F0F', '#FFFFFF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'],
        'Retro 8-bit gaming aesthetic with nostalgic feel',
        ARRAY['8-bit style', 'retro gaming', 'classic console', 'nostalgic'],
        'modern, high resolution, realistic, photographic',
        '[{"width": 16, "height": 16}, {"width": 32, "height": 32}, {"width": 64, "height": 64}]',
        (SELECT id FROM profiles WHERE email = 'system@gamegen.ai' LIMIT 1),
        true
    ),
    (
        'Modern Minimalist',
        'Clean, modern design with minimal color palettes',
        'minimalist',
        ARRAY['#2C3E50', '#ECF0F1', '#3498DB', '#E74C3C', '#2ECC71'],
        'Clean, minimalist design with focus on simplicity',
        ARRAY['minimalist', 'clean', 'simple', 'modern'],
        'cluttered, complex, ornate, detailed textures',
        '[{"width": 256, "height": 256}, {"width": 512, "height": 512}]',
        (SELECT id FROM profiles WHERE email = 'system@gamegen.ai' LIMIT 1),
        true
    )
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON asset_style_templates TO service_role;
GRANT ALL ON project_style_profiles TO service_role;
GRANT ALL ON asset_style_analysis TO service_role;
GRANT ALL ON style_consistency_reports TO service_role;

GRANT SELECT, INSERT, UPDATE ON asset_style_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_style_profiles TO authenticated;
GRANT SELECT, INSERT ON asset_style_analysis TO authenticated;
GRANT SELECT, INSERT ON style_consistency_reports TO authenticated;

-- Comments for documentation
COMMENT ON TABLE asset_style_templates IS 'Reusable style templates for consistent asset generation';
COMMENT ON TABLE project_style_profiles IS 'Style profiles extracted from project assets for consistency';
COMMENT ON TABLE asset_style_analysis IS 'Individual asset style analysis results';
COMMENT ON TABLE style_consistency_reports IS 'Project-wide style consistency reports and recommendations';