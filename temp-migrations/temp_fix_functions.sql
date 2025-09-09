-- Migration: Fix Function Security - Set Search Path
-- Description: Address function search_path security warnings
-- Date: 2025-09-09

-- Update update_games_search_vector function with secure search_path
CREATE OR REPLACE FUNCTION update_games_search_vector()
RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        coalesce(NEW.title, '') || ' ' || 
        coalesce(NEW.description, '') || ' ' || 
        array_to_string(NEW.tags, ' ')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Update update_updated_at_column function with secure search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Comments for documentation
COMMENT ON FUNCTION update_games_search_vector() IS 'Trigger function to update search vector with secure search_path';
COMMENT ON FUNCTION update_updated_at_column() IS 'Generic trigger function to update timestamps with secure search_path';