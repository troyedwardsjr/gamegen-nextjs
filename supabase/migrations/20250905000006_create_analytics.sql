-- Migration: Create Analytics and Metrics Tables
-- Description: Play sessions, creator analytics, and AI generation tracking
-- Date: 2025-09-05

-- Game play sessions
CREATE TABLE play_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Session data
    session_duration INTEGER, -- seconds
    completion_percentage DECIMAL(5,2) CHECK (completion_percentage BETWEEN 0 AND 100),
    final_score INTEGER,
    levels_completed INTEGER DEFAULT 0,
    
    -- Platform & context
    platform TEXT CHECK (platform IN ('web', 'desktop', 'mobile')),
    device_info JSONB DEFAULT '{}',
    referrer TEXT,
    
    -- Gameplay events
    events JSONB DEFAULT '[]', -- Array of gameplay events
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator analytics
CREATE TABLE creator_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    
    -- Daily metrics
    games_created INTEGER DEFAULT 0,
    assets_generated INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    total_plays INTEGER DEFAULT 0,
    new_followers INTEGER DEFAULT 0,
    
    -- Engagement metrics
    likes_received INTEGER DEFAULT 0,
    comments_received INTEGER DEFAULT 0,
    games_forked INTEGER DEFAULT 0,
    
    UNIQUE(creator_id, date)
);

-- AI generation tracking
CREATE TABLE ai_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Generation details
    generation_type TEXT NOT NULL CHECK (generation_type IN ('game', 'asset', 'code', 'audio')),
    prompt TEXT NOT NULL,
    model_used TEXT NOT NULL,
    
    -- Results
    success BOOLEAN NOT NULL,
    generation_time INTEGER, -- milliseconds
    credits_consumed INTEGER NOT NULL,
    output_data JSONB,
    
    -- Context
    game_id UUID REFERENCES games(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);