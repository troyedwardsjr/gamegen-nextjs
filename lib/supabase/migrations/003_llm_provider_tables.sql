-- LLM Provider Management Database Schema
-- Migration 003: Create tables for LLM provider system
-- Description: Creates all necessary tables for LLM provider management, billing, monitoring, and configuration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- Provider Configuration Tables
-- =====================================================

-- Provider configurations table
CREATE TABLE IF NOT EXISTS llm_provider_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('claude', 'openai', 'gemini', 'custom')),
    enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    
    -- Provider configuration (encrypted JSON)
    config JSONB NOT NULL,
    
    -- Circuit breaker configuration
    circuit_breaker_config JSONB NOT NULL DEFAULT '{
        "failure_threshold": 5,
        "reset_timeout": 60000,
        "monitor_window": 300000,
        "half_open_max_calls": 3
    }'::jsonb,
    
    -- Rate limit configuration
    rate_limit_config JSONB NOT NULL DEFAULT '{
        "requests_per_minute": 100,
        "tokens_per_minute": 100000,
        "burst_limit": 150,
        "user_tier_multiplier": {"free": 0.5, "pro": 1.0, "enterprise": 2.0}
    }'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System configuration table
CREATE TABLE IF NOT EXISTS llm_system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key TEXT NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Request Logging and Monitoring Tables
-- =====================================================

-- Request logs table
CREATE TABLE IF NOT EXISTS llm_request_logs (
    id TEXT PRIMARY KEY, -- Custom format: llm_timestamp_random
    user_id UUID NOT NULL REFERENCES auth.users(id),
    provider_id TEXT NOT NULL,
    
    -- Request/Response data (JSON, potentially large)
    request JSONB,
    response JSONB,
    error TEXT,
    
    -- Timing and performance
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    response_time INTEGER, -- milliseconds
    
    -- Cost and billing
    cost DECIMAL(10, 6) DEFAULT 0,
    
    -- Metadata
    session_id TEXT,
    request_type TEXT DEFAULT 'generation',
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS llm_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    
    -- Timing metrics
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    response_time INTEGER NOT NULL, -- milliseconds
    
    -- Usage metrics
    tokens_used JSONB NOT NULL, -- {"prompt_tokens": 100, "completion_tokens": 150, "total_tokens": 250}
    cost DECIMAL(10, 6) NOT NULL,
    
    -- Status
    success BOOLEAN NOT NULL,
    error_code TEXT,
    error_message TEXT,
    
    -- Size metrics
    request_size INTEGER, -- bytes
    response_size INTEGER, -- bytes
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security events table
CREATE TABLE IF NOT EXISTS llm_security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL CHECK (event_type IN ('rate_limit_exceeded', 'authentication_failed', 'content_filtered', 'suspicious_activity')),
    user_id UUID REFERENCES auth.users(id),
    provider_id TEXT NOT NULL,
    
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Event details
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Resolution tracking
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT
);

-- =====================================================
-- Billing and Credit Management Tables
-- =====================================================

-- User credit balances
CREATE TABLE IF NOT EXISTS user_credit_balances (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    reserved DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    -- Tier information
    subscription_tier TEXT DEFAULT 'free',
    tier_limits JSONB DEFAULT '{
        "monthly_tokens": 100000,
        "monthly_requests": 1000
    }'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing records
CREATE TABLE IF NOT EXISTS llm_billing_records (
    id TEXT PRIMARY KEY, -- Custom format: bill_timestamp_random
    user_id UUID NOT NULL REFERENCES auth.users(id),
    provider_id TEXT NOT NULL,
    request_id TEXT NOT NULL,
    
    tokens_used INTEGER NOT NULL,
    cost DECIMAL(10, 6) NOT NULL,
    request_type TEXT NOT NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions (for audit trail)
CREATE TABLE IF NOT EXISTS credit_transactions (
    id TEXT PRIMARY KEY, -- Custom format: txn_timestamp_random
    user_id UUID NOT NULL REFERENCES auth.users(id),
    amount DECIMAL(10, 2) NOT NULL, -- Positive for credits, negative for debits
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
    source TEXT NOT NULL, -- 'purchase', 'usage', 'refund', 'bonus', etc.
    
    -- Reference information
    reference_id TEXT, -- Reference to billing record, purchase, etc.
    description TEXT,
    
    -- Balance tracking
    balance_before DECIMAL(10, 2),
    balance_after DECIMAL(10, 2),
    
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Usage reports cache (for performance)
CREATE TABLE IF NOT EXISTS llm_usage_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Aggregated data
    report_data JSONB NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one report per user per period per type
    UNIQUE(user_id, report_type, period_start, period_end)
);

-- =====================================================
-- Provider Health and Status Tables
-- =====================================================

-- Provider health status
CREATE TABLE IF NOT EXISTS llm_provider_status (
    provider_id TEXT PRIMARY KEY,
    health_status TEXT NOT NULL CHECK (health_status IN ('healthy', 'degraded', 'unhealthy', 'offline')),
    last_health_check TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Circuit breaker state
    circuit_breaker_state TEXT NOT NULL DEFAULT 'closed' CHECK (circuit_breaker_state IN ('closed', 'open', 'half_open')),
    failure_count INTEGER DEFAULT 0,
    last_failure_time TIMESTAMPTZ,
    
    -- Rate limit status
    current_requests_per_minute INTEGER DEFAULT 0,
    current_tokens_per_minute INTEGER DEFAULT 0,
    rate_limit_reset_time TIMESTAMPTZ,
    
    -- Performance metrics
    avg_response_time INTEGER, -- milliseconds
    success_rate DECIMAL(5, 4), -- 0.0 to 1.0
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider metrics history (for trending)
CREATE TABLE IF NOT EXISTS llm_provider_metrics_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Snapshot of metrics at this time
    metrics JSONB NOT NULL,
    
    -- Calculated fields for easier querying
    response_time INTEGER,
    success_rate DECIMAL(5, 4),
    requests_count INTEGER,
    tokens_count INTEGER
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Request logs indexes
CREATE INDEX IF NOT EXISTS idx_llm_request_logs_user_id ON llm_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_request_logs_provider_id ON llm_request_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_llm_request_logs_start_time ON llm_request_logs(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_llm_request_logs_user_time ON llm_request_logs(user_id, start_time DESC);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_llm_performance_metrics_provider ON llm_performance_metrics(provider_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_llm_performance_metrics_user ON llm_performance_metrics(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_llm_performance_metrics_success ON llm_performance_metrics(success, start_time DESC);

-- Billing records indexes
CREATE INDEX IF NOT EXISTS idx_llm_billing_records_user ON llm_billing_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_billing_records_provider ON llm_billing_records(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_billing_records_request ON llm_billing_records(request_id);

-- Credit transactions indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type, timestamp DESC);

-- Security events indexes
CREATE INDEX IF NOT EXISTS idx_llm_security_events_type ON llm_security_events(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_llm_security_events_severity ON llm_security_events(severity, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_llm_security_events_user ON llm_security_events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_llm_security_events_resolved ON llm_security_events(resolved, timestamp DESC);

-- Provider metrics history indexes
CREATE INDEX IF NOT EXISTS idx_llm_provider_metrics_history ON llm_provider_metrics_history(provider_id, timestamp DESC);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE llm_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_usage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_provider_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_provider_metrics_history ENABLE ROW LEVEL SECURITY;

-- Admin access policies (service role can access everything)
CREATE POLICY "Admin full access on llm_provider_configs" ON llm_provider_configs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access on llm_system_config" ON llm_system_config FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access on llm_request_logs" ON llm_request_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access on llm_performance_metrics" ON llm_performance_metrics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access on llm_security_events" ON llm_security_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access on user_credit_balances" ON user_credit_balances FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access on llm_billing_records" ON llm_billing_records FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access on credit_transactions" ON credit_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access on llm_usage_reports" ON llm_usage_reports FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access on llm_provider_status" ON llm_provider_status FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access on llm_provider_metrics_history" ON llm_provider_metrics_history FOR ALL USING (auth.role() = 'service_role');

-- User access policies (users can only see their own data)
CREATE POLICY "Users can view their own request logs" ON llm_request_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own performance metrics" ON llm_performance_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own credit balance" ON user_credit_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own billing records" ON llm_billing_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own credit transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own usage reports" ON llm_usage_reports FOR SELECT USING (auth.uid() = user_id);

-- Public read access for provider status (users need to see which providers are available)
CREATE POLICY "Anyone can view provider status" ON llm_provider_status FOR SELECT USING (true);
CREATE POLICY "Anyone can view provider configs (limited)" ON llm_provider_configs FOR SELECT USING (true);

-- =====================================================
-- Triggers for Automatic Updates
-- =====================================================

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_llm_provider_configs_updated_at BEFORE UPDATE ON llm_provider_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_llm_system_config_updated_at BEFORE UPDATE ON llm_system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_credit_balances_updated_at BEFORE UPDATE ON user_credit_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_llm_provider_status_updated_at BEFORE UPDATE ON llm_provider_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Initial Data
-- =====================================================

-- Insert default system configuration
INSERT INTO llm_system_config (config_key, config_value, description) VALUES 
('default_provider', '"claude"', 'Default LLM provider to use'),
('fallback_chain', '["claude"]', 'Provider fallback chain'),
('max_concurrent_requests', '10', 'Maximum concurrent requests allowed'),
('health_check_interval', '30000', 'Health check interval in milliseconds'),
('failover_enabled', 'true', 'Whether failover is enabled')
ON CONFLICT (config_key) DO NOTHING;

-- Insert Claude provider configuration (if API key is available)
INSERT INTO llm_provider_configs (
    provider_id,
    name,
    provider_type,
    enabled,
    priority,
    config,
    circuit_breaker_config,
    rate_limit_config
) VALUES (
    'claude',
    'Anthropic Claude',
    'claude',
    true,
    1,
    '{
        "endpoint": "https://api.anthropic.com",
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 4000,
        "temperature": 0.7,
        "timeout": 30000,
        "retry_attempts": 3
    }'::jsonb,
    '{
        "failure_threshold": 5,
        "reset_timeout": 60000,
        "monitor_window": 300000,
        "half_open_max_calls": 3
    }'::jsonb,
    '{
        "requests_per_minute": 100,
        "tokens_per_minute": 100000,
        "burst_limit": 150,
        "user_tier_multiplier": {
            "free": 0.5,
            "pro": 1.0,
            "enterprise": 2.0
        }
    }'::jsonb
) ON CONFLICT (provider_id) DO NOTHING;

-- Initialize provider status
INSERT INTO llm_provider_status (provider_id, health_status, circuit_breaker_state) VALUES 
('claude', 'healthy', 'closed')
ON CONFLICT (provider_id) DO NOTHING;

-- =====================================================
-- Functions for Metrics and Reporting
-- =====================================================

-- Function to get user usage summary
CREATE OR REPLACE FUNCTION get_user_usage_summary(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    total_requests BIGINT,
    total_tokens BIGINT,
    total_cost NUMERIC,
    provider_breakdown JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH usage_data AS (
        SELECT 
            COUNT(*) as requests,
            SUM(tokens_used) as tokens,
            SUM(cost) as cost,
            provider_id
        FROM llm_billing_records
        WHERE user_id = p_user_id
        AND created_at >= p_start_date
        AND created_at <= p_end_date
        GROUP BY provider_id
    )
    SELECT 
        SUM(requests),
        SUM(tokens),
        SUM(cost),
        jsonb_object_agg(provider_id, jsonb_build_object(
            'requests', requests,
            'tokens', tokens,
            'cost', cost
        ))
    FROM usage_data;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old logs
CREATE OR REPLACE FUNCTION cleanup_old_llm_logs(retention_days INTEGER DEFAULT 30)
RETURNS TABLE (
    deleted_logs BIGINT,
    deleted_metrics BIGINT,
    deleted_events BIGINT
) AS $$
DECLARE
    cutoff_date TIMESTAMPTZ := NOW() - (retention_days || ' days')::INTERVAL;
    logs_deleted BIGINT;
    metrics_deleted BIGINT;
    events_deleted BIGINT;
BEGIN
    -- Delete old request logs
    DELETE FROM llm_request_logs WHERE start_time < cutoff_date;
    GET DIAGNOSTICS logs_deleted = ROW_COUNT;
    
    -- Delete old performance metrics
    DELETE FROM llm_performance_metrics WHERE start_time < cutoff_date;
    GET DIAGNOSTICS metrics_deleted = ROW_COUNT;
    
    -- Delete old security events (keep longer - 90 days)
    DELETE FROM llm_security_events WHERE timestamp < (NOW() - '90 days'::INTERVAL);
    GET DIAGNOSTICS events_deleted = ROW_COUNT;
    
    RETURN QUERY SELECT logs_deleted, metrics_deleted, events_deleted;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Views for Common Queries
-- =====================================================

-- View for provider health dashboard
CREATE OR REPLACE VIEW llm_provider_health_view AS
SELECT 
    pc.provider_id,
    pc.name,
    pc.enabled,
    ps.health_status,
    ps.circuit_breaker_state,
    ps.last_health_check,
    ps.avg_response_time,
    ps.success_rate,
    ps.failure_count
FROM llm_provider_configs pc
LEFT JOIN llm_provider_status ps ON pc.provider_id = ps.provider_id;

-- View for user billing summary
CREATE OR REPLACE VIEW user_billing_summary_view AS
SELECT 
    br.user_id,
    COUNT(*) as total_requests,
    SUM(br.tokens_used) as total_tokens,
    SUM(br.cost) as total_cost,
    cb.balance as current_balance,
    cb.subscription_tier
FROM llm_billing_records br
LEFT JOIN user_credit_balances cb ON br.user_id = cb.user_id
WHERE br.created_at >= DATE_TRUNC('month', NOW())
GROUP BY br.user_id, cb.balance, cb.subscription_tier;

-- Comment on tables for documentation
COMMENT ON TABLE llm_provider_configs IS 'Configuration for LLM providers including API keys and settings';
COMMENT ON TABLE llm_request_logs IS 'Complete log of LLM requests and responses for debugging and analytics';
COMMENT ON TABLE llm_billing_records IS 'Billing records for LLM usage tracking and cost calculation';
COMMENT ON TABLE user_credit_balances IS 'User credit balances and subscription tier information';
COMMENT ON TABLE llm_security_events IS 'Security events and anomalies in LLM usage';
COMMENT ON TABLE llm_provider_status IS 'Real-time status and health metrics for LLM providers';