-- Migration: Create Vector Embeddings Tables
-- Description: Game, user, asset, script embeddings and Toxoid patterns for AI/search
-- Date: 2025-09-05

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