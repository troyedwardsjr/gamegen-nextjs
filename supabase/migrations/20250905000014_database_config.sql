-- Migration: Database Configuration
-- Description: Final database configuration, additional constraints, and comments
-- Date: 2025-09-05

-- Add table comments for documentation
COMMENT ON TABLE profiles IS 'User profiles with subscription and preference management';
COMMENT ON TABLE user_sessions IS 'User activity tracking for analytics';
COMMENT ON TABLE games IS 'Main games table with versioning and collaboration support';
COMMENT ON TABLE game_versions IS 'Version history for games to support collaboration';
COMMENT ON TABLE collaboration_sessions IS 'Real-time collaboration sessions';
COMMENT ON TABLE game_assets IS 'Game assets (sprites, audio, etc.)';
COMMENT ON TABLE game_scripts IS 'JavaScript scripts for Toxoid engine execution';
COMMENT ON TABLE script_execution_logs IS 'Execution history and performance metrics';
COMMENT ON TABLE script_versions IS 'Version history for scripts';
COMMENT ON TABLE community_assets IS 'Community-contributed assets library';
COMMENT ON TABLE user_follows IS 'Social follow relationships';
COMMENT ON TABLE game_likes IS 'Game likes/favorites';
COMMENT ON TABLE game_comments IS 'Comments on games';
COMMENT ON TABLE collections IS 'User-created game collections';
COMMENT ON TABLE collection_games IS 'Games within collections';
COMMENT ON TABLE play_sessions IS 'Game play session tracking';
COMMENT ON TABLE creator_analytics IS 'Daily analytics for creators';
COMMENT ON TABLE ai_generations IS 'AI generation request tracking';
COMMENT ON TABLE templates IS 'Marketplace templates';
COMMENT ON TABLE purchases IS 'Purchase transactions';
COMMENT ON TABLE creator_earnings IS 'Creator revenue tracking';
COMMENT ON TABLE game_embeddings IS 'Vector embeddings for game similarity';
COMMENT ON TABLE user_embeddings IS 'User preference embeddings';
COMMENT ON TABLE asset_embeddings IS 'Asset similarity embeddings';
COMMENT ON TABLE script_embeddings IS 'Script code embeddings for RAG';
COMMENT ON TABLE toxoid_patterns IS 'Toxoid API pattern knowledge base';

-- Add column comments for key fields
COMMENT ON COLUMN profiles.subscription_tier IS 'free, pro, max, or educational';
COMMENT ON COLUMN profiles.credits_remaining IS 'Available credits for AI generation';
COMMENT ON COLUMN profiles.preferences IS 'JSON user preferences for UI and AI';
COMMENT ON COLUMN games.game_data IS 'Complete game configuration and state';
COMMENT ON COLUMN games.search_vector IS 'Full-text search vector (auto-generated)';
COMMENT ON COLUMN game_scripts.toxoid_metadata IS 'Toxoid engine-specific metadata and analysis';
COMMENT ON COLUMN game_scripts.validation_status IS 'Script validation state: pending, valid, invalid, warning';
COMMENT ON COLUMN script_execution_logs.execution_context IS 'Game state and context during execution';
COMMENT ON COLUMN toxoid_patterns.pattern_embedding IS 'Vector embedding for similarity search';

-- Set up database configuration for optimal performance
-- Adjust work_mem for vector operations
ALTER SYSTEM SET work_mem = '256MB';

-- Configure maintenance work memory for index builds
ALTER SYSTEM SET maintenance_work_mem = '1GB';

-- Optimize for vector operations
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
ALTER SYSTEM SET max_parallel_maintenance_workers = 4;

-- Set up connection pooling recommendations
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements,auto_explain';

-- Enable query statistics
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET auto_explain.log_min_duration = '1s';

-- Configure checkpoint and WAL settings for write-heavy workloads
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET checkpoint_timeout = '10min';

-- Note: These ALTER SYSTEM commands would need to be applied by a superuser
-- and require a server restart. In Supabase, these are managed by the platform.

-- Create a view for active games with creator information
CREATE VIEW active_games_with_creators AS
SELECT 
    g.id,
    g.title,
    g.description,
    g.genre,
    g.tags,
    g.visibility,
    g.play_count,
    g.like_count,
    g.created_at,
    g.updated_at,
    p.username as creator_username,
    p.display_name as creator_display_name,
    p.avatar_url as creator_avatar_url
FROM games g
JOIN profiles p ON g.creator_id = p.id
WHERE g.visibility IN ('public', 'educational')
    AND g.published_at IS NOT NULL;

COMMENT ON VIEW active_games_with_creators IS 'Public games with creator information for discovery';

-- Create a view for user stats
CREATE VIEW user_stats AS
SELECT 
    p.id,
    p.username,
    p.display_name,
    COUNT(DISTINCT g.id) as games_created,
    COUNT(DISTINCT gl.id) as games_liked,
    COUNT(DISTINCT f1.id) as following_count,
    COUNT(DISTINCT f2.id) as followers_count,
    COALESCE(SUM(g.play_count), 0) as total_plays_received
FROM profiles p
LEFT JOIN games g ON p.id = g.creator_id
LEFT JOIN game_likes gl ON p.id = gl.user_id
LEFT JOIN user_follows f1 ON p.id = f1.follower_id
LEFT JOIN user_follows f2 ON p.id = f2.following_id
GROUP BY p.id, p.username, p.display_name;

COMMENT ON VIEW user_stats IS 'Aggregated user statistics for profiles';

-- Create a materialized view for trending games (refresh periodically)
CREATE MATERIALIZED VIEW trending_games AS
SELECT 
    g.id,
    g.title,
    g.genre,
    g.creator_id,
    g.play_count,
    g.like_count,
    -- Trending score based on recent activity
    (
        COALESCE(recent_plays.play_count_7d, 0) * 2 +
        COALESCE(recent_likes.like_count_7d, 0) * 5 +
        g.play_count * 0.1 +
        g.like_count * 0.5
    ) as trending_score,
    g.updated_at
FROM games g
LEFT JOIN (
    SELECT 
        game_id,
        COUNT(*) as play_count_7d
    FROM play_sessions 
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY game_id
) recent_plays ON g.id = recent_plays.game_id
LEFT JOIN (
    SELECT 
        game_id,
        COUNT(*) as like_count_7d
    FROM game_likes 
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY game_id
) recent_likes ON g.id = recent_likes.game_id
WHERE g.visibility = 'public'
    AND g.published_at IS NOT NULL
ORDER BY trending_score DESC;

CREATE UNIQUE INDEX ON trending_games (id);
CREATE INDEX ON trending_games (trending_score DESC);

COMMENT ON MATERIALIZED VIEW trending_games IS 'Trending games based on recent activity - refresh periodically';

-- Function to refresh trending games (call this periodically via cron)
CREATE OR REPLACE FUNCTION refresh_trending_games()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW trending_games;
END;
$$ LANGUAGE plpgsql;