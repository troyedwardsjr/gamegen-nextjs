-- Migration: Create Database Functions and Triggers
-- Description: Utility functions, auto-update triggers, and business logic
-- Date: 2025-09-05

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON games 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_assets_updated_at 
    BEFORE UPDATE ON game_assets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_scripts_updated_at 
    BEFORE UPDATE ON game_scripts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_assets_updated_at 
    BEFORE UPDATE ON community_assets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_comments_updated_at 
    BEFORE UPDATE ON game_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at 
    BEFORE UPDATE ON collections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at 
    BEFORE UPDATE ON templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_toxoid_patterns_updated_at 
    BEFORE UPDATE ON toxoid_patterns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update game statistics
CREATE OR REPLACE FUNCTION update_game_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'game_likes' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE games SET like_count = like_count + 1 WHERE id = NEW.game_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE games SET like_count = like_count - 1 WHERE id = OLD.game_id;
        END IF;
    END IF;
    
    IF TG_TABLE_NAME = 'play_sessions' AND TG_OP = 'INSERT' THEN
        UPDATE games SET play_count = play_count + 1 WHERE id = NEW.game_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_like_count
    AFTER INSERT OR DELETE ON game_likes
    FOR EACH ROW EXECUTE FUNCTION update_game_stats();

CREATE TRIGGER update_game_play_count
    AFTER INSERT ON play_sessions
    FOR EACH ROW EXECUTE FUNCTION update_game_stats();

-- Update collection game count
CREATE OR REPLACE FUNCTION update_collection_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE collections 
        SET game_count = game_count + 1 
        WHERE id = NEW.collection_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE collections 
        SET game_count = game_count - 1 
        WHERE id = OLD.collection_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collection_game_count
    AFTER INSERT OR DELETE ON collection_games
    FOR EACH ROW EXECUTE FUNCTION update_collection_count();

-- Credit management functions
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS void AS $$
BEGIN
    UPDATE profiles 
    SET credits_used_today = 0, 
        credits_reset_date = CURRENT_DATE
    WHERE credits_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to check and consume credits
CREATE OR REPLACE FUNCTION consume_credits(user_uuid UUID, credits_needed INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    user_credits INTEGER;
    daily_used INTEGER;
    tier_limit INTEGER;
BEGIN
    -- Get user's current credits and daily usage
    SELECT credits_remaining, credits_used_today, subscription_tier
    INTO user_credits, daily_used, tier_limit
    FROM profiles
    WHERE id = user_uuid;
    
    -- Determine daily limit based on subscription tier
    tier_limit := CASE 
        WHEN tier_limit = 'free' THEN 50
        WHEN tier_limit = 'pro' THEN 500
        WHEN tier_limit = 'max' THEN 2000
        WHEN tier_limit = 'educational' THEN 1000
        ELSE 50
    END;
    
    -- Check if user has enough credits and hasn't exceeded daily limit
    IF user_credits >= credits_needed AND (daily_used + credits_needed) <= tier_limit THEN
        UPDATE profiles 
        SET credits_remaining = credits_remaining - credits_needed,
            credits_used_today = credits_used_today + credits_needed
        WHERE id = user_uuid;
        
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update last activity
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles 
    SET last_active_at = NOW() 
    WHERE id = auth.uid();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply activity tracking to key tables
CREATE TRIGGER track_game_activity
    AFTER INSERT OR UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_user_activity();

CREATE TRIGGER track_asset_activity
    AFTER INSERT OR UPDATE ON game_assets
    FOR EACH ROW EXECUTE FUNCTION update_user_activity();

CREATE TRIGGER track_script_activity
    AFTER INSERT OR UPDATE ON game_scripts
    FOR EACH ROW EXECUTE FUNCTION update_user_activity();

-- Function to validate script code
CREATE OR REPLACE FUNCTION validate_script_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Basic validation: check for minimum length
    IF length(NEW.javascript_code) < 10 THEN
        NEW.validation_status := 'invalid';
        NEW.validation_errors := jsonb_build_array('Script code too short');
    ELSE
        NEW.validation_status := 'pending';
        NEW.validation_errors := '[]'::jsonb;
    END IF;
    
    -- Update source hash
    NEW.source_hash := encode(digest(NEW.javascript_code, 'sha256'), 'hex');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_script_on_change
    BEFORE INSERT OR UPDATE ON game_scripts
    FOR EACH ROW EXECUTE FUNCTION validate_script_code();

-- Function to auto-increment version numbers
CREATE OR REPLACE FUNCTION auto_increment_version()
RETURNS TRIGGER AS $$
DECLARE
    max_version INTEGER;
BEGIN
    IF TG_TABLE_NAME = 'game_versions' THEN
        SELECT COALESCE(MAX(version_number), 0) + 1 
        INTO NEW.version_number
        FROM game_versions 
        WHERE game_id = NEW.game_id;
    ELSIF TG_TABLE_NAME = 'script_versions' THEN
        SELECT COALESCE(MAX(version_number), 0) + 1 
        INTO NEW.version_number
        FROM script_versions 
        WHERE script_id = NEW.script_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_increment_game_version
    BEFORE INSERT ON game_versions
    FOR EACH ROW EXECUTE FUNCTION auto_increment_version();

CREATE TRIGGER auto_increment_script_version
    BEFORE INSERT ON script_versions
    FOR EACH ROW EXECUTE FUNCTION auto_increment_version();