# Manual Migration Deployment Guide

## Overview
This guide provides step-by-step instructions for manually deploying database migrations when the Supabase CLI is not available due to network connectivity issues.

## Prerequisites
- Supabase project URL: `https://ajwskzlxlvhkhlbedtrg.supabase.co`
- Valid Supabase account with project access
- Access to Supabase Dashboard

## Manual Deployment Steps

### 1. Access Supabase Dashboard
1. Navigate to: https://supabase.com/dashboard/project/ajwskzlxlvhkhlbedtrg
2. Sign in with your Supabase credentials
3. Select the GameGen project (ajwskzlxlvhkhlbedtrg)
4. Navigate to SQL Editor (left sidebar)

### 2. Execute Migrations in Chronological Order

**IMPORTANT**: Execute migrations in the exact order listed below. Each migration builds upon the previous ones.

#### Migration 1: Enable Extensions
**File**: `20250905000001_enable_extensions.sql`
```sql
-- Migration: Enable Required Extensions
-- Description: Enable pgvector and other required PostgreSQL extensions
-- Date: 2025-09-05

-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search enhancements
CREATE EXTENSION IF NOT EXISTS unaccent;
```

#### Migration 2: Create Profiles
**File**: `20250905000002_create_profiles.sql`
```sql
-- Copy content from: supabase/migrations/20250905000002_create_profiles.sql
-- This creates the user profiles table and related structures
```

#### Migration 3: Create Games
**File**: `20250905000003_create_games.sql`
```sql
-- Copy content from: supabase/migrations/20250905000003_create_games.sql
-- This creates the games table and related structures
```

#### Migration 4: Create Assets
**File**: `20250905000004_create_assets.sql`
```sql
-- Copy content from: supabase/migrations/20250905000004_create_assets.sql
-- This creates the assets table and related structures
```

#### Migration 5: Create Social Features
**File**: `20250905000005_create_social_features.sql`
```sql
-- Copy content from: supabase/migrations/20250905000005_create_social_features.sql
-- This creates social interaction tables (likes, comments, follows)
```

#### Migration 6: Create Analytics
**File**: `20250905000006_create_analytics.sql`
```sql
-- Copy content from: supabase/migrations/20250905000006_create_analytics.sql
-- This creates analytics and tracking tables
```

#### Migration 7: Create Marketplace
**File**: `20250905000007_create_marketplace.sql`
```sql
-- Copy content from: supabase/migrations/20250905000007_create_marketplace.sql
-- This creates marketplace and transaction tables
```

#### Migration 8: Create Embeddings
**File**: `20250905000008_create_embeddings.sql`
```sql
-- Copy content from: supabase/migrations/20250905000008_create_embeddings.sql
-- This creates vector embedding tables for AI features
```

#### Migration 9: Create Indexes
**File**: `20250905000009_create_indexes.sql`
```sql
-- Copy content from: supabase/migrations/20250905000009_create_indexes.sql
-- This creates performance indexes
```

#### Migration 10: Enable RLS
**File**: `20250905000010_enable_rls.sql`
```sql
-- Copy content from: supabase/migrations/20250905000010_enable_rls.sql
-- This enables Row Level Security on all tables
```

#### Migration 11: Create RLS Policies
**File**: `20250905000011_create_rls_policies.sql`
```sql
-- Copy content from: supabase/migrations/20250905000011_create_rls_policies.sql
-- This creates Row Level Security policies
```

#### Migration 12: Create Functions and Triggers
**File**: `20250905000012_create_functions_triggers.sql`
```sql
-- Copy content from: supabase/migrations/20250905000012_create_functions_triggers.sql
-- This creates database functions and triggers
```

#### Migration 13: Seed Data
**File**: `20250905000013_seed_data.sql`
```sql
-- Copy content from: supabase/migrations/20250905000013_seed_data.sql
-- This populates initial data
```

#### Migration 14: Database Config
**File**: `20250905000014_database_config.sql`
```sql
-- Copy content from: supabase/migrations/20250905000014_database_config.sql
-- This configures database settings
```

#### Migration 15: Create Chat Tables
**File**: `20250905000015_create_chat_tables.sql`
```sql
-- Copy content from: supabase/migrations/20250905000015_create_chat_tables.sql
-- This creates chat system tables
```

#### Migration 16: Create Chat RLS Policies
**File**: `20250905000016_create_chat_rls_policies.sql`
```sql
-- Copy content from: supabase/migrations/20250905000016_create_chat_rls_policies.sql
-- This creates RLS policies for chat system
```

#### Migration 17: Seed Chat Prompt Templates
**File**: `20250905000017_seed_chat_prompt_templates.sql`
```sql
-- Copy content from: supabase/migrations/20250905000017_seed_chat_prompt_templates.sql
-- This seeds chat prompt templates
```

#### Migration 18: Extend Social Features
**File**: `20250906000001_extend_social_features.sql`
```sql
-- Copy content from: supabase/migrations/20250906000001_extend_social_features.sql
-- This extends social features
```

#### Migration 19: Create Social Indexes
**File**: `20250906000002_create_social_indexes.sql`
```sql
-- Copy content from: supabase/migrations/20250906000002_create_social_indexes.sql
-- This creates social feature indexes
```

#### Migration 20: Create Social RLS Policies
**File**: `20250906000003_create_social_rls_policies.sql`
```sql
-- Copy content from: supabase/migrations/20250906000003_create_social_rls_policies.sql
-- This creates social feature RLS policies
```

#### Migration 21: Create Social Functions
**File**: `20250906000004_create_social_functions.sql`
```sql
-- Copy content from: supabase/migrations/20250906000004_create_social_functions.sql
-- This creates social feature functions
```

#### Migration 22: Seed Social Data
**File**: `20250906000005_seed_social_data.sql`
```sql
-- Copy content from: supabase/migrations/20250906000005_seed_social_data.sql
-- This seeds social feature data
```

#### Migration 23: Create Export Tables
**File**: `20250908000001_create_export_tables.sql`
```sql
-- Copy content from: supabase/migrations/20250908000001_create_export_tables.sql
-- This creates export system tables
```

#### Migration 24: Create Export RLS Policies
**File**: `20250908000002_create_export_rls_policies.sql`
```sql
-- Copy content from: supabase/migrations/20250908000002_create_export_rls_policies.sql
-- This creates export system RLS policies
```

#### Migration 25: Seed Export Platform Configs
**File**: `20250908000003_seed_export_platform_configs.sql`
```sql
-- Copy content from: supabase/migrations/20250908000003_seed_export_platform_configs.sql
-- This seeds export platform configurations
```

## Verification Steps

After each migration, verify it was successful by checking:

### 1. Check for Errors
- Look for any red error messages in the SQL Editor
- Ensure all statements completed successfully

### 2. Verify Tables
```sql
-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

### 3. Verify Extensions (after migration 1)
```sql
-- List installed extensions
SELECT extname, extversion FROM pg_extension;
```

### 4. Verify RLS Policies (after migrations 10-11)
```sql
-- List RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
ORDER BY schemaname, tablename, policyname;
```

### 5. Verify Functions (after migration 12)
```sql
-- List custom functions
SELECT routines.routine_name, routines.routine_type 
FROM information_schema.routines 
WHERE routines.specific_schema = 'public'
ORDER BY routines.routine_name;
```

## Troubleshooting

### Common Issues

**1. Extension Creation Failed**
- Ensure you have superuser privileges
- Extensions might not be available in the current PostgreSQL version

**2. Table Already Exists**
- If re-running migrations, you might need to drop existing tables first
- Use `DROP TABLE IF EXISTS table_name CASCADE;` carefully

**3. Permission Denied**
- Ensure you're logged in with the correct account
- Check that you have admin access to the project

**4. Foreign Key Constraints**
- Ensure parent tables are created before child tables
- Follow the migration order strictly

### Recovery Steps

If a migration fails:
1. Note the exact error message
2. Check which statement failed
3. Fix the issue (usually a missing dependency)
4. Re-run the failed migration
5. Continue with remaining migrations

## Post-Deployment Tasks

After all migrations are complete:

1. **Generate TypeScript Types**
   - Go to Settings > API
   - Copy the TypeScript types
   - Update `types/supabase.ts`

2. **Test Application**
   - Verify the application can connect to the database
   - Test key features (user registration, game creation, etc.)

3. **Run Security Scan**
   - Check for any security warnings in the dashboard
   - Review RLS policies

4. **Performance Check**
   - Monitor query performance
   - Verify indexes are working correctly

## Automation Script for Future Deployments

Create a local script to automate this process:
```bash
#!/bin/bash
# save as: deploy_migrations_manual.sh

echo "=== Manual Migration Deployment Helper ==="
echo "This script will display each migration file for copy-paste into SQL Editor"
echo ""

for migration_file in supabase/migrations/*.sql; do
    echo "=== Next Migration: $(basename $migration_file) ==="
    echo "Copy the following SQL into Supabase SQL Editor:"
    echo "---"
    cat "$migration_file"
    echo "---"
    echo ""
    read -p "Press Enter after executing this migration in the dashboard..."
done

echo "All migrations displayed! Don't forget to verify the deployment."
```

Make it executable:
```bash
chmod +x deploy_migrations_manual.sh
./deploy_migrations_manual.sh
```

This will guide you through each migration step by step.