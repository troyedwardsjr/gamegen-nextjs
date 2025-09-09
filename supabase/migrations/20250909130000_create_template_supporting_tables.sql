-- Create template supporting tables for Game Templates API Integration
-- Migration: 20250909130000_create_template_supporting_tables

-- Create template categories table
CREATE TABLE IF NOT EXISTS template_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create template usage tracking table
CREATE TABLE IF NOT EXISTS template_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    usage_type TEXT DEFAULT 'create_project' CHECK (usage_type IN ('create_project', 'duplicate', 'preview', 'download')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for common queries
    UNIQUE(template_id, user_id, game_id)
);

-- Create template ratings table  
CREATE TABLE IF NOT EXISTS template_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(template_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_template_categories_active_sort ON template_categories(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_template_usage_template_user ON template_usage(template_id, user_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_created_at ON template_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_template_ratings_template ON template_ratings(template_id);
CREATE INDEX IF NOT EXISTS idx_template_ratings_user ON template_ratings(user_id);

-- Enable RLS on new tables
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies for template categories (read-only for most users)
CREATE POLICY "Template categories are viewable by everyone" ON template_categories
    FOR SELECT USING (is_active = true);

-- RLS policies for template usage (users can only see their own usage)
CREATE POLICY "Users can view own template usage" ON template_usage
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can create template usage records" ON template_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for template ratings (users can view all ratings, edit their own)
CREATE POLICY "Template ratings are viewable by everyone" ON template_ratings
    FOR SELECT USING (true);
    
CREATE POLICY "Users can rate templates" ON template_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can update their own ratings" ON template_ratings
    FOR UPDATE USING (auth.uid() = user_id);

-- Insert default template categories
INSERT INTO template_categories (name, slug, description, sort_order) VALUES
('Official Templates', 'official', 'Curated templates created by the GameGen team', 1),
('Popular Templates', 'popular', 'Most used templates by the community', 2), 
('Beginner Friendly', 'beginner', 'Perfect templates for newcomers to game development', 3),
('Educational', 'educational', 'Templates designed for learning and teaching game development', 4),
('Game Jams', 'game-jams', 'Quick-start templates perfect for game jams and competitions', 5),
('Experimental', 'experimental', 'Cutting-edge templates exploring new game mechanics', 6),
('Community', 'community', 'Templates created and shared by the GameGen community', 7)
ON CONFLICT (slug) DO NOTHING;

-- Add update trigger for template_categories
CREATE TRIGGER update_template_categories_updated_at 
    BEFORE UPDATE ON template_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
-- Add update trigger for template_ratings
CREATE TRIGGER update_template_ratings_updated_at 
    BEFORE UPDATE ON template_ratings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();