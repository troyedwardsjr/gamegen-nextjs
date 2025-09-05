-- Migration Tracking System
-- Migration: 20250905000000_migration_tracker
-- Description: Creates a table to track applied migrations

-- Create migration log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public._migration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name TEXT NOT NULL UNIQUE,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    checksum TEXT,
    success BOOLEAN DEFAULT TRUE
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_migration_log_name ON public._migration_log(migration_name);

-- Insert this migration
INSERT INTO public._migration_log (migration_name, executed_at) 
VALUES ('20250905000000_migration_tracker', NOW())
ON CONFLICT DO NOTHING;