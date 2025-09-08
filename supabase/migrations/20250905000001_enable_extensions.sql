-- Migration: Enable Required Extensions
-- Description: Enable pgvector and other required PostgreSQL extensions
-- Date: 2025-09-05

-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search enhancements
CREATE EXTENSION IF NOT EXISTS unaccent;