-- Migration: Create Chat Tables for Vibe Coding Interface
-- Description: Creates tables for chat sessions, messages, and related functionality
-- Date: 2025-09-05

-- Chat Sessions Table
-- Stores individual chat sessions with context and metadata
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat Session',
  context_type TEXT NOT NULL DEFAULT 'game-design' CHECK (context_type IN ('game-design', 'code-help', 'art-generation', 'general')),
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  metadata JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  total_messages INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  
  -- Indexes
  INDEX idx_chat_sessions_user_id (user_id),
  INDEX idx_chat_sessions_game_id (game_id),
  INDEX idx_chat_sessions_context_type (context_type),
  INDEX idx_chat_sessions_status (status),
  INDEX idx_chat_sessions_created_at (created_at DESC),
  INDEX idx_chat_sessions_updated_at (updated_at DESC)
);

-- Chat Messages Table
-- Stores individual messages within chat sessions
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  parent_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  sequence_number INTEGER NOT NULL DEFAULT 0,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'ai', 'system', 'error')),
  content TEXT NOT NULL,
  raw_content TEXT, -- For storing markdown/rich content
  metadata JSONB DEFAULT '{}',
  
  -- AI-specific fields
  model_used TEXT,
  provider_id TEXT,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0,
  
  -- Message state
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'error', 'regenerating')),
  is_streaming BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  edit_history JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT positive_tokens CHECK (
    prompt_tokens >= 0 AND 
    completion_tokens >= 0 AND 
    total_tokens >= 0
  ),
  
  -- Indexes
  INDEX idx_chat_messages_session_id (session_id),
  INDEX idx_chat_messages_parent_id (parent_message_id),
  INDEX idx_chat_messages_sequence (session_id, sequence_number),
  INDEX idx_chat_messages_type (message_type),
  INDEX idx_chat_messages_status (status),
  INDEX idx_chat_messages_created_at (created_at DESC),
  INDEX idx_chat_messages_is_favorite (is_favorite) WHERE is_favorite = TRUE,
  INDEX idx_chat_messages_model_provider (model_used, provider_id)
);

-- Chat Message Reactions Table
-- Stores user reactions to messages (thumbs up/down, etc.)
CREATE TABLE IF NOT EXISTS chat_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike', 'love', 'helpful', 'not_helpful', 'accurate', 'inaccurate')),
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one reaction per user per message per type
  UNIQUE(message_id, user_id, reaction_type),
  
  -- Indexes
  INDEX idx_message_reactions_message_id (message_id),
  INDEX idx_message_reactions_user_id (user_id),
  INDEX idx_message_reactions_type (reaction_type),
  INDEX idx_message_reactions_created_at (created_at DESC)
);

-- Chat Prompt Templates Table  
-- Stores preset prompt templates for different game types
CREATE TABLE IF NOT EXISTS chat_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('rpg', 'platformer', 'puzzle', 'shooter', 'strategy', 'adventure', 'simulation', 'custom')),
  description TEXT,
  prompt_text TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_prompt_templates_category (category),
  INDEX idx_prompt_templates_public (is_public) WHERE is_public = TRUE,
  INDEX idx_prompt_templates_usage (usage_count DESC),
  INDEX idx_prompt_templates_created_by (created_by),
  INDEX idx_prompt_templates_tags (tags) USING GIN
);

-- Chat Sessions Analytics View
-- Provides aggregated analytics data for chat sessions
CREATE OR REPLACE VIEW chat_session_analytics AS
SELECT 
  cs.id,
  cs.user_id,
  cs.title,
  cs.context_type,
  cs.status,
  cs.created_at,
  cs.updated_at,
  COUNT(cm.id) as message_count,
  COUNT(cm.id) FILTER (WHERE cm.message_type = 'user') as user_messages,
  COUNT(cm.id) FILTER (WHERE cm.message_type = 'ai') as ai_messages,
  COALESCE(SUM(cm.total_tokens), 0) as total_tokens,
  COALESCE(SUM(cm.cost_cents), 0) as total_cost_cents,
  MAX(cm.created_at) as last_message_at,
  COUNT(cmr.id) as total_reactions,
  COUNT(cmr.id) FILTER (WHERE cmr.reaction_type IN ('like', 'love', 'helpful', 'accurate')) as positive_reactions
FROM chat_sessions cs
LEFT JOIN chat_messages cm ON cs.id = cm.session_id
LEFT JOIN chat_message_reactions cmr ON cm.id = cmr.message_id
GROUP BY cs.id, cs.user_id, cs.title, cs.context_type, cs.status, cs.created_at, cs.updated_at;

-- Functions and Triggers

-- Function to update session statistics
CREATE OR REPLACE FUNCTION update_chat_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update session message count and token usage
  UPDATE chat_sessions SET
    total_messages = (
      SELECT COUNT(*) 
      FROM chat_messages 
      WHERE session_id = COALESCE(NEW.session_id, OLD.session_id)
    ),
    total_tokens_used = (
      SELECT COALESCE(SUM(total_tokens), 0)
      FROM chat_messages 
      WHERE session_id = COALESCE(NEW.session_id, OLD.session_id)
    ),
    total_cost_cents = (
      SELECT COALESCE(SUM(cost_cents), 0)
      FROM chat_messages 
      WHERE session_id = COALESCE(NEW.session_id, OLD.session_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.session_id, OLD.session_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate session titles
CREATE OR REPLACE FUNCTION generate_session_title()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is the first user message in a session with default title
  IF NEW.message_type = 'user' AND NEW.sequence_number = 1 THEN
    UPDATE chat_sessions 
    SET title = CASE 
      WHEN LENGTH(NEW.content) > 60 THEN LEFT(NEW.content, 57) || '...'
      ELSE NEW.content
    END,
    updated_at = NOW()
    WHERE id = NEW.session_id 
    AND title = 'New Chat Session';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update sequence numbers
CREATE OR REPLACE FUNCTION update_message_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-assign sequence number based on session
  IF NEW.sequence_number = 0 THEN
    NEW.sequence_number := COALESCE(
      (SELECT MAX(sequence_number) FROM chat_messages WHERE session_id = NEW.session_id), 
      0
    ) + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_chat_session_stats
  AFTER INSERT OR UPDATE OR DELETE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_session_stats();

CREATE TRIGGER trigger_generate_session_title
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION generate_session_title();

CREATE TRIGGER trigger_update_message_sequence
  BEFORE INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_message_sequence();

-- Updated timestamp triggers
CREATE TRIGGER trigger_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_chat_prompt_templates_updated_at
  BEFORE UPDATE ON chat_prompt_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE chat_sessions IS 'Stores individual chat sessions with context and metadata for the Vibe Coding interface';
COMMENT ON TABLE chat_messages IS 'Stores individual messages within chat sessions with AI provider tracking';
COMMENT ON TABLE chat_message_reactions IS 'Stores user reactions and feedback for chat messages';
COMMENT ON TABLE chat_prompt_templates IS 'Stores preset prompt templates for different game types and scenarios';
COMMENT ON VIEW chat_session_analytics IS 'Provides aggregated analytics data for chat sessions and usage patterns';