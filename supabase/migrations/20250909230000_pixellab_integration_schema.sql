-- Migration: PixelLab Integration Schema
-- Description: Add PixelLab AI generation support with tracking, animation keyframes, and style references
-- Date: 2025-09-09

-- Add PixelLab columns to existing game_assets table
ALTER TABLE game_assets ADD COLUMN pixellab_model VARCHAR(50) CHECK (pixellab_model IN ('pixflux', 'bitforge', 'animate-skeleton', 'animate-text'));
ALTER TABLE game_assets ADD COLUMN pixellab_config JSONB DEFAULT '{}';
ALTER TABLE game_assets ADD COLUMN seed INTEGER;
ALTER TABLE game_assets ADD COLUMN credits_used DECIMAL(10,2) DEFAULT 0 CHECK (credits_used >= 0);

-- Create index for PixelLab model filtering
CREATE INDEX idx_game_assets_pixellab_model ON game_assets(pixellab_model) WHERE pixellab_model IS NOT NULL;

-- PixelLab generation history table
CREATE TABLE pixellab_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    game_asset_id UUID REFERENCES game_assets(id) ON DELETE CASCADE,
    
    -- Generation metadata
    model_used VARCHAR(50) NOT NULL CHECK (model_used IN ('pixflux', 'bitforge', 'animate-skeleton', 'animate-text')),
    generation_config JSONB NOT NULL DEFAULT '{}',
    input_prompt TEXT NOT NULL CHECK (length(input_prompt) >= 1),
    seed_used INTEGER,
    
    -- Cost tracking
    credits_consumed DECIMAL(10,2) NOT NULL CHECK (credits_consumed >= 0),
    
    -- Performance tracking
    generation_time_ms INTEGER CHECK (generation_time_ms > 0),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PixelLab animation keyframes for skeleton-based animations
CREATE TABLE pixellab_animation_keyframes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_id UUID REFERENCES pixellab_generations(id) ON DELETE CASCADE NOT NULL,
    
    -- Frame data
    frame_number INTEGER NOT NULL CHECK (frame_number >= 0),
    keypoints JSONB NOT NULL, -- Array of {x, y} coordinates for skeleton joints
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure frame numbers are unique per generation
    UNIQUE(generation_id, frame_number)
);

-- PixelLab style references for reusable style configurations
CREATE TABLE pixellab_style_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Style metadata
    name VARCHAR(100) NOT NULL CHECK (length(name) >= 1),
    style_image_url TEXT,
    style_config JSONB NOT NULL DEFAULT '{}',
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_pixellab_generations_user_id ON pixellab_generations(user_id);
CREATE INDEX idx_pixellab_generations_model ON pixellab_generations(model_used);
CREATE INDEX idx_pixellab_generations_created_at ON pixellab_generations(created_at DESC);
CREATE INDEX idx_pixellab_generations_game_asset_id ON pixellab_generations(game_asset_id) WHERE game_asset_id IS NOT NULL;

CREATE INDEX idx_pixellab_keyframes_generation_id ON pixellab_animation_keyframes(generation_id);
CREATE INDEX idx_pixellab_keyframes_frame_number ON pixellab_animation_keyframes(generation_id, frame_number);

CREATE INDEX idx_pixellab_style_references_user_id ON pixellab_style_references(user_id);
CREATE INDEX idx_pixellab_style_references_usage_count ON pixellab_style_references(usage_count DESC);

-- Enable Row Level Security
ALTER TABLE pixellab_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixellab_animation_keyframes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixellab_style_references ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pixellab_generations
-- Users can read their own generations
CREATE POLICY "Users can read their own PixelLab generations" ON pixellab_generations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own generations
CREATE POLICY "Users can create their own PixelLab generations" ON pixellab_generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own generations (for updating game_asset_id after creation)
CREATE POLICY "Users can update their own PixelLab generations" ON pixellab_generations
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can delete their own generations
CREATE POLICY "Users can delete their own PixelLab generations" ON pixellab_generations
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for pixellab_animation_keyframes
-- Users can read keyframes for their own generations
CREATE POLICY "Users can read their own animation keyframes" ON pixellab_animation_keyframes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pixellab_generations pg 
            WHERE pg.id = generation_id AND pg.user_id = auth.uid()
        )
    );

-- Users can create keyframes for their own generations
CREATE POLICY "Users can create animation keyframes for own generations" ON pixellab_animation_keyframes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pixellab_generations pg 
            WHERE pg.id = generation_id AND pg.user_id = auth.uid()
        )
    );

-- Users can update keyframes for their own generations
CREATE POLICY "Users can update their own animation keyframes" ON pixellab_animation_keyframes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pixellab_generations pg 
            WHERE pg.id = generation_id AND pg.user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM pixellab_generations pg 
            WHERE pg.id = generation_id AND pg.user_id = auth.uid()
        )
    );

-- Users can delete keyframes for their own generations
CREATE POLICY "Users can delete their own animation keyframes" ON pixellab_animation_keyframes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM pixellab_generations pg 
            WHERE pg.id = generation_id AND pg.user_id = auth.uid()
        )
    );

-- RLS Policies for pixellab_style_references
-- Users can read their own style references
CREATE POLICY "Users can read their own PixelLab style references" ON pixellab_style_references
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own style references
CREATE POLICY "Users can create their own PixelLab style references" ON pixellab_style_references
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own style references
CREATE POLICY "Users can update their own PixelLab style references" ON pixellab_style_references
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can delete their own style references
CREATE POLICY "Users can delete their own PixelLab style references" ON pixellab_style_references
    FOR DELETE USING (auth.uid() = user_id);

-- Create triggers to update usage counts
CREATE OR REPLACE FUNCTION increment_style_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment usage count when a style reference is used in a generation
    IF NEW.generation_config ? 'style_reference_id' THEN
        UPDATE pixellab_style_references 
        SET usage_count = usage_count + 1 
        WHERE id = (NEW.generation_config->>'style_reference_id')::UUID;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_style_usage
    AFTER INSERT ON pixellab_generations
    FOR EACH ROW
    EXECUTE FUNCTION increment_style_usage();

-- Create function to clean up old generation data (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_pixellab_data(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete old generations and their associated keyframes
    WITH deleted_generations AS (
        DELETE FROM pixellab_generations 
        WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted_generations;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pixellab_generations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pixellab_animation_keyframes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pixellab_style_references TO authenticated;

-- Comments for documentation
COMMENT ON TABLE pixellab_generations IS 'Tracks all PixelLab AI generation requests with metadata, costs, and performance metrics';
COMMENT ON TABLE pixellab_animation_keyframes IS 'Stores skeleton keyframe data for animate-skeleton model generations';
COMMENT ON TABLE pixellab_style_references IS 'User-defined style configurations for reusable PixelLab generations';

COMMENT ON COLUMN game_assets.pixellab_model IS 'PixelLab model used for generation: pixflux, bitforge, animate-skeleton, animate-text';
COMMENT ON COLUMN game_assets.pixellab_config IS 'Full PixelLab generation configuration used to create this asset';
COMMENT ON COLUMN game_assets.seed IS 'Seed value for reproducible generation';
COMMENT ON COLUMN game_assets.credits_used IS 'Number of credits consumed to generate this asset';

COMMENT ON COLUMN pixellab_generations.model_used IS 'PixelLab model: pixflux (general), bitforge (style-guided), animate-skeleton (4 frames), animate-text (2-20 frames)';
COMMENT ON COLUMN pixellab_generations.generation_config IS 'Complete generation parameters: style, guidance_scale, negative_prompt, etc.';
COMMENT ON COLUMN pixellab_generations.input_prompt IS 'Text prompt used for generation';
COMMENT ON COLUMN pixellab_generations.seed_used IS 'Seed value for reproducible results';
COMMENT ON COLUMN pixellab_generations.credits_consumed IS 'Actual credits charged for this generation';
COMMENT ON COLUMN pixellab_generations.generation_time_ms IS 'Time taken for generation in milliseconds';

COMMENT ON COLUMN pixellab_animation_keyframes.frame_number IS 'Frame index in animation sequence (0-based)';
COMMENT ON COLUMN pixellab_animation_keyframes.keypoints IS 'Array of {x, y} coordinate objects for skeleton joints';

COMMENT ON COLUMN pixellab_style_references.style_image_url IS 'URL to reference image for bitforge model style guidance';
COMMENT ON COLUMN pixellab_style_references.style_config IS 'Style parameters: guidance_scale, style_weight, etc.';
COMMENT ON COLUMN pixellab_style_references.usage_count IS 'Number of times this style has been used in generations';