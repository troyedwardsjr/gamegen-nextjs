-- Migration: Create Row Level Security Policies for Chat Tables
-- Description: Implements comprehensive RLS policies for chat functionality
-- Date: 2025-09-05

-- Enable RLS on all chat tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_prompt_templates ENABLE ROW LEVEL SECURITY;

-- Chat Sessions Policies
-- Users can only access their own chat sessions
CREATE POLICY "Users can view their own chat sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
  ON chat_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions"
  ON chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Chat Messages Policies
-- Users can only access messages from their own chat sessions
CREATE POLICY "Users can view messages from their own sessions"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE id = chat_messages.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their own sessions"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE id = chat_messages.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their own sessions"
  ON chat_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE id = chat_messages.session_id 
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE id = chat_messages.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their own sessions"
  ON chat_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE id = chat_messages.session_id 
      AND user_id = auth.uid()
    )
  );

-- Chat Message Reactions Policies
-- Users can view reactions on messages they have access to
CREATE POLICY "Users can view reactions on accessible messages"
  ON chat_message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN chat_sessions cs ON cm.session_id = cs.id
      WHERE cm.id = chat_message_reactions.message_id 
      AND cs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own reactions"
  ON chat_message_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN chat_sessions cs ON cm.session_id = cs.id
      WHERE cm.id = chat_message_reactions.message_id 
      AND cs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own reactions"
  ON chat_message_reactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON chat_message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Chat Prompt Templates Policies
-- Users can view public templates and their own private templates
CREATE POLICY "Users can view public and their own prompt templates"
  ON chat_prompt_templates FOR SELECT
  USING (
    is_public = true 
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create their own prompt templates"
  ON chat_prompt_templates FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    OR created_by IS NULL
  );

CREATE POLICY "Users can update their own prompt templates"
  ON chat_prompt_templates FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own prompt templates"
  ON chat_prompt_templates FOR DELETE
  USING (created_by = auth.uid());

-- Admin Policies (for system management)
-- Allow service role to manage all chat data
CREATE POLICY "Service role can manage all chat sessions"
  ON chat_sessions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all chat messages"
  ON chat_messages FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all message reactions"
  ON chat_message_reactions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all prompt templates"
  ON chat_prompt_templates FOR ALL
  USING (auth.role() = 'service_role');

-- Collaboration Policies (for future team features)
-- Allow team members to access shared game sessions (when implemented)
CREATE POLICY "Team members can access shared game chat sessions"
  ON chat_sessions FOR SELECT
  USING (
    game_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM games g
      WHERE g.id = chat_sessions.game_id
      AND (
        g.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM game_collaborators gc
          WHERE gc.game_id = g.id
          AND gc.user_id = auth.uid()
          AND gc.status = 'accepted'
        )
      )
    )
  );

-- Performance optimization indexes for RLS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_user_game_rls 
  ON chat_sessions (user_id, game_id) 
  WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_session_rls 
  ON chat_messages (session_id) 
  WHERE session_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_reactions_user_message_rls 
  ON chat_message_reactions (user_id, message_id) 
  WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompt_templates_public_created_rls 
  ON chat_prompt_templates (is_public, created_by) 
  WHERE is_public = true OR created_by IS NOT NULL;

-- Comments for documentation
COMMENT ON POLICY "Users can view their own chat sessions" ON chat_sessions IS 'Allows users to view only their own chat sessions';
COMMENT ON POLICY "Users can view messages from their own sessions" ON chat_messages IS 'Restricts message access to session owners only';
COMMENT ON POLICY "Users can view public and their own prompt templates" ON chat_prompt_templates IS 'Allows access to public templates and user-created private templates';
COMMENT ON POLICY "Team members can access shared game chat sessions" ON chat_sessions IS 'Future-proofing for team collaboration on game projects';