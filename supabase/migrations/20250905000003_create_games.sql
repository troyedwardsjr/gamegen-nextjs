-- Migration: Create Games Table
-- Description: Main games table with versioning and collaboration support
-- Date: 2025-09-05

-- Main games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic metadata
    title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 100),
    description TEXT CHECK (length(description) <= 2000),
    tags TEXT[] DEFAULT '{}',
    genre TEXT CHECK (genre IN ('platformer', 'shooter', 'puzzle', 'rpg', 'racing', 'strategy', 'casual', 'educational')),
    
    -- Game configuration
    game_data JSONB NOT NULL DEFAULT '{}', -- Complete game state/configuration
    thumbnail_url TEXT,
    screenshot_urls TEXT[] DEFAULT '{}',
    
    -- AI generation metadata
    generation_prompt TEXT,
    generation_metadata JSONB DEFAULT '{}', -- AI model used, parameters, etc.
    
    -- Publishing & sharing
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'public', 'educational')),
    is_template BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    
    -- Statistics
    play_count INTEGER DEFAULT 0 CHECK (play_count >= 0),
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    fork_count INTEGER DEFAULT 0 CHECK (fork_count >= 0),
    
    -- Relationships
    forked_from UUID REFERENCES games(id),
    template_id UUID REFERENCES games(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            coalesce(title, '') || ' ' || 
            coalesce(description, '') || ' ' || 
            array_to_string(tags, ' ')
        )
    ) STORED
);

-- Game versions for history and collaboration
CREATE TABLE game_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    creator_id UUID REFERENCES profiles(id) NOT NULL,
    
    -- Version data
    game_data JSONB NOT NULL,
    change_summary TEXT CHECK (length(change_summary) <= 500),
    is_major_version BOOLEAN DEFAULT FALSE,
    
    -- Collaboration metadata
    parent_version_id UUID REFERENCES game_versions(id),
    merge_parent_id UUID REFERENCES game_versions(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(game_id, version_number)
);

-- Real-time collaboration state
CREATE TABLE collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    host_user_id UUID REFERENCES profiles(id) NOT NULL,
    
    -- Session configuration
    max_participants INTEGER DEFAULT 5 CHECK (max_participants BETWEEN 2 AND 10),
    allow_anonymous BOOLEAN DEFAULT FALSE,
    
    -- Current state
    participants JSONB DEFAULT '[]', -- Array of user IDs and cursors
    active_locks JSONB DEFAULT '{}', -- Object mapping of locked resources
    
    -- Metadata
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);