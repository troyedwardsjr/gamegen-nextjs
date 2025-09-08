# GameGen Supabase Database Schema

This directory contains the complete database schema for the GameGen platform, implemented as sequential Supabase migrations.

## Migration Structure

The migrations are designed to be run in sequence and create a comprehensive database schema supporting:

- User-generated content platform
- Pixel art game creation
- AI-powered game generation
- Real-time collaboration
- Community features
- Marketplace and monetization
- Vector search and recommendations

## Migration Files

### Core Setup
- `20250905000001_enable_extensions.sql` - Enable pgvector and required PostgreSQL extensions
- `20250905000002_create_profiles.sql` - User profiles with subscription and preference management

### Game Management
- `20250905000003_create_games.sql` - Games table with versioning and collaboration support
- `20250905000004_create_assets.sql` - Asset management (sprites, audio, scripts) with Toxoid integration

### Social Features
- `20250905000005_create_social_features.sql` - Follows, likes, comments, and collections

### Analytics & Monetization
- `20250905000006_create_analytics.sql` - Play sessions, creator analytics, AI tracking
- `20250905000007_create_marketplace.sql` - Templates, purchases, creator earnings

### AI & Search
- `20250905000008_create_embeddings.sql` - Vector embeddings for similarity search and RAG

### Performance & Security
- `20250905000009_create_indexes.sql` - Performance indexes including vector indexes
- `20250905000010_enable_rls.sql` - Enable Row Level Security
- `20250905000011_create_rls_policies.sql` - Comprehensive RLS policies

### Business Logic & Data
- `20250905000012_create_functions_triggers.sql` - Database functions and triggers
- `20250905000013_seed_data.sql` - Initial seed data for development
- `20250905000014_database_config.sql` - Final configuration and views

## Key Features

### Toxoid Integration
The schema includes comprehensive support for the Toxoid game engine:
- Script storage with validation and performance tracking
- Execution logs and version history
- API pattern knowledge base for RAG
- Security analysis and performance monitoring

### Vector Search
Uses pgvector for semantic search and recommendations:
- Game content similarity
- User preference modeling
- Asset recommendations
- Code pattern matching for AI assistance

### Real-time Collaboration
Supports multiplayer game editing:
- Collaboration sessions with participant tracking
- Resource locking mechanisms
- Version history and merging

### Security
Implements comprehensive Row Level Security:
- Visibility-based access control
- User ownership verification
- Collaboration permission checking
- Privacy controls for analytics

## Running Migrations

To run these migrations in Supabase:

1. Connect to your Supabase project
2. Run migrations in numerical order:
   ```bash
   supabase db push
   ```

Or apply them individually:
```sql
-- Run each migration file in order
\i 20250905000001_enable_extensions.sql
\i 20250905000002_create_profiles.sql
-- ... continue with all files
```

## Development Notes

- All tables use UUIDs for primary keys
- Timestamps are in UTC
- JSONB is used for flexible schema-less data
- Comprehensive indexing for performance
- Full-text search enabled on games
- Vector similarity search configured
- Proper foreign key relationships with cascade handling

## Environment Variables

The schema expects these Supabase configuration variables:
- Authentication enabled
- Row Level Security enabled
- Vector extension installed
- Appropriate connection pooling

## Maintenance

- Refresh the `trending_games` materialized view periodically using `refresh_trending_games()`
- Run `reset_daily_credits()` daily to reset user credit limits
- Monitor vector index performance and adjust `lists` parameter as data grows