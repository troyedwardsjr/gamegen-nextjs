-- Migration: Create Asset Management Tables
-- Description: Game assets, scripts, and community assets tables
-- Date: 2025-09-05

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