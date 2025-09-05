-- GameGen Platform Initial Database Schema
-- Migration: 20250905000001_initial_schema
-- Description: Creates all core tables, indexes, and functions for the GameGen platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Users & Authentication Tables
-- =============================================================================

-- User profiles and preferences
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL CHECK (length(username) >= 3),
    display_name TEXT,
    bio TEXT CHECK (length(bio) <= 500),
    avatar_url TEXT,
    website_url TEXT,
    social_links JSONB DEFAULT '{}',
    
    -- Subscription & billing
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'max', 'educational')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trialing')),
    subscription_ends_at TIMESTAMPTZ,
    stripe_customer_id TEXT UNIQUE,
    
    -- Credits & usage
    credits_remaining INTEGER DEFAULT 100 CHECK (credits_remaining >= 0),
    credits_used_today INTEGER DEFAULT 0 CHECK (credits_used_today >= 0),
    credits_reset_date DATE DEFAULT CURRENT_DATE,
    
    -- User preferences
    preferences JSONB DEFAULT '{
        "theme": "system",
        "notifications": {
            "email": true,
            "push": false,
            "comments": true,
            "follows": true
        },
        "editor": {
            "auto_save": true,
            "grid_snap": true,
            "show_fps": false
        },
        "ai": {
            "generation_style": "balanced",
            "content_filter": "moderate"
        }
    }',
    
    -- Metadata
    is_verified BOOLEAN DEFAULT FALSE,
    is_educator BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity tracking for analytics
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_start TIMESTAMPTZ DEFAULT NOW(),
    session_end TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    platform TEXT, -- 'web', 'desktop', 'mobile'
    activities JSONB DEFAULT '[]', -- Array of activity events
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game Management Tables
-- =============================================================================

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

-- Asset Management Tables
-- =============================================================================

-- Game assets (sprites, audio, etc.)
CREATE TABLE game_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES profiles(id) NOT NULL,
    
    -- Asset metadata
    name TEXT NOT NULL CHECK (length(name) >= 1),
    asset_type TEXT NOT NULL CHECK (asset_type IN ('sprite', 'audio', 'texture', 'animation', 'font', 'data')),
    file_path TEXT NOT NULL, -- Supabase Storage path
    file_size INTEGER CHECK (file_size > 0),
    mime_type TEXT,
    
    -- Asset properties
    properties JSONB DEFAULT '{}', -- Dimensions, duration, etc.
    
    -- AI generation metadata
    generated_by_ai BOOLEAN DEFAULT FALSE,
    generation_prompt TEXT,
    generation_model TEXT,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game scripts for Toxoid engine execution
CREATE TABLE game_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    creator_id UUID REFERENCES profiles(id) NOT NULL,
    
    -- Script metadata
    name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
    script_type TEXT NOT NULL CHECK (script_type IN ('system', 'component', 'observer', 'behavior', 'initialization')),
    description TEXT CHECK (length(description) <= 500),
    
    -- Script content
    javascript_code TEXT NOT NULL CHECK (length(javascript_code) >= 1),
    source_hash TEXT NOT NULL, -- SHA-256 hash for change detection
    
    -- Toxoid-specific metadata
    toxoid_metadata JSONB DEFAULT '{
        "api_calls": [],
        "components_used": [],
        "entities_affected": [],
        "memory_estimate": 0,
        "performance_score": 5
    }',
    
    -- AI generation metadata
    generated_by_ai BOOLEAN DEFAULT FALSE,
    generation_prompt TEXT,
    generation_model TEXT,
    rag_context_used JSONB DEFAULT '[]', -- Context retrieved for generation
    
    -- Execution metadata
    is_active BOOLEAN DEFAULT TRUE,
    execution_order INTEGER DEFAULT 0, -- For system execution ordering
    dependencies TEXT[] DEFAULT '{}', -- Other script IDs this depends on
    
    -- Validation and security
    validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid', 'warning')),
    validation_errors JSONB DEFAULT '[]',
    security_analysis JSONB DEFAULT '{}', -- Security scan results
    
    -- Performance tracking
    average_execution_time DECIMAL(10,3) DEFAULT 0, -- milliseconds
    memory_usage_peak INTEGER DEFAULT 0, -- bytes
    error_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Script execution history and logs
CREATE TABLE script_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID REFERENCES game_scripts(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Execution details
    execution_start TIMESTAMPTZ NOT NULL,
    execution_duration INTEGER, -- milliseconds
    execution_phase TEXT CHECK (execution_phase IN ('initialization', 'pre_update', 'update', 'post_update')),
    
    -- Results
    success BOOLEAN NOT NULL,
    error_message TEXT,
    console_output TEXT,
    
    -- Performance metrics
    memory_used INTEGER, -- bytes
    entities_processed INTEGER DEFAULT 0,
    
    -- Context
    execution_context JSONB DEFAULT '{}', -- Game state, entity count, etc.
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Script version history
CREATE TABLE script_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID REFERENCES game_scripts(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    creator_id UUID REFERENCES profiles(id) NOT NULL,
    
    -- Version content
    javascript_code TEXT NOT NULL,
    source_hash TEXT NOT NULL,
    change_summary TEXT CHECK (length(change_summary) <= 500),
    
    -- Metadata snapshot
    toxoid_metadata JSONB NOT NULL,
    validation_status TEXT NOT NULL,
    
    -- Performance comparison
    performance_diff JSONB DEFAULT '{}', -- Compared to previous version
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(script_id, version_number)
);

-- Community asset library
CREATE TABLE community_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Asset metadata  
    name TEXT NOT NULL CHECK (length(name) >= 1),
    description TEXT CHECK (length(description) <= 1000),
    asset_type TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    
    -- Files
    file_path TEXT NOT NULL,
    preview_path TEXT,
    file_size INTEGER,
    
    -- Licensing
    license TEXT DEFAULT 'cc_by' CHECK (license IN ('cc_by', 'cc_by_sa', 'cc0', 'custom', 'commercial')),
    license_details TEXT,
    price DECIMAL(10,2) DEFAULT 0 CHECK (price >= 0),
    
    -- Community metrics
    download_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) CHECK (rating BETWEEN 0 AND 5),
    rating_count INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'featured')),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Features Tables
-- =============================================================================

-- User follows/social connections
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Game likes/favorites
CREATE TABLE game_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, game_id)
);

-- Comments system
CREATE TABLE game_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
    parent_comment_id UUID REFERENCES game_comments(id),
    
    -- Moderation
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User collections/playlists
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
    description TEXT CHECK (length(description) <= 1000),
    
    -- Configuration
    is_public BOOLEAN DEFAULT TRUE,
    is_collaborative BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    game_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collection_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    added_by UUID REFERENCES profiles(id) NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(collection_id, game_id)
);

-- Analytics & Metrics Tables
-- =============================================================================

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

-- Marketplace & Monetization Tables
-- =============================================================================

-- Templates marketplace
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    
    -- Template metadata
    name TEXT NOT NULL CHECK (length(name) >= 1),
    description TEXT CHECK (length(description) <= 2000),
    category TEXT CHECK (category IN ('educational', 'commercial', 'entertainment', 'tutorial')),
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    
    -- Pricing
    price DECIMAL(10,2) DEFAULT 0 CHECK (price >= 0),
    currency TEXT DEFAULT 'USD',
    
    -- Usage tracking
    download_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) CHECK (rating BETWEEN 0 AND 5),
    rating_count INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'archived')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase transactions
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Purchase details
    item_type TEXT NOT NULL CHECK (item_type IN ('template', 'asset_pack', 'credits', 'subscription')),
    item_id UUID, -- References templates(id) or other items
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    
    -- Payment
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency TEXT DEFAULT 'USD',
    stripe_payment_intent_id TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator earnings
CREATE TABLE creator_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
    
    -- Earnings calculation
    gross_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    
    -- Payout tracking
    payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
    payout_date DATE,
    payout_reference TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector Search & Recommendations Tables
-- =============================================================================

-- Game content embeddings for similarity search
CREATE TABLE game_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Content embeddings
    title_embedding vector(1536), -- OpenAI embedding dimension
    description_embedding vector(1536),
    gameplay_embedding vector(1536),
    
    -- Generated from game data analysis
    mechanics_embedding vector(1536),
    visual_style_embedding vector(1536),
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preference embeddings
CREATE TABLE user_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Preference vectors based on activity
    play_preferences vector(1536),
    creation_preferences vector(1536),
    social_preferences vector(1536),
    
    -- Confidence scores
    confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score BETWEEN 0 AND 1),
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset similarity for recommendations
CREATE TABLE asset_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL, -- References game_assets(id) or community_assets(id)
    asset_source TEXT NOT NULL CHECK (asset_source IN ('game', 'community')),
    
    -- Visual/audio embeddings
    visual_embedding vector(1536),
    style_embedding vector(1536),
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(asset_id, asset_source)
);

-- Script code embeddings for similarity and RAG
CREATE TABLE script_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID REFERENCES game_scripts(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Code embeddings for different purposes
    code_embedding vector(1536), -- Full code semantic embedding
    functionality_embedding vector(1536), -- What the script does
    pattern_embedding vector(1536), -- Programming patterns used
    
    -- Generated from script analysis
    api_usage_embedding vector(1536), -- Toxoid API usage patterns
    performance_embedding vector(1536), -- Performance characteristics
    
    -- Metadata for embedding generation
    embedding_model TEXT NOT NULL,
    embedding_version TEXT NOT NULL,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Toxoid API pattern knowledge base
CREATE TABLE toxoid_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Pattern identification
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('system', 'component', 'observer', 'query', 'optimization')),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Code examples
    example_code TEXT NOT NULL,
    use_cases TEXT[] DEFAULT '{}',
    complexity_level TEXT CHECK (complexity_level IN ('beginner', 'intermediate', 'advanced')),
    
    -- Performance characteristics
    memory_impact TEXT CHECK (memory_impact IN ('low', 'medium', 'high')),
    cpu_impact TEXT CHECK (cpu_impact IN ('low', 'medium', 'high')),
    best_practices TEXT,
    
    -- Embeddings for retrieval
    pattern_embedding vector(1536),
    description_embedding vector(1536),
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 0.5, -- How often this pattern helps
    
    -- Metadata
    created_by UUID REFERENCES profiles(id),
    is_official BOOLEAN DEFAULT FALSE, -- Official GameGen patterns
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes & Performance Optimization
-- =============================================================================

-- Core performance indexes
CREATE INDEX idx_games_creator_visibility ON games(creator_id, visibility);
CREATE INDEX idx_games_published ON games(published_at DESC) WHERE visibility = 'public';
CREATE INDEX idx_games_genre ON games(genre) WHERE visibility = 'public';
CREATE INDEX idx_games_search ON games USING GIN(search_vector);

-- Social features
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
CREATE INDEX idx_game_likes_user ON game_likes(user_id);
CREATE INDEX idx_game_likes_game ON game_likes(game_id);

-- Analytics indexes
CREATE INDEX idx_play_sessions_game_date ON play_sessions(game_id, created_at);
CREATE INDEX idx_ai_generations_user_date ON ai_generations(user_id, created_at);
CREATE INDEX idx_creator_analytics_creator_date ON creator_analytics(creator_id, date);

-- Vector similarity indexes
CREATE INDEX idx_game_embeddings_title ON game_embeddings USING ivfflat (title_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_user_embeddings_play ON user_embeddings USING ivfflat (play_preferences vector_cosine_ops) WITH (lists = 100);

-- Script performance indexes
CREATE INDEX idx_game_scripts_game_active ON game_scripts(game_id, is_active);
CREATE INDEX idx_game_scripts_type_validation ON game_scripts(script_type, validation_status);
CREATE INDEX idx_script_execution_logs_script_date ON script_execution_logs(script_id, created_at DESC);
CREATE INDEX idx_script_versions_script_version ON script_versions(script_id, version_number DESC);

-- Script embeddings indexes
CREATE INDEX idx_script_embeddings_code ON script_embeddings USING ivfflat (code_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_script_embeddings_functionality ON script_embeddings USING ivfflat (functionality_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_toxoid_patterns_embedding ON toxoid_patterns USING ivfflat (pattern_embedding vector_cosine_ops) WITH (lists = 100);

-- Database Functions & Triggers
-- =============================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON games 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_assets_updated_at 
    BEFORE UPDATE ON game_assets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_scripts_updated_at 
    BEFORE UPDATE ON game_scripts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_assets_updated_at 
    BEFORE UPDATE ON community_assets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_comments_updated_at 
    BEFORE UPDATE ON game_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at 
    BEFORE UPDATE ON collections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at 
    BEFORE UPDATE ON templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_toxoid_patterns_updated_at 
    BEFORE UPDATE ON toxoid_patterns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update game statistics
CREATE OR REPLACE FUNCTION update_game_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'game_likes' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE games SET like_count = like_count + 1 WHERE id = NEW.game_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE games SET like_count = like_count - 1 WHERE id = OLD.game_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_like_count
    AFTER INSERT OR DELETE ON game_likes
    FOR EACH ROW EXECUTE FUNCTION update_game_stats();

-- Credit reset daily
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS void AS $$
BEGIN
    UPDATE profiles 
    SET credits_used_today = 0, 
        credits_reset_date = CURRENT_DATE
    WHERE credits_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Migration completed successfully
INSERT INTO public._migration_log (migration_name, executed_at) 
VALUES ('20250905000001_initial_schema', NOW())
ON CONFLICT DO NOTHING;