# GameGen Supabase Database Deployment Guide

This comprehensive guide provides step-by-step instructions for deploying the complete GameGen database schema using Supabase. It includes all necessary migrations, security configurations, and troubleshooting information for reproducible deployment from scratch.

## Table of Contents

1. [Current Database State](#current-database-state)
2. [Migration Files Overview](#migration-files-overview)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Deployment Process](#step-by-step-deployment-process)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Security Advisor Findings](#security-advisor-findings)
7. [TypeScript Type Generation](#typescript-type-generation)
8. [Troubleshooting](#troubleshooting)
9. [How to Reproduce Setup from Scratch](#how-to-reproduce-setup-from-scratch)
10. [Performance Recommendations](#performance-recommendations)

---

## Current Database State

### Before Deployment
- **Tables**: 0 (empty database)
- **Extensions**: Only core Supabase extensions installed (uuid-ossp, pgcrypto, pg_stat_statements, pg_graphql, supabase_vault)
- **Migrations Applied**: None
- **Database User**: supabase_read_only_user (limited access)

### Database Information
- **Database**: postgres
- **Available Extensions**: 70+ extensions available including vector, postgis, pg_cron, etc.
- **Current Schema**: public schema only

---

## Migration Files Overview

The GameGen application has **27 migration files** organized in two locations:

### Location 1: `/lib/supabase/migrations/` (4 files)
- **20250905000000_migration_tracker.sql** - Migration tracking system
- **003_llm_provider_tables.sql** - LLM provider configuration
- **20250905000001_initial_schema.sql** - Core schema setup
- **20250905000002_enable_rls_policies.sql** - Row Level Security policies

### Location 2: `/supabase/migrations/` (23 files)
Complete database schema including:
- Extension setup
- Core tables (profiles, games, assets, scripts)
- Social features
- Analytics tracking
- Marketplace functionality
- AI/LLM integration
- Vector embeddings for search/recommendations
- Chat system
- Export platform configurations

### Migration Chronological Order

1. **20250905000001_enable_extensions.sql** - Enable required PostgreSQL extensions
2. **20250905000002_create_profiles.sql** - User profiles and session management
3. **20250905000003_create_games.sql** - Core game storage and versioning
4. **20250905000004_create_assets.sql** - Asset management and script execution
5. **20250905000005_create_social_features.sql** - Social interactions and engagement
6. **20250905000006_create_analytics.sql** - Usage analytics and metrics
7. **20250905000007_create_marketplace.sql** - Marketplace and monetization
8. **20250905000008_create_embeddings.sql** - Vector embeddings for AI features
9. **20250905000009_create_indexes.sql** - Performance optimization indexes
10. **20250905000010_enable_rls.sql** - Enable Row Level Security
11. **20250905000011_create_rls_policies.sql** - RLS security policies
12. **20250905000012_create_functions_triggers.sql** - Database functions and triggers
13. **20250905000013_seed_data.sql** - Initial seed data
14. **20250905000014_database_config.sql** - Final configuration and views
15. **20250905000015_create_chat_tables.sql** - Chat system tables
16. **20250905000016_create_chat_rls_policies.sql** - Chat security policies
17. **20250905000017_seed_chat_prompt_templates.sql** - Chat prompt templates
18. **20250906000001_extend_social_features.sql** - Extended social features
19. **20250906000002_create_social_indexes.sql** - Social feature indexes
20. **20250906000003_create_social_rls_policies.sql** - Social security policies
21. **20250906000004_create_social_functions.sql** - Social database functions
22. **20250906000005_seed_social_data.sql** - Social feature seed data
23. **20250908000001_create_export_tables.sql** - Game export system
24. **20250908000002_create_export_rls_policies.sql** - Export security policies
25. **20250908000003_seed_export_platform_configs.sql** - Export platform configurations

---

## Prerequisites

### Required Access
- **Supabase Project**: Admin access to Supabase project  
- **Database Access**: `postgres` role or service role key
- **API Keys**: Service role key for database operations
- **Supabase Personal Access Token**: Required for CLI operations (format: `sbp_...`)

### Environment Variables Required
```bash
# From .env.local
NEXT_PUBLIC_SUPABASE_URL=https://ajwskzlxlvhkhlbedtrg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqd3Nremx4bHZoa2hsYmVkdHJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2MjYxMywiZXhwIjoyMDcyMzM4NjEzfQ.-t-RFZQnEK1n5dx97d10E8m7u8YApMqCkUrp-JtUZ0g

# For CLI operations - Personal Access Token required
SUPABASE_ACCESS_TOKEN=sbp_[YOUR_PERSONAL_ACCESS_TOKEN]
```

### Required Extensions
The following PostgreSQL extensions must be available (verified as available):
- `vector` (v0.8.0) - For vector embeddings and similarity search 
- `uuid-ossp` (v1.1) - UUID generation
- `unaccent` (v1.1) - Full-text search enhancements
- `pgcrypto` (v1.3) - Cryptographic functions (already installed)

### Tools Required
- Supabase CLI (`npx supabase@2.40.6`) - Latest version verified
- Database administration tool (optional, for verification)
- Personal Access Token from Supabase Dashboard

---

## Step-by-Step Deployment Process

### CLI-Based Deployment Process (Recommended)

#### Step 1: Setup Environment Variables
```bash
# Set required environment variables
export SUPABASE_ACCESS_TOKEN="sbp_[YOUR_PERSONAL_ACCESS_TOKEN]"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqd3Nremx4bHZoa2hsYmVkdHJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2MjYxMywiZXhwIjoyMDcyMzM4NjEzfQ.-t-RFZQnEK1n5dx97d10E8m7u8YApMqCkUrp-JtUZ0g"
```

#### Step 2: Link Project and Check Status
```bash
# Link to your Supabase project
npx supabase link --project-ref ajwskzlxlvhkhlbedtrg

# Check current migration status
npx supabase db remote commit

# List current tables (should be empty initially)
npx supabase db ls
```

#### Step 3: Deploy All Migrations
```bash
# Push all migrations to remote database
npx supabase db push

# Alternative: Deploy individual migrations in order
npx supabase db remote commit --include-all
```

#### Step 4: Verify Deployment
```bash
# Generate TypeScript types
npx supabase gen types typescript --project-id ajwskzlxlvhkhlbedtrg > lib/supabase/database.types.ts

# Check migration status
npx supabase migration list

# Verify table creation
npx supabase db ls
```

### Manual/SQL-Based Deployment Process

### Phase 1: Migration Tracking Setup

```sql
-- Step 1: Create migration tracking system
-- File: lib/supabase/migrations/20250905000000_migration_tracker.sql

CREATE TABLE IF NOT EXISTS public._migration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name TEXT NOT NULL UNIQUE,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    checksum TEXT,
    success BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_migration_log_name ON public._migration_log(migration_name);

INSERT INTO public._migration_log (migration_name, executed_at) 
VALUES ('20250905000000_migration_tracker', NOW())
ON CONFLICT DO NOTHING;
```

### Phase 2: Extensions and Core Schema

```sql
-- Step 2: Enable required extensions
-- File: supabase/migrations/20250905000001_enable_extensions.sql

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS unaccent;
```

```sql
-- Step 3: Create user profiles and sessions
-- File: supabase/migrations/20250905000002_create_profiles.sql
-- (Creates profiles table with subscription management, user_sessions table)
```

### Phase 3: Core Application Tables

Continue with each migration file in chronological order:

1. **Games System**: Tables for games, versions, collaboration
2. **Asset Management**: Game assets, scripts, execution logs
3. **Social Features**: Follows, likes, comments, collections
4. **Analytics**: Play sessions, creator analytics, AI generation tracking
5. **Marketplace**: Templates, purchases, earnings
6. **Vector Embeddings**: AI-powered recommendations and search
7. **Performance Indexes**: Optimized queries and search
8. **Security Policies**: Row Level Security implementation
9. **Database Functions**: Automated behaviors and triggers
10. **Chat System**: Real-time messaging and AI assistance
11. **Export System**: Multi-platform game export capabilities

### Phase 4: Security and Optimization

```sql
-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
-- ... (for all user-facing tables)

-- Apply RLS policies (from migration files 11, 16, 22)
-- Create performance indexes (from migration file 9)
-- Configure database settings (from migration file 14)
```

### Phase 5: Seed Data and Configuration

```sql
-- Insert initial seed data
-- Chat prompt templates
-- Export platform configurations  
-- Social platform defaults
```

---

## Post-Deployment Verification

### 1. Table Verification

```sql
-- Check all tables were created
SELECT schemaname, tablename, tableowner 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected tables (32 total):
- ai_generations
- asset_embeddings
- chat_messages
- chat_message_reactions
- chat_prompt_templates
- chat_sessions
- collaboration_sessions
- collections
- collection_games
- community_assets
- creator_analytics
- creator_earnings
- export_platform_configs
- export_queue
- export_queue_stats
- game_assets
- game_comments
- game_embeddings
- game_likes
- games
- game_scripts
- game_versions
- play_sessions
- profiles
- purchases
- script_execution_logs
- script_versions
- templates
- toxoid_patterns
- user_embeddings
- user_follows
- user_sessions

### 2. Extension Verification

```sql
-- Verify required extensions are installed
SELECT name, installed_version 
FROM pg_extension 
WHERE name IN ('vector', 'uuid-ossp', 'unaccent');
```

### 3. RLS Policy Verification

```sql
-- Check RLS is enabled on core tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

### 4. Index Verification

```sql
-- Verify performance indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 5. Function and Trigger Verification

```sql
-- Check functions were created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Check triggers were created
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

---

## Security Advisor Findings

### Current Security Issues (As of 2025-09-09)

**Security Advisors Report Status**: 3 warnings detected

1. **Leaked Password Protection Disabled** (WARN)
   - **Issue**: Supabase Auth password leak protection is disabled
   - **Impact**: Users can set compromised passwords
   - **Remediation**: Enable in Supabase Dashboard → Authentication → Settings → Password strength
   - **Documentation**: https://supabase.com/docs/guides/auth/password-security

2. **Insufficient MFA Options** (WARN)
   - **Issue**: Too few multi-factor authentication options enabled
   - **Impact**: Reduced account security for users  
   - **Remediation**: Enable additional MFA methods in Auth settings
   - **Available Options**: TOTP, Phone SMS, Email
   - **Documentation**: https://supabase.com/docs/guides/auth/auth-mfa

3. **Postgres Version Security Patches** (WARN)
   - **Issue**: Current version (supabase-postgres-17.4.1.075) has available patches
   - **Impact**: Potential security vulnerabilities
   - **Remediation**: Upgrade database through Supabase Dashboard → Settings → Database
   - **Documentation**: https://supabase.com/docs/guides/platform/upgrading

**Performance Advisors Report Status**: No issues detected

### Recommended Security Actions

1. **Immediate Actions**:
   - Enable leaked password protection
   - Configure additional MFA options
   - Schedule database upgrade

2. **RLS Policy Review**:
   - Verify all user-facing tables have appropriate RLS policies
   - Test policies with different user roles
   - Monitor RLS policy performance impact

3. **Access Control Audit**:
   - Review service role usage
   - Implement API key rotation schedule
   - Configure rate limiting

---

## TypeScript Type Generation

### Current State
The database is currently empty, so TypeScript types show minimal structure:

```typescript
export type Database = {
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
```

### Post-Migration Types
After successful migration deployment, regenerate types using:

```bash
# Using Supabase CLI
supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > lib/supabase/database.types.ts

# Using MCP tool
mcp__supabase__generate_typescript_types
```

Expected type structure will include:
- 32+ table definitions
- 5+ view definitions  
- 10+ function definitions
- Enum types for subscription tiers, game genres, etc.
- Composite types for JSONB structures

### Type Integration
Update import paths in application code:
```typescript
import { Database } from '@/lib/supabase/database.types'
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Extension Installation Failures

**Issue**: `CREATE EXTENSION vector` fails
**Cause**: Extension not available in Supabase instance
**Solution**:
```sql
-- Check available extensions
SELECT name FROM pg_available_extensions WHERE name LIKE '%vector%';

-- If not available, contact Supabase support or use alternative
```

#### 2. Permission Denied Errors

**Issue**: Cannot create tables or run migrations
**Cause**: Using anon key instead of service role key
**Solution**:
- Use service role key with admin privileges
- Verify connection string includes correct credentials
- Check Supabase project settings

#### 3. RLS Policy Conflicts

**Issue**: RLS policies prevent expected access
**Cause**: Policy logic errors or missing policies
**Solution**:
```sql
-- Temporarily disable RLS for debugging
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Test queries, then re-enable and fix policies
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

#### 4. Vector Extension Missing

**Issue**: Vector similarity searches fail
**Cause**: pgvector extension not properly installed
**Solution**:
```sql
-- Verify vector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check vector operator classes
SELECT opcname FROM pg_opclass WHERE opcname LIKE '%vector%';
```

#### 5. Migration Order Issues

**Issue**: Foreign key constraint failures
**Cause**: Migrations applied out of order
**Solution**:
- Drop and recreate database
- Apply migrations in exact chronological order
- Use transaction blocks for each migration

#### 6. Performance Issues

**Issue**: Slow queries after migration
**Cause**: Missing indexes or poor query plans
**Solution**:
```sql
-- Analyze tables
ANALYZE;

-- Check query performance
EXPLAIN ANALYZE SELECT * FROM games WHERE visibility = 'public';

-- Verify indexes exist
SELECT indexname FROM pg_indexes WHERE tablename = 'games';
```

### Migration Failure Recovery

If migration fails mid-process:

1. **Check migration log**:
```sql
SELECT * FROM public._migration_log ORDER BY executed_at DESC;
```

2. **Rollback strategy**:
```sql
-- Drop problematic objects
DROP TABLE IF EXISTS problematic_table CASCADE;

-- Restart from last successful migration
```

3. **Backup strategy**:
```bash
# Backup before migration
pg_dump -h HOST -U postgres -d DATABASE > backup_before_migration.sql

# Restore if needed
psql -h HOST -U postgres -d DATABASE < backup_before_migration.sql
```

---

## How to Reproduce Setup from Scratch

### Method 1: Supabase CLI Approach

```bash
# 1. Initialize new Supabase project
supabase init

# 2. Start local development
supabase start

# 3. Copy migration files to local project
cp -r /path/to/gamegen_nextjs/supabase/migrations ./supabase/

# 4. Apply migrations locally
supabase db reset

# 5. Generate types
supabase gen types typescript --local > lib/supabase/database.types.ts

# 6. Push to production
supabase db push --include-all
```

### Method 2: Direct Database Approach

```bash
# 1. Create new Supabase project via dashboard

# 2. Get connection details
SUPABASE_URL="https://xyz.supabase.co"
SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_KEY="your_service_key"

# 3. Connect with service role
psql "postgresql://postgres:[password]@[host]:5432/postgres"

# 4. Execute migration files in order
\i /path/to/20250905000001_enable_extensions.sql
\i /path/to/20250905000002_create_profiles.sql
# ... continue with all migrations

# 5. Verify deployment
# Run verification queries from previous section
```

### Method 3: API-Based Approach

```javascript
// Using Supabase JavaScript client with service role
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Execute migrations programmatically
const migrations = [
  '20250905000001_enable_extensions.sql',
  '20250905000002_create_profiles.sql',
  // ... all migration files
]

for (const migration of migrations) {
  const sql = await readFile(migration, 'utf8')
  const { error } = await supabaseAdmin.rpc('exec', { sql })
  if (error) throw error
}
```

### Environment Configuration

Required environment variables:
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database connection (for direct access)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
```

---

## Performance Recommendations

### Database Configuration

Based on migration file `20250905000014_database_config.sql`:

```sql
-- Optimize for vector operations and game data
ALTER SYSTEM SET work_mem = '256MB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
ALTER SYSTEM SET max_parallel_maintenance_workers = 4;

-- Connection and monitoring
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements,auto_explain';
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- Write-heavy workload optimization
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET checkpoint_timeout = '10min';
```

**Note**: These settings require superuser access and server restart. In Supabase, these are managed by the platform.

### Monitoring Setup

1. **Enable pg_stat_statements**: Already configured in migrations
2. **Set up materialized view refresh**:
```sql
-- Schedule trending games refresh (requires pg_cron)
SELECT cron.schedule('refresh_trending', '0 */6 * * *', 'SELECT refresh_trending_games();');
```

3. **Index monitoring**:
```sql
-- Monitor index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_tup_read DESC;
```

### Query Optimization

1. **Use prepared statements** for frequently executed queries
2. **Leverage full-text search** with `search_vector` columns
3. **Implement proper pagination** using `LIMIT` and `OFFSET`
4. **Use vector similarity search** efficiently with proper distance functions
5. **Monitor RLS policy performance** and optimize where needed

---

## Maintenance Tasks

### Regular Tasks

1. **Weekly**:
   - Refresh materialized view `trending_games`
   - Review slow query log
   - Check disk usage and growth

2. **Monthly**:
   - Run `ANALYZE` on large tables
   - Review and optimize RLS policies
   - Update TypeScript types if schema changes
   - Review security advisor recommendations

3. **Quarterly**:
   - Database upgrade planning
   - Performance benchmark review
   - Security audit
   - Backup/restore testing

### Automated Maintenance

```sql
-- Set up automated statistics updates
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
BEGIN
    ANALYZE profiles;
    ANALYZE games;
    ANALYZE game_assets;
    ANALYZE play_sessions;
    ANALYZE creator_analytics;
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (if available)
SELECT cron.schedule('update_stats', '0 2 * * 0', 'SELECT update_table_statistics();');
```

---

## Conclusion

This deployment guide provides a comprehensive approach to setting up the GameGen Supabase database from scratch. The migration system ensures consistent, reproducible deployments while the documentation covers all aspects from security to performance optimization.

### Key Takeaways

1. **Migration Order Matters**: Always follow the chronological order for successful deployment
2. **Security First**: Address security advisor recommendations immediately after deployment
3. **Performance Monitoring**: Implement monitoring from day one to track database performance
4. **Type Safety**: Regenerate TypeScript types after any schema changes
5. **Regular Maintenance**: Follow the maintenance schedule to keep the database healthy

### Next Steps

1. Deploy migrations to staging environment first
2. Run comprehensive integration tests
3. Monitor performance metrics
4. Implement automated backup strategies
5. Set up alerting for critical database metrics

For questions or issues during deployment, refer to the troubleshooting section or contact the development team.