-- GameGen Platform Row Level Security Policies
-- Migration: 20250905000002_enable_rls_policies
-- Description: Enable RLS and create comprehensive security policies for all tables

-- Enable RLS on all tables
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE toxoid_patterns ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
-- =============================================================================

-- Public profiles are viewable by everyone
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User Sessions Policies
-- =============================================================================

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Games Policies
-- =============================================================================

-- Public and educational games are viewable by everyone
CREATE POLICY "Public games are viewable by everyone" ON games
    FOR SELECT USING (visibility IN ('public', 'educational'));

-- Users can view their own games regardless of visibility
CREATE POLICY "Users can view their own games" ON games
    FOR SELECT USING (auth.uid() = creator_id);

-- Users can modify their own games
CREATE POLICY "Users can create games" ON games
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own games" ON games
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own games" ON games
    FOR DELETE USING (auth.uid() = creator_id);

-- Collaboration participants can view shared games
CREATE POLICY "Collaboration participants can access games" ON games
    FOR SELECT USING (
        id IN (
            SELECT game_id FROM collaboration_sessions 
            WHERE participants ? auth.uid()::text
            AND ended_at IS NULL
        )
    );

-- Game Versions Policies
-- =============================================================================

-- Users can view versions of games they can access
CREATE POLICY "Users can view accessible game versions" ON game_versions
    FOR SELECT USING (
        game_id IN (
            SELECT id FROM games 
            WHERE creator_id = auth.uid() 
            OR visibility IN ('public', 'educational')
            OR id IN (
                SELECT game_id FROM collaboration_sessions 
                WHERE participants ? auth.uid()::text
                AND ended_at IS NULL
            )
        )
    );

-- Users can create versions for their own games or collaborative games
CREATE POLICY "Users can create versions for accessible games" ON game_versions
    FOR INSERT WITH CHECK (
        auth.uid() = creator_id 
        AND (
            game_id IN (SELECT id FROM games WHERE creator_id = auth.uid())
            OR 
            game_id IN (
                SELECT game_id FROM collaboration_sessions 
                WHERE participants ? auth.uid()::text
                AND ended_at IS NULL
            )
        )
    );

-- Collaboration Sessions Policies
-- =============================================================================

-- Users can view sessions for games they can access
CREATE POLICY "Users can view accessible collaboration sessions" ON collaboration_sessions
    FOR SELECT USING (
        host_user_id = auth.uid()
        OR participants ? auth.uid()::text
        OR game_id IN (
            SELECT id FROM games 
            WHERE creator_id = auth.uid() 
            OR visibility IN ('public', 'educational')
        )
    );

-- Users can create sessions for their own games
CREATE POLICY "Users can create collaboration sessions for own games" ON collaboration_sessions
    FOR INSERT WITH CHECK (
        auth.uid() = host_user_id
        AND game_id IN (SELECT id FROM games WHERE creator_id = auth.uid())
    );

-- Session hosts can update their sessions
CREATE POLICY "Session hosts can update their sessions" ON collaboration_sessions
    FOR UPDATE USING (auth.uid() = host_user_id);

-- Game Assets Policies
-- =============================================================================

-- Users can view assets for games they can access
CREATE POLICY "Users can view accessible game assets" ON game_assets
    FOR SELECT USING (
        auth.uid() = creator_id 
        OR 
        game_id IN (
            SELECT id FROM games 
            WHERE creator_id = auth.uid() 
            OR visibility IN ('public', 'educational')
            OR id IN (
                SELECT game_id FROM collaboration_sessions 
                WHERE participants ? auth.uid()::text
                AND ended_at IS NULL
            )
        )
    );

-- Users can create assets for games they can access
CREATE POLICY "Users can create assets for accessible games" ON game_assets
    FOR INSERT WITH CHECK (
        auth.uid() = creator_id 
        AND (
            game_id IS NULL -- Global assets
            OR 
            game_id IN (
                SELECT id FROM games 
                WHERE creator_id = auth.uid()
                OR id IN (
                    SELECT game_id FROM collaboration_sessions 
                    WHERE participants ? auth.uid()::text
                    AND ended_at IS NULL
                )
            )
        )
    );

-- Users can update their own assets
CREATE POLICY "Users can update own assets" ON game_assets
    FOR UPDATE USING (auth.uid() = creator_id);

-- Users can delete their own assets
CREATE POLICY "Users can delete own assets" ON game_assets
    FOR DELETE USING (auth.uid() = creator_id);

-- Game Scripts Policies
-- =============================================================================

-- Users can view scripts of accessible games
CREATE POLICY "Users can view scripts of accessible games" ON game_scripts
    FOR SELECT USING (
        -- Own scripts
        auth.uid() = creator_id 
        OR 
        -- Scripts of public games
        game_id IN (
            SELECT id FROM games 
            WHERE visibility IN ('public', 'educational')
        )
        OR
        -- Scripts of games in collaboration
        game_id IN (
            SELECT game_id FROM collaboration_sessions 
            WHERE participants ? auth.uid()::text
            AND ended_at IS NULL
        )
    );

-- Users can create scripts for accessible games
CREATE POLICY "Users can create scripts for accessible games" ON game_scripts
    FOR INSERT WITH CHECK (
        auth.uid() = creator_id 
        AND game_id IN (
            SELECT id FROM games 
            WHERE creator_id = auth.uid()
            OR id IN (
                SELECT game_id FROM collaboration_sessions 
                WHERE participants ? auth.uid()::text
                AND ended_at IS NULL
            )
        )
    );

-- Users can modify their own scripts
CREATE POLICY "Users can modify own scripts" ON game_scripts
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete own scripts" ON game_scripts
    FOR DELETE USING (auth.uid() = creator_id);

-- Script Execution Logs Policies
-- =============================================================================

-- Users can view execution logs of accessible scripts
CREATE POLICY "Users can view execution logs of accessible scripts" ON script_execution_logs
    FOR SELECT USING (
        auth.uid() = user_id
        OR 
        script_id IN (
            SELECT id FROM game_scripts 
            WHERE creator_id = auth.uid()
            OR game_id IN (
                SELECT id FROM games 
                WHERE creator_id = auth.uid()
                OR visibility IN ('public', 'educational')
                OR id IN (
                    SELECT game_id FROM collaboration_sessions 
                    WHERE participants ? auth.uid()::text
                    AND ended_at IS NULL
                )
            )
        )
    );

-- System can insert execution logs
CREATE POLICY "System can insert execution logs" ON script_execution_logs
    FOR INSERT WITH CHECK (true);

-- Script Versions Policies
-- =============================================================================

-- Users can view versions of accessible scripts
CREATE POLICY "Users can view accessible script versions" ON script_versions
    FOR SELECT USING (
        auth.uid() = creator_id
        OR 
        script_id IN (
            SELECT id FROM game_scripts 
            WHERE creator_id = auth.uid()
            OR game_id IN (
                SELECT id FROM games 
                WHERE visibility IN ('public', 'educational')
                OR id IN (
                    SELECT game_id FROM collaboration_sessions 
                    WHERE participants ? auth.uid()::text
                    AND ended_at IS NULL
                )
            )
        )
    );

-- Users can create versions for their own scripts
CREATE POLICY "Users can create versions for own scripts" ON script_versions
    FOR INSERT WITH CHECK (
        auth.uid() = creator_id
        AND script_id IN (SELECT id FROM game_scripts WHERE creator_id = auth.uid())
    );

-- Community Assets Policies
-- =============================================================================

-- Approved community assets are viewable by everyone
CREATE POLICY "Approved community assets are viewable" ON community_assets
    FOR SELECT USING (status IN ('approved', 'featured'));

-- Users can view their own community assets
CREATE POLICY "Users can view own community assets" ON community_assets
    FOR SELECT USING (auth.uid() = creator_id);

-- Users can create community assets
CREATE POLICY "Users can create community assets" ON community_assets
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Users can update their own community assets
CREATE POLICY "Users can update own community assets" ON community_assets
    FOR UPDATE USING (auth.uid() = creator_id);

-- Social Features Policies
-- =============================================================================

-- User Follows
CREATE POLICY "Anyone can view user follows" ON user_follows
    FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON user_follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON user_follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Game Likes
CREATE POLICY "Anyone can view game likes" ON game_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like games" ON game_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike games" ON game_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Game Comments
CREATE POLICY "Anyone can view comments on public games" ON game_comments
    FOR SELECT USING (
        game_id IN (
            SELECT id FROM games 
            WHERE visibility IN ('public', 'educational')
            OR creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can comment on public games" ON game_comments
    FOR INSERT WITH CHECK (
        auth.uid() = author_id
        AND game_id IN (
            SELECT id FROM games 
            WHERE visibility IN ('public', 'educational')
        )
    );

CREATE POLICY "Users can update their own comments" ON game_comments
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" ON game_comments
    FOR DELETE USING (auth.uid() = author_id);

-- Collections Policies
-- =============================================================================

-- Public collections are viewable by everyone
CREATE POLICY "Public collections are viewable" ON collections
    FOR SELECT USING (is_public = true);

-- Users can view their own collections
CREATE POLICY "Users can view own collections" ON collections
    FOR SELECT USING (auth.uid() = creator_id);

-- Users can create collections
CREATE POLICY "Users can create collections" ON collections
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Users can update their own collections
CREATE POLICY "Users can update own collections" ON collections
    FOR UPDATE USING (auth.uid() = creator_id);

-- Users can delete their own collections
CREATE POLICY "Users can delete own collections" ON collections
    FOR DELETE USING (auth.uid() = creator_id);

-- Collection Games
CREATE POLICY "Users can view games in accessible collections" ON collection_games
    FOR SELECT USING (
        collection_id IN (
            SELECT id FROM collections 
            WHERE is_public = true 
            OR creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can add games to their collections" ON collection_games
    FOR INSERT WITH CHECK (
        auth.uid() = added_by
        AND collection_id IN (
            SELECT id FROM collections 
            WHERE creator_id = auth.uid() 
            OR is_collaborative = true
        )
    );

CREATE POLICY "Users can remove games from accessible collections" ON collection_games
    FOR DELETE USING (
        auth.uid() = added_by
        OR collection_id IN (
            SELECT id FROM collections WHERE creator_id = auth.uid()
        )
    );

-- Analytics Policies
-- =============================================================================

-- Play Sessions
CREATE POLICY "Users can view play sessions for their games" ON play_sessions
    FOR SELECT USING (
        auth.uid() = player_id
        OR game_id IN (
            SELECT id FROM games WHERE creator_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can create play sessions" ON play_sessions
    FOR INSERT WITH CHECK (true);

-- Creator Analytics
CREATE POLICY "Users can view their own analytics" ON creator_analytics
    FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "System can insert analytics" ON creator_analytics
    FOR INSERT WITH CHECK (true);

-- AI Generations
CREATE POLICY "Users can view their own AI generations" ON ai_generations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI generations" ON ai_generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Marketplace Policies
-- =============================================================================

-- Templates
CREATE POLICY "Approved templates are viewable" ON templates
    FOR SELECT USING (status IN ('approved', 'featured'));

CREATE POLICY "Users can view their own templates" ON templates
    FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Users can create templates" ON templates
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own templates" ON templates
    FOR UPDATE USING (auth.uid() = creator_id);

-- Purchases
CREATE POLICY "Users can view their own purchases" ON purchases
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can create purchases" ON purchases
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Creator Earnings
CREATE POLICY "Users can view their own earnings" ON creator_earnings
    FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "System can insert earnings" ON creator_earnings
    FOR INSERT WITH CHECK (true);

-- Vector Embeddings Policies
-- =============================================================================

-- Game Embeddings
CREATE POLICY "Users can view embeddings for accessible games" ON game_embeddings
    FOR SELECT USING (
        game_id IN (
            SELECT id FROM games 
            WHERE creator_id = auth.uid() 
            OR visibility IN ('public', 'educational')
        )
    );

CREATE POLICY "System can manage game embeddings" ON game_embeddings
    FOR ALL USING (true);

-- User Embeddings
CREATE POLICY "Users can view their own embeddings" ON user_embeddings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage user embeddings" ON user_embeddings
    FOR ALL USING (true);

-- Asset Embeddings
CREATE POLICY "Users can view asset embeddings" ON asset_embeddings
    FOR SELECT USING (true);

CREATE POLICY "System can manage asset embeddings" ON asset_embeddings
    FOR ALL USING (true);

-- Script Embeddings
CREATE POLICY "Users can view script embeddings for accessible scripts" ON script_embeddings
    FOR SELECT USING (
        script_id IN (
            SELECT id FROM game_scripts 
            WHERE creator_id = auth.uid()
            OR game_id IN (
                SELECT id FROM games 
                WHERE visibility IN ('public', 'educational')
            )
        )
    );

CREATE POLICY "System can manage script embeddings" ON script_embeddings
    FOR ALL USING (true);

-- Toxoid Patterns
CREATE POLICY "Everyone can view approved patterns" ON toxoid_patterns
    FOR SELECT USING (is_official = true OR created_by = auth.uid());

CREATE POLICY "Users can create patterns" ON toxoid_patterns
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own patterns" ON toxoid_patterns
    FOR UPDATE USING (auth.uid() = created_by);

-- Migration completed successfully
INSERT INTO public._migration_log (migration_name, executed_at) 
VALUES ('20250905000002_enable_rls_policies', NOW())
ON CONFLICT DO NOTHING;