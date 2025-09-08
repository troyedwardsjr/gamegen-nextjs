-- Migration: Create Export System Tables
-- Description: Multi-platform game export system with build queues and artifact storage
-- Date: 2025-09-08

-- Export job statuses and priorities
CREATE TYPE export_status AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE export_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE export_platform AS ENUM ('web', 'pwa', 'desktop-windows', 'desktop-macos', 'desktop-linux', 'mobile-android', 'mobile-ios', 'source-code');

-- Main export jobs table
CREATE TABLE export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Export configuration
    platform export_platform NOT NULL,
    export_options JSONB DEFAULT '{}', -- Platform-specific options, branding, etc.
    subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('free', 'pro', 'max', 'educational')),
    
    -- Job management
    status export_status DEFAULT 'queued' NOT NULL,
    priority export_priority DEFAULT 'normal' NOT NULL,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Processing metadata
    worker_id TEXT, -- ID of the worker processing this job
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_completion TIMESTAMPTZ,
    
    -- Error handling
    error_message TEXT,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
    max_retries INTEGER DEFAULT 3 CHECK (max_retries >= 0),
    
    -- Build metadata
    build_log TEXT,
    build_artifacts JSONB DEFAULT '[]', -- Array of artifact URLs/paths
    build_size_bytes BIGINT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Export artifacts table for tracking build outputs
CREATE TABLE export_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_job_id UUID REFERENCES export_jobs(id) ON DELETE CASCADE NOT NULL,
    
    -- Artifact metadata
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in storage
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes >= 0),
    content_type TEXT NOT NULL,
    checksum_md5 TEXT NOT NULL,
    
    -- Storage configuration
    storage_provider TEXT DEFAULT 'supabase' CHECK (storage_provider IN ('supabase', 'cdn', 's3')),
    storage_url TEXT NOT NULL,
    public_url TEXT, -- Public download URL if available
    
    -- Download tracking
    download_count INTEGER DEFAULT 0 CHECK (download_count >= 0),
    download_expires_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform-specific export configurations
CREATE TABLE export_platform_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform export_platform NOT NULL,
    
    -- Configuration
    config_name TEXT NOT NULL,
    config_data JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Template and optimization settings
    template_url TEXT, -- Base template for this platform
    optimization_settings JSONB DEFAULT '{}',
    build_commands JSONB DEFAULT '[]', -- Array of build commands
    
    -- Subscription tier requirements
    required_tier TEXT NOT NULL CHECK (required_tier IN ('free', 'pro', 'max', 'educational')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(platform, config_name)
);

-- Export queue management for load balancing
CREATE TABLE export_queue_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Queue statistics
    total_queued INTEGER DEFAULT 0 CHECK (total_queued >= 0),
    total_processing INTEGER DEFAULT 0 CHECK (total_processing >= 0),
    total_completed_today INTEGER DEFAULT 0 CHECK (total_completed_today >= 0),
    total_failed_today INTEGER DEFAULT 0 CHECK (total_failed_today >= 0),
    
    -- Performance metrics
    avg_processing_time_seconds INTEGER DEFAULT 0,
    peak_queue_size INTEGER DEFAULT 0,
    
    -- Worker management
    active_workers INTEGER DEFAULT 0 CHECK (active_workers >= 0),
    max_workers INTEGER DEFAULT 5 CHECK (max_workers >= 1),
    
    -- Date for daily statistics
    stats_date DATE DEFAULT CURRENT_DATE,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(stats_date)
);

-- User export history and usage tracking
CREATE TABLE user_export_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Daily usage tracking
    usage_date DATE DEFAULT CURRENT_DATE,
    exports_today INTEGER DEFAULT 0 CHECK (exports_today >= 0),
    total_exports INTEGER DEFAULT 0 CHECK (total_exports >= 0),
    
    -- Platform breakdown
    web_exports INTEGER DEFAULT 0 CHECK (web_exports >= 0),
    desktop_exports INTEGER DEFAULT 0 CHECK (desktop_exports >= 0),
    mobile_exports INTEGER DEFAULT 0 CHECK (mobile_exports >= 0),
    source_exports INTEGER DEFAULT 0 CHECK (source_exports >= 0),
    
    -- Storage usage
    total_storage_used_bytes BIGINT DEFAULT 0 CHECK (total_storage_used_bytes >= 0),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, usage_date)
);

-- Export analytics for optimization
CREATE TABLE export_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_job_id UUID REFERENCES export_jobs(id) ON DELETE CASCADE NOT NULL,
    
    -- Performance metrics
    queue_wait_time_seconds INTEGER,
    build_time_seconds INTEGER,
    total_time_seconds INTEGER,
    
    -- Resource usage
    cpu_usage_percent DECIMAL(5,2),
    memory_usage_mb INTEGER,
    disk_usage_mb INTEGER,
    
    -- Platform-specific metrics
    platform_metrics JSONB DEFAULT '{}',
    
    -- Success/failure tracking
    build_success BOOLEAN,
    test_results JSONB DEFAULT '{}',
    quality_score DECIMAL(3,2), -- 0.00 to 1.00
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Export webhook configurations for integrations
CREATE TABLE export_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Webhook configuration
    webhook_url TEXT NOT NULL,
    webhook_secret TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Event triggers
    on_job_started BOOLEAN DEFAULT FALSE,
    on_job_completed BOOLEAN DEFAULT TRUE,
    on_job_failed BOOLEAN DEFAULT TRUE,
    
    -- Security and rate limiting
    last_triggered_at TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0 CHECK (failure_count >= 0),
    max_failures INTEGER DEFAULT 10 CHECK (max_failures >= 0),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_export_jobs_user_status ON export_jobs(user_id, status);
CREATE INDEX idx_export_jobs_game_platform ON export_jobs(game_id, platform);
CREATE INDEX idx_export_jobs_status_priority ON export_jobs(status, priority);
CREATE INDEX idx_export_jobs_created_at ON export_jobs(created_at);
CREATE INDEX idx_export_artifacts_job_id ON export_artifacts(export_job_id);
CREATE INDEX idx_export_platform_configs_platform ON export_platform_configs(platform);
CREATE INDEX idx_user_export_usage_user_date ON user_export_usage(user_id, usage_date);
CREATE INDEX idx_export_analytics_job_id ON export_analytics(export_job_id);
CREATE INDEX idx_export_webhooks_user_active ON export_webhooks(user_id, is_active);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_export_jobs_updated_at BEFORE UPDATE ON export_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_export_artifacts_updated_at BEFORE UPDATE ON export_artifacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_export_platform_configs_updated_at BEFORE UPDATE ON export_platform_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_export_usage_updated_at BEFORE UPDATE ON user_export_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_export_webhooks_updated_at BEFORE UPDATE ON export_webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE export_jobs IS 'Main table for tracking game export jobs across all platforms';
COMMENT ON TABLE export_artifacts IS 'Storage tracking for exported game artifacts and build outputs';
COMMENT ON TABLE export_platform_configs IS 'Platform-specific configuration templates for exports';
COMMENT ON TABLE export_queue_stats IS 'Queue management and performance statistics';
COMMENT ON TABLE user_export_usage IS 'User export usage tracking for subscription limits';
COMMENT ON TABLE export_analytics IS 'Export performance analytics and optimization data';
COMMENT ON TABLE export_webhooks IS 'User-configured webhooks for export notifications';