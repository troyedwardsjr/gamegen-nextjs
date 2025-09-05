-- Migration: Create RLS Policies
-- Description: Row Level Security policies for fine-grained access control
-- Date: 2025-09-05

-- Profiles: Users can read public profiles and modify their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- User sessions: Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Games: Visibility-based access control
CREATE POLICY "Public games are viewable by everyone" ON games
    FOR SELECT USING (visibility = 'public' OR visibility = 'educational');

CREATE POLICY "Users can view their own games" ON games
    FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Users can modify their own games" ON games
    FOR ALL USING (auth.uid() = creator_id);

-- Collaboration: Participants can access shared games
CREATE POLICY "Collaboration participants can access games" ON games
    FOR SELECT USING (
        id IN (
            SELECT game_id FROM collaboration_sessions 
            WHERE participants ? auth.uid()::text
            AND ended_at IS NULL
        )
    );

-- Game versions: Based on game access
CREATE POLICY "Users can view versions of accessible games" ON game_versions
    FOR SELECT USING (
        game_id IN (
            SELECT id FROM games 
            WHERE visibility IN ('public', 'educational')
            OR creator_id = auth.uid()
            OR id IN (
                SELECT game_id FROM collaboration_sessions 
                WHERE participants ? auth.uid()::text
                AND ended_at IS NULL
            )
        )
    );

CREATE POLICY "Users can create versions for their games" ON game_versions
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

-- Collaboration sessions: Host and participants
CREATE POLICY "Users can view collaboration sessions they participate in" ON collaboration_sessions
    FOR SELECT USING (
        host_user_id = auth.uid() 
        OR participants ? auth.uid()::text
    );

CREATE POLICY "Users can create collaboration sessions for their games" ON collaboration_sessions
    FOR INSERT WITH CHECK (
        host_user_id = auth.uid()
        AND game_id IN (
            SELECT id FROM games WHERE creator_id = auth.uid()
        )
    );

-- Assets: Based on game access
CREATE POLICY "Users can view assets of accessible games" ON game_assets
    FOR SELECT USING (
        creator_id = auth.uid() 
        OR game_id IN (
            SELECT id FROM games 
            WHERE visibility IN ('public', 'educational')
            OR creator_id = auth.uid()
            OR id IN (
                SELECT game_id FROM collaboration_sessions 
                WHERE participants ? auth.uid()::text
                AND ended_at IS NULL
            )
        )
    );

CREATE POLICY "Users can modify own assets" ON game_assets
    FOR ALL USING (auth.uid() = creator_id);

-- Scripts: Access based on game ownership and collaboration
CREATE POLICY "Users can view scripts of accessible games" ON game_scripts
    FOR SELECT USING (
        auth.uid() = creator_id 
        OR game_id IN (
            SELECT id FROM games 
            WHERE visibility IN ('public', 'educational')
            OR creator_id = auth.uid()
            OR id IN (
                SELECT game_id FROM collaboration_sessions 
                WHERE participants ? auth.uid()::text
                AND ended_at IS NULL
            )
        )
    );

CREATE POLICY "Users can modify own scripts" ON game_scripts
    FOR ALL USING (auth.uid() = creator_id);

-- Script execution logs: Only for accessible scripts
CREATE POLICY "Users can view execution logs of accessible scripts" ON script_execution_logs
    FOR SELECT USING (
        script_id IN (
            SELECT id FROM game_scripts 
            WHERE creator_id = auth.uid()
            OR game_id IN (
                SELECT id FROM games 
                WHERE visibility IN ('public', 'educational')
                OR creator_id = auth.uid()
                OR id IN (
                    SELECT game_id FROM collaboration_sessions 
                    WHERE participants ? auth.uid()::text
                    AND ended_at IS NULL
                )
            )
        )
    );

CREATE POLICY "Users can insert execution logs for accessible scripts" ON script_execution_logs
    FOR INSERT WITH CHECK (
        script_id IN (
            SELECT id FROM game_scripts 
            WHERE creator_id = auth.uid()
            OR game_id IN (
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

-- Script versions: Based on script access
CREATE POLICY "Users can view script versions of accessible scripts" ON script_versions
    FOR SELECT USING (
        script_id IN (
            SELECT id FROM game_scripts 
            WHERE creator_id = auth.uid()
            OR game_id IN (
                SELECT id FROM games 
                WHERE visibility IN ('public', 'educational')
                OR creator_id = auth.uid()
                OR id IN (
                    SELECT game_id FROM collaboration_sessions 
                    WHERE participants ? auth.uid()::text
                    AND ended_at IS NULL
                )
            )
        )
    );

CREATE POLICY "Users can create script versions for accessible scripts" ON script_versions
    FOR INSERT WITH CHECK (
        auth.uid() = creator_id
        AND script_id IN (
            SELECT id FROM game_scripts 
            WHERE creator_id = auth.uid()
            OR game_id IN (
                SELECT game_id FROM collaboration_sessions 
                WHERE participants ? auth.uid()::text
                AND ended_at IS NULL
            )
        )
    );

-- Community assets: Public approved assets viewable, users manage own
CREATE POLICY "Approved community assets are viewable by everyone" ON community_assets
    FOR SELECT USING (status = 'approved' OR status = 'featured');

CREATE POLICY "Users can view own community assets" ON community_assets
    FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Users can modify own community assets" ON community_assets
    FOR ALL USING (auth.uid() = creator_id);

-- Social features policies
CREATE POLICY "Anyone can view follows" ON user_follows
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" ON user_follows
    FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Anyone can view game likes" ON game_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON game_likes
    FOR ALL USING (auth.uid() = user_id);

-- Comments: Public games can be commented on
CREATE POLICY "Anyone can view comments on public games" ON game_comments
    FOR SELECT USING (
        NOT is_deleted 
        AND game_id IN (
            SELECT id FROM games 
            WHERE visibility IN ('public', 'educational')
        )
    );

CREATE POLICY "Users can view comments on their games" ON game_comments
    FOR SELECT USING (
        game_id IN (
            SELECT id FROM games 
            WHERE creator_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can comment on public games" ON game_comments
    FOR INSERT WITH CHECK (
        game_id IN (
            SELECT id FROM games 
            WHERE visibility IN ('public', 'educational')
        )
        AND auth.uid() = author_id
    );

CREATE POLICY "Users can modify own comments" ON game_comments
    FOR UPDATE USING (auth.uid() = author_id);

-- Collections
CREATE POLICY "Public collections are viewable by everyone" ON collections
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own collections" ON collections
    FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Users can modify own collections" ON collections
    FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users can view games in accessible collections" ON collection_games
    FOR SELECT USING (
        collection_id IN (
            SELECT id FROM collections 
            WHERE is_public = true OR creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can modify games in own collections" ON collection_games
    FOR ALL USING (
        collection_id IN (
            SELECT id FROM collections WHERE creator_id = auth.uid()
        )
    );

-- Analytics: Users can only see their own analytics
CREATE POLICY "Users can view own play sessions" ON play_sessions
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Game creators can view play sessions of their games" ON play_sessions
    FOR SELECT USING (
        game_id IN (
            SELECT id FROM games WHERE creator_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can insert play sessions" ON play_sessions
    FOR INSERT WITH CHECK (
        player_id IS NULL OR auth.uid() = player_id
    );

CREATE POLICY "Users can view own creator analytics" ON creator_analytics
    FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Users can view own AI generations" ON ai_generations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI generations" ON ai_generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Marketplace policies
CREATE POLICY "Approved templates are viewable by everyone" ON templates
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view own templates" ON templates
    FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Users can modify own templates" ON templates
    FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users can view own purchases" ON purchases
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can create own purchases" ON purchases
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can view own earnings" ON creator_earnings
    FOR SELECT USING (auth.uid() = creator_id);

-- Embeddings: Read access for recommendations, system manages writes
CREATE POLICY "Users can view embeddings of accessible games" ON game_embeddings
    FOR SELECT USING (
        game_id IN (
            SELECT id FROM games 
            WHERE visibility IN ('public', 'educational')
            OR creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own user embeddings" ON user_embeddings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view embeddings of accessible assets" ON asset_embeddings
    FOR SELECT USING (true); -- Public for recommendations

CREATE POLICY "Users can view script embeddings of accessible scripts" ON script_embeddings
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

CREATE POLICY "Anyone can view toxoid patterns" ON toxoid_patterns
    FOR SELECT USING (true);

CREATE POLICY "Users can create toxoid patterns" ON toxoid_patterns
    FOR INSERT WITH CHECK (auth.uid() = created_by);