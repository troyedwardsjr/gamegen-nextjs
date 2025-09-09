-- AI Asset Generation Queue System
-- Tables for managing AI generation jobs, queue processing, and analytics

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AI Generation Jobs table
CREATE TABLE IF NOT EXISTS ai_generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Job metadata
    request_type TEXT NOT NULL CHECK (request_type IN ('single', 'batch')),
    request_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Progress tracking
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    current_step TEXT,
    
    -- Timing information
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    estimated_completion TIMESTAMPTZ,
    processing_time_ms INTEGER,
    
    -- Results and error handling
    result_data JSONB,
    error_data JSONB,
    
    -- Retry management
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Credit management
    estimated_credits INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    
    -- Indexing for performance
    CONSTRAINT valid_timing CHECK (
        started_at IS NULL OR started_at >= created_at
    ),
    CONSTRAINT valid_completion CHECK (
        completed_at IS NULL OR (started_at IS NOT NULL AND completed_at >= started_at)
    )
);

-- Indexes for performance optimization
CREATE INDEX idx_ai_generation_jobs_user_id ON ai_generation_jobs(user_id);
CREATE INDEX idx_ai_generation_jobs_status ON ai_generation_jobs(status);
CREATE INDEX idx_ai_generation_jobs_priority ON ai_generation_jobs(priority);
CREATE INDEX idx_ai_generation_jobs_created_at ON ai_generation_jobs(created_at);
CREATE INDEX idx_ai_generation_jobs_queue_order ON ai_generation_jobs(status, priority DESC, created_at) WHERE status = 'queued';
CREATE INDEX idx_ai_generation_jobs_processing ON ai_generation_jobs(status, started_at) WHERE status = 'processing';

-- AI Generation Queue Statistics table
CREATE TABLE IF NOT EXISTS ai_generation_queue_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stats_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
    
    -- Current queue status
    total_queued INTEGER DEFAULT 0,
    total_processing INTEGER DEFAULT 0,
    peak_queue_size INTEGER DEFAULT 0,
    
    -- Daily completed jobs
    total_completed_today INTEGER DEFAULT 0,
    total_failed_today INTEGER DEFAULT 0,
    total_cancelled_today INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_processing_time_seconds INTEGER DEFAULT 0,
    avg_wait_time_seconds INTEGER DEFAULT 0,
    total_processing_time_seconds BIGINT DEFAULT 0,
    
    -- Provider statistics
    provider_usage JSONB DEFAULT '{}',
    provider_success_rates JSONB DEFAULT '{}',
    provider_avg_response_times JSONB DEFAULT '{}',
    
    -- Credit usage
    total_credits_used INTEGER DEFAULT 0,
    avg_credits_per_job DECIMAL(10,2) DEFAULT 0,
    
    -- Resource utilization
    peak_concurrent_jobs INTEGER DEFAULT 0,
    system_load_average DECIMAL(5,2) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick date-based lookups
CREATE INDEX idx_ai_generation_queue_stats_date ON ai_generation_queue_stats(stats_date);

-- AI Generation Job Logs table (for detailed tracking and debugging)
CREATE TABLE IF NOT EXISTS ai_generation_job_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES ai_generation_jobs(id) ON DELETE CASCADE,
    
    -- Log entry details
    log_level TEXT NOT NULL DEFAULT 'info' CHECK (log_level IN ('debug', 'info', 'warn', 'error')),
    message TEXT NOT NULL,
    details JSONB,
    
    -- Provider and processing context
    provider_id TEXT,
    processing_step TEXT,
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Performance metrics for this step
    step_duration_ms INTEGER,
    memory_usage_mb INTEGER,
    cpu_usage_percent DECIMAL(5,2)
);

-- Indexes for log querying
CREATE INDEX idx_ai_generation_job_logs_job_id ON ai_generation_job_logs(job_id);
CREATE INDEX idx_ai_generation_job_logs_level ON ai_generation_job_logs(log_level);
CREATE INDEX idx_ai_generation_job_logs_created_at ON ai_generation_job_logs(created_at);

-- AI Provider Status table (for health monitoring)
CREATE TABLE IF NOT EXISTS ai_provider_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id TEXT NOT NULL UNIQUE,
    
    -- Status information
    status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('online', 'offline', 'degraded', 'unknown')),
    last_health_check TIMESTAMPTZ DEFAULT NOW(),
    consecutive_failures INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_response_time_ms INTEGER DEFAULT 0,
    success_rate_24h DECIMAL(5,2) DEFAULT 0,
    total_requests_24h INTEGER DEFAULT 0,
    total_failures_24h INTEGER DEFAULT 0,
    
    -- Capacity and limits
    current_load DECIMAL(5,2) DEFAULT 0, -- 0-100 percentage
    rate_limit_remaining INTEGER,
    rate_limit_reset_at TIMESTAMPTZ,
    
    -- Provider capabilities
    supported_asset_types TEXT[] DEFAULT '{}',
    supported_styles TEXT[] DEFAULT '{}',
    max_dimensions JSONB DEFAULT '{"width": 1024, "height": 1024}',
    
    -- Configuration
    enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1, -- Lower numbers = higher priority
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for provider management
CREATE INDEX idx_ai_provider_status_provider_id ON ai_provider_status(provider_id);
CREATE INDEX idx_ai_provider_status_enabled ON ai_provider_status(enabled);
CREATE INDEX idx_ai_provider_status_priority ON ai_provider_status(priority);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE ai_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_queue_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_status ENABLE ROW LEVEL SECURITY;

-- AI Generation Jobs policies
CREATE POLICY "Users can view their own generation jobs" ON ai_generation_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generation jobs" ON ai_generation_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generation jobs" ON ai_generation_jobs
    FOR UPDATE USING (auth.uid() = user_id);

-- System can access all generation jobs (for processing)
CREATE POLICY "Service role can access all generation jobs" ON ai_generation_jobs
    FOR ALL USING (auth.role() = 'service_role');

-- Queue stats policies (read-only for users, full access for system)
CREATE POLICY "Anyone can view queue stats" ON ai_generation_queue_stats
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage queue stats" ON ai_generation_queue_stats
    FOR ALL USING (auth.role() = 'service_role');

-- Job logs policies
CREATE POLICY "Users can view logs for their own jobs" ON ai_generation_job_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_generation_jobs 
            WHERE ai_generation_jobs.id = ai_generation_job_logs.job_id 
            AND ai_generation_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage all job logs" ON ai_generation_job_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Provider status policies (read-only for users)
CREATE POLICY "Anyone can view provider status" ON ai_provider_status
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage provider status" ON ai_provider_status
    FOR ALL USING (auth.role() = 'service_role');

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_generation_jobs_updated_at 
    BEFORE UPDATE ON ai_generation_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_generation_queue_stats_updated_at 
    BEFORE UPDATE ON ai_generation_queue_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_provider_status_updated_at 
    BEFORE UPDATE ON ai_provider_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get next job in queue (considering priority)
CREATE OR REPLACE FUNCTION get_next_queued_generation_job()
RETURNS TABLE (
    job_id UUID,
    user_id UUID,
    request_type TEXT,
    request_data JSONB,
    priority TEXT,
    created_at TIMESTAMPTZ,
    estimated_credits INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        agj.id,
        agj.user_id,
        agj.request_type,
        agj.request_data,
        agj.priority,
        agj.created_at,
        agj.estimated_credits
    FROM ai_generation_jobs agj
    WHERE agj.status = 'queued'
    ORDER BY 
        CASE agj.priority
            WHEN 'urgent' THEN 4
            WHEN 'high' THEN 3
            WHEN 'normal' THEN 2
            WHEN 'low' THEN 1
        END DESC,
        agj.created_at ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update queue statistics
CREATE OR REPLACE FUNCTION update_generation_queue_stats()
RETURNS VOID AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    queued_count INTEGER;
    processing_count INTEGER;
    completed_count INTEGER;
    failed_count INTEGER;
    cancelled_count INTEGER;
BEGIN
    -- Count current queue status
    SELECT COUNT(*) INTO queued_count
    FROM ai_generation_jobs WHERE status = 'queued';
    
    SELECT COUNT(*) INTO processing_count
    FROM ai_generation_jobs WHERE status = 'processing';
    
    -- Count today's completed jobs
    SELECT COUNT(*) INTO completed_count
    FROM ai_generation_jobs 
    WHERE status = 'completed' 
    AND DATE(completed_at) = current_date;
    
    SELECT COUNT(*) INTO failed_count
    FROM ai_generation_jobs 
    WHERE status = 'failed' 
    AND DATE(updated_at) = current_date;
    
    SELECT COUNT(*) INTO cancelled_count
    FROM ai_generation_jobs 
    WHERE status = 'cancelled' 
    AND DATE(updated_at) = current_date;
    
    -- Upsert statistics
    INSERT INTO ai_generation_queue_stats (
        stats_date,
        total_queued,
        total_processing,
        total_completed_today,
        total_failed_today,
        total_cancelled_today,
        last_updated
    ) VALUES (
        current_date,
        queued_count,
        processing_count,
        completed_count,
        failed_count,
        cancelled_count,
        NOW()
    )
    ON CONFLICT (stats_date) 
    DO UPDATE SET
        total_queued = EXCLUDED.total_queued,
        total_processing = EXCLUDED.total_processing,
        total_completed_today = EXCLUDED.total_completed_today,
        total_failed_today = EXCLUDED.total_failed_today,
        total_cancelled_today = EXCLUDED.total_cancelled_today,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old job logs (to prevent unbounded growth)
CREATE OR REPLACE FUNCTION cleanup_old_generation_job_logs()
RETURNS VOID AS $$
BEGIN
    -- Delete logs older than 30 days
    DELETE FROM ai_generation_job_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete logs for jobs that are older than 7 days and completed/failed
    DELETE FROM ai_generation_job_logs 
    WHERE job_id IN (
        SELECT id FROM ai_generation_jobs 
        WHERE status IN ('completed', 'failed', 'cancelled')
        AND updated_at < NOW() - INTERVAL '7 days'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed initial provider status records
INSERT INTO ai_provider_status (provider_id, status, enabled, priority, supported_asset_types, supported_styles)
VALUES 
    ('pixellab', 'unknown', true, 1, 
     '{"sprite", "background", "tile", "ui", "tileset"}', 
     '{"pixel-art", "8bit", "16bit", "retro", "modern"}'),
    ('retrodiffusion', 'unknown', true, 2, 
     '{"sprite", "background", "tile"}', 
     '{"pixel-art", "retro", "8bit", "16bit"}'),
    ('dalle', 'unknown', true, 3, 
     '{"sprite", "background", "ui"}', 
     '{"modern", "realistic", "cartoon", "abstract"}')
ON CONFLICT (provider_id) DO NOTHING;

-- Create initial queue stats record for today
INSERT INTO ai_generation_queue_stats (stats_date)
VALUES (CURRENT_DATE)
ON CONFLICT (stats_date) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON ai_generation_jobs TO service_role;
GRANT ALL ON ai_generation_queue_stats TO service_role;
GRANT ALL ON ai_generation_job_logs TO service_role;
GRANT ALL ON ai_provider_status TO service_role;

GRANT SELECT ON ai_generation_jobs TO authenticated;
GRANT INSERT ON ai_generation_jobs TO authenticated;
GRANT UPDATE ON ai_generation_jobs TO authenticated;

GRANT SELECT ON ai_generation_queue_stats TO authenticated;
GRANT SELECT ON ai_provider_status TO authenticated;

-- Comments for documentation
COMMENT ON TABLE ai_generation_jobs IS 'Queue management for AI asset generation requests';
COMMENT ON TABLE ai_generation_queue_stats IS 'Daily statistics and metrics for the generation queue';
COMMENT ON TABLE ai_generation_job_logs IS 'Detailed logs for generation job processing and debugging';
COMMENT ON TABLE ai_provider_status IS 'Health and status monitoring for AI generation providers';