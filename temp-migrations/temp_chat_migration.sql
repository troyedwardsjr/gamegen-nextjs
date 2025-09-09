-- Migration: Create Chat Tables for Vibe Coding Interface
-- Description: Creates tables for chat sessions, messages, and related functionality
-- Date: 2025-09-05

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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
  archived_at TIMESTAMPTZ
);

-- Create indexes for chat_sessions
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions (user_id);
CREATE INDEX idx_chat_sessions_game_id ON chat_sessions (game_id);
CREATE INDEX idx_chat_sessions_context_type ON chat_sessions (context_type);
CREATE INDEX idx_chat_sessions_status ON chat_sessions (status);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions (created_at DESC);
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions (updated_at DESC);

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
  )
);

-- Create indexes for chat_messages
CREATE INDEX idx_chat_messages_session_id ON chat_messages (session_id);
CREATE INDEX idx_chat_messages_parent_id ON chat_messages (parent_message_id);
CREATE INDEX idx_chat_messages_sequence ON chat_messages (session_id, sequence_number);
CREATE INDEX idx_chat_messages_type ON chat_messages (message_type);
CREATE INDEX idx_chat_messages_status ON chat_messages (status);
CREATE INDEX idx_chat_messages_created_at ON chat_messages (created_at DESC);
CREATE INDEX idx_chat_messages_is_favorite ON chat_messages (is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_chat_messages_model_provider ON chat_messages (model_used, provider_id);

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
  UNIQUE(message_id, user_id, reaction_type)
);

-- Create indexes for chat_message_reactions
CREATE INDEX idx_message_reactions_message_id ON chat_message_reactions (message_id);
CREATE INDEX idx_message_reactions_user_id ON chat_message_reactions (user_id);
CREATE INDEX idx_message_reactions_type ON chat_message_reactions (reaction_type);
CREATE INDEX idx_message_reactions_created_at ON chat_message_reactions (created_at DESC);

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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for chat_prompt_templates
CREATE INDEX idx_prompt_templates_category ON chat_prompt_templates (category);
CREATE INDEX idx_prompt_templates_public ON chat_prompt_templates (is_public) WHERE is_public = TRUE;
CREATE INDEX idx_prompt_templates_usage ON chat_prompt_templates (usage_count DESC);
CREATE INDEX idx_prompt_templates_created_by ON chat_prompt_templates (created_by);
CREATE INDEX idx_prompt_templates_tags ON chat_prompt_templates USING GIN (tags);