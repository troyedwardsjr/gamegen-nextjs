-- Migration: Create Working RLS Policies (Column Names Verified)
-- Description: RLS policies with verified column names from database schema
-- Date: 2025-09-09

-- =======================
-- PROFILES TABLE POLICIES
-- =======================
CREATE POLICY "Users can manage their own profile"
ON profiles FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- =======================
-- USER SESSIONS POLICIES  
-- =======================
CREATE POLICY "Users can manage their own sessions"
ON user_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =======================
-- GAMES TABLE POLICIES
-- =======================
CREATE POLICY "Users can view public games"
ON games FOR SELECT
USING (visibility = 'public' OR creator_id = auth.uid());

CREATE POLICY "Users can manage their own games"
ON games FOR ALL
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- =======================
-- GAME VERSIONS POLICIES
-- =======================
CREATE POLICY "Users can manage versions for their own games"
ON game_versions FOR ALL
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

-- =======================
-- GAME ASSETS POLICIES
-- =======================
CREATE POLICY "Users can manage assets for their own games"
ON game_assets FOR ALL
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

-- =======================
-- GAME SCRIPTS POLICIES
-- =======================
CREATE POLICY "Users can manage scripts for their own games"
ON game_scripts FOR ALL
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

-- =======================
-- SCRIPT VERSIONS POLICIES
-- =======================
CREATE POLICY "Users can manage script versions for their own games"
ON script_versions FOR ALL
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
WITH CHECK (true);

-- =======================
-- COLLABORATION SESSIONS POLICIES
-- =======================
CREATE POLICY "Users can manage collaboration sessions for their games"
ON collaboration_sessions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = collaboration_sessions.game_id 
    AND games.creator_id = auth.uid()
  ) OR
  auth.uid() = host_user_id
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = collaboration_sessions.game_id 
    AND games.creator_id = auth.uid()
  ) OR
  auth.uid() = host_user_id
);

-- =======================
-- TOXOID PATTERNS POLICIES
-- =======================
CREATE POLICY "Users can view official patterns and their own"
ON toxoid_patterns FOR SELECT
USING (is_official = true OR created_by = auth.uid());

CREATE POLICY "Users can manage their own patterns"
ON toxoid_patterns FOR ALL
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- =======================
-- COMMUNITY ASSETS POLICIES
-- =======================
CREATE POLICY "Users can view approved community assets and their own"
ON community_assets FOR SELECT
USING (status = 'approved' OR creator_id = auth.uid());

CREATE POLICY "Users can manage their own community assets"
ON community_assets FOR ALL
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- =======================
-- USER FOLLOWS POLICIES
-- =======================
CREATE POLICY "Users can manage their own follows"
ON user_follows FOR ALL
USING (auth.uid() = follower_id)
WITH CHECK (auth.uid() = follower_id);

-- =======================
-- GAME LIKES POLICIES
-- =======================
CREATE POLICY "Users can manage their own game likes"
ON game_likes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =======================
-- GAME COMMENTS POLICIES (uses author_id)
-- =======================
CREATE POLICY "Users can manage their own comments"
ON game_comments FOR ALL
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- =======================
-- COLLECTIONS POLICIES
-- =======================
CREATE POLICY "Users can view public collections and their own"
ON collections FOR SELECT
USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can manage their own collections"
ON collections FOR ALL
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- =======================
-- COLLECTION GAMES POLICIES
-- =======================
CREATE POLICY "Users can manage their own collection games"
ON collection_games FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM collections 
    WHERE collections.id = collection_games.collection_id 
    AND collections.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM collections 
    WHERE collections.id = collection_games.collection_id 
    AND collections.creator_id = auth.uid()
  )
);

-- =======================
-- PLAY SESSIONS POLICIES (uses player_id)
-- =======================
CREATE POLICY "Users can view their own play sessions"
ON play_sessions FOR SELECT
USING (auth.uid() = player_id);

-- =======================
-- CREATOR ANALYTICS POLICIES
-- =======================
CREATE POLICY "Users can view analytics for their own games"
ON creator_analytics FOR SELECT
USING (auth.uid() = creator_id);

-- =======================
-- AI GENERATIONS POLICIES
-- =======================
CREATE POLICY "Users can manage their own AI generations"
ON ai_generations FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =======================
-- TEMPLATES POLICIES (uses status)
-- =======================
CREATE POLICY "Users can view active templates"
ON templates FOR SELECT
USING (status = 'active');

-- =======================
-- PURCHASES POLICIES (uses buyer_id)
-- =======================
CREATE POLICY "Users can view their own purchases"
ON purchases FOR SELECT
USING (auth.uid() = buyer_id);

-- =======================
-- CREATOR EARNINGS POLICIES
-- =======================
CREATE POLICY "Users can view their own earnings"
ON creator_earnings FOR SELECT
USING (auth.uid() = creator_id);

-- =======================
-- VECTOR EMBEDDINGS POLICIES (READ-ONLY FOR SEARCH)
-- =======================
CREATE POLICY "Public access to game embeddings"
ON game_embeddings FOR SELECT
USING (true);

CREATE POLICY "Public access to user embeddings"
ON user_embeddings FOR SELECT
USING (true);

CREATE POLICY "Public access to asset embeddings"
ON asset_embeddings FOR SELECT
USING (true);

CREATE POLICY "Public access to script embeddings"
ON script_embeddings FOR SELECT
USING (true);

-- Comments for documentation
COMMENT ON POLICY "Users can manage their own profile" ON profiles IS 'Basic profile access control';
COMMENT ON POLICY "Users can view public games" ON games IS 'Core game visibility control using visibility column';
COMMENT ON POLICY "Users can manage their own comments" ON game_comments IS 'Comments use author_id column for ownership';