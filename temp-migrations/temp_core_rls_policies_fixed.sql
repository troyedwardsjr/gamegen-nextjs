-- Migration: Create RLS Policies for Core Tables (Schema-Corrected)
-- Description: Address security advisor findings by creating comprehensive RLS policies for all core tables
-- Date: 2025-09-09

-- =======================
-- PROFILES TABLE POLICIES
-- =======================
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
ON profiles FOR DELETE
USING (auth.uid() = id);

-- =======================
-- USER SESSIONS POLICIES
-- =======================
CREATE POLICY "Users can view their own sessions"
ON user_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
ON user_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON user_sessions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON user_sessions FOR DELETE
USING (auth.uid() = user_id);

-- =======================
-- GAMES TABLE POLICIES
-- =======================
CREATE POLICY "Users can view public games and their own games"
ON games FOR SELECT
USING (visibility = 'public' OR creator_id = auth.uid());

CREATE POLICY "Users can create their own games"
ON games FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own games"
ON games FOR UPDATE
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own games"
ON games FOR DELETE
USING (auth.uid() = creator_id);

-- =======================
-- GAME VERSIONS POLICIES
-- =======================
CREATE POLICY "Users can view versions of accessible games"
ON game_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_versions.game_id 
    AND (games.visibility = 'public' OR games.creator_id = auth.uid())
  )
);

CREATE POLICY "Users can create versions for their own games"
ON game_versions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_id 
    AND games.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can update versions of their own games"
ON game_versions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_versions.game_id 
    AND games.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_versions.game_id 
    AND games.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can delete versions of their own games"
ON game_versions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_versions.game_id 
    AND games.creator_id = auth.uid()
  )
);

-- =======================
-- GAME ASSETS POLICIES
-- =======================
CREATE POLICY "Users can view assets of accessible games"
ON game_assets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_assets.game_id 
    AND (games.visibility = 'public' OR games.creator_id = auth.uid())
  )
);

CREATE POLICY "Users can create assets for their own games"
ON game_assets FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_id 
    AND games.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can update assets of their own games"
ON game_assets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_assets.game_id 
    AND games.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_assets.game_id 
    AND games.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can delete assets of their own games"
ON game_assets FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_assets.game_id 
    AND games.creator_id = auth.uid()
  )
);

-- =======================
-- GAME SCRIPTS POLICIES
-- =======================
CREATE POLICY "Users can view scripts of accessible games"
ON game_scripts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_scripts.game_id 
    AND (games.visibility = 'public' OR games.creator_id = auth.uid())
  )
);

CREATE POLICY "Users can create scripts for their own games"
ON game_scripts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_id 
    AND games.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can update scripts of their own games"
ON game_scripts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_scripts.game_id 
    AND games.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_scripts.game_id 
    AND games.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can delete scripts of their own games"
ON game_scripts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_scripts.game_id 
    AND games.creator_id = auth.uid()
  )
);

-- =======================
-- SCRIPT VERSIONS POLICIES
-- =======================
CREATE POLICY "Users can view script versions of accessible games"
ON script_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM game_scripts gs
    JOIN games g ON g.id = gs.game_id
    WHERE gs.id = script_versions.script_id 
    AND (g.visibility = 'public' OR g.creator_id = auth.uid())
  )
);

CREATE POLICY "Users can create script versions for their own games"
ON script_versions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM game_scripts gs
    JOIN games g ON g.id = gs.game_id
    WHERE gs.id = script_id 
    AND g.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can update script versions of their own games"
ON script_versions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM game_scripts gs
    JOIN games g ON g.id = gs.game_id
    WHERE gs.id = script_versions.script_id 
    AND g.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM game_scripts gs
    JOIN games g ON g.id = gs.game_id
    WHERE gs.id = script_versions.script_id 
    AND g.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can delete script versions of their own games"
ON script_versions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM game_scripts gs
    JOIN games g ON g.id = gs.game_id
    WHERE gs.id = script_versions.script_id 
    AND g.creator_id = auth.uid()
  )
);

-- =======================
-- SCRIPT EXECUTION LOGS POLICIES
-- =======================
CREATE POLICY "Users can view execution logs of their own games"
ON script_execution_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM game_scripts gs
    JOIN games g ON g.id = gs.game_id
    WHERE gs.id = script_execution_logs.script_id 
    AND g.creator_id = auth.uid()
  )
);

CREATE POLICY "System can create execution logs"
ON script_execution_logs FOR INSERT
WITH CHECK (true); -- Allow system to create logs

-- =======================
-- COLLABORATION SESSIONS POLICIES
-- =======================
CREATE POLICY "Users can view collaboration sessions for their games"
ON collaboration_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = collaboration_sessions.game_id 
    AND games.creator_id = auth.uid()
  ) OR
  auth.uid() = ANY(collaboration_sessions.participants)
);

CREATE POLICY "Users can create collaboration sessions for their games"
ON collaboration_sessions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_id 
    AND games.creator_id = auth.uid()
  ) AND
  auth.uid() = created_by
);

CREATE POLICY "Users can update collaboration sessions they created"
ON collaboration_sessions FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete collaboration sessions they created"
ON collaboration_sessions FOR DELETE
USING (auth.uid() = created_by);

-- =======================
-- TOXOID PATTERNS POLICIES
-- =======================
CREATE POLICY "Users can view official patterns and their own patterns"
ON toxoid_patterns FOR SELECT
USING (is_official = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own patterns"
ON toxoid_patterns FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own patterns"
ON toxoid_patterns FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own patterns"
ON toxoid_patterns FOR DELETE
USING (auth.uid() = created_by);

-- =======================
-- COMMUNITY ASSETS POLICIES
-- =======================
CREATE POLICY "Users can view approved community assets and their own assets"
ON community_assets FOR SELECT
USING (status = 'approved' OR creator_id = auth.uid());

CREATE POLICY "Users can create community assets"
ON community_assets FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own community assets"
ON community_assets FOR UPDATE
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own community assets"
ON community_assets FOR DELETE
USING (auth.uid() = creator_id);

-- =======================
-- USER FOLLOWS POLICIES
-- =======================
CREATE POLICY "Users can view all follows (public social data)"
ON user_follows FOR SELECT
USING (true);

CREATE POLICY "Users can create their own follows"
ON user_follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
ON user_follows FOR DELETE
USING (auth.uid() = follower_id);

-- =======================
-- GAME LIKES POLICIES
-- =======================
CREATE POLICY "Users can view all game likes (public engagement data)"
ON game_likes FOR SELECT
USING (true);

CREATE POLICY "Users can create their own game likes"
ON game_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own game likes"
ON game_likes FOR DELETE
USING (auth.uid() = user_id);

-- =======================
-- GAME COMMENTS POLICIES
-- =======================
CREATE POLICY "Users can view comments on public games"
ON game_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_comments.game_id 
    AND games.visibility = 'public'
  )
);

CREATE POLICY "Users can create comments on public games"
ON game_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_id 
    AND games.visibility = 'public'
  )
);

CREATE POLICY "Users can update their own comments"
ON game_comments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON game_comments FOR DELETE
USING (auth.uid() = user_id);

-- =======================
-- COLLECTIONS POLICIES
-- =======================
CREATE POLICY "Users can view public collections and their own collections"
ON collections FOR SELECT
USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create their own collections"
ON collections FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own collections"
ON collections FOR UPDATE
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own collections"
ON collections FOR DELETE
USING (auth.uid() = creator_id);

-- =======================
-- COLLECTION GAMES POLICIES
-- =======================
CREATE POLICY "Users can view games in accessible collections"
ON collection_games FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM collections 
    WHERE collections.id = collection_games.collection_id 
    AND (collections.is_public = true OR collections.creator_id = auth.uid())
  )
);

CREATE POLICY "Users can add games to their own collections"
ON collection_games FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM collections 
    WHERE collections.id = collection_id 
    AND collections.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can remove games from their own collections"
ON collection_games FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM collections 
    WHERE collections.id = collection_games.collection_id 
    AND collections.creator_id = auth.uid()
  )
);

-- =======================
-- PLAY SESSIONS POLICIES
-- =======================
CREATE POLICY "Users can view their own play sessions"
ON play_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create play sessions"
ON play_sessions FOR INSERT
WITH CHECK (true); -- Allow system to track gameplay

-- =======================
-- CREATOR ANALYTICS POLICIES
-- =======================
CREATE POLICY "Users can view analytics for their own games"
ON creator_analytics FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "System can create creator analytics"
ON creator_analytics FOR INSERT
WITH CHECK (true); -- Allow system to generate analytics

-- =======================
-- AI GENERATIONS POLICIES
-- =======================
CREATE POLICY "Users can view their own AI generations"
ON ai_generations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI generations"
ON ai_generations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =======================
-- TEMPLATES POLICIES
-- =======================
CREATE POLICY "Users can view available templates"
ON templates FOR SELECT
USING (is_active = true);

-- =======================
-- PURCHASES POLICIES
-- =======================
CREATE POLICY "Users can view their own purchases"
ON purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create purchase records"
ON purchases FOR INSERT
WITH CHECK (true); -- Allow system to create purchase records

-- =======================
-- CREATOR EARNINGS POLICIES
-- =======================
CREATE POLICY "Users can view their own earnings"
ON creator_earnings FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "System can create earning records"
ON creator_earnings FOR INSERT
WITH CHECK (true); -- Allow system to track earnings

-- =======================
-- VECTOR EMBEDDINGS POLICIES (READ-ONLY FOR USERS)
-- =======================
CREATE POLICY "Users can view game embeddings for search"
ON game_embeddings FOR SELECT
USING (true);

CREATE POLICY "Users can view user embeddings for recommendations"
ON user_embeddings FOR SELECT
USING (auth.uid() = user_id OR true); -- Allow for recommendation system

CREATE POLICY "Users can view asset embeddings for search"
ON asset_embeddings FOR SELECT
USING (true);

CREATE POLICY "Users can view script embeddings for search"
ON script_embeddings FOR SELECT
USING (true);

-- Comments for documentation
COMMENT ON POLICY "Users can view their own profile" ON profiles IS 'Users can access their own profile data';
COMMENT ON POLICY "Users can view public games and their own games" ON games IS 'Users can view public games and their own private games using visibility column';
COMMENT ON POLICY "Users can view official patterns and their own patterns" ON toxoid_patterns IS 'Toxoid patterns can be official or private to creator';
COMMENT ON POLICY "Users can view approved community assets and their own assets" ON community_assets IS 'Community assets must be approved to be visible to others';