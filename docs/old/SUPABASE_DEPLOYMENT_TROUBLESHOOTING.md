# Supabase Deployment Troubleshooting Guide

## Issues Encountered During Automated Deployment

### 1. Supabase CLI Network Connectivity Issues

**Problem**: The Supabase CLI cannot connect to the database due to IPv6 networking issues.

**Error Messages**:
```bash
failed to connect to postgres: failed to connect to `host=db.ajwskzlxlvhkhlbedtrg.supabase.co user=cli_login_postgres database=postgres`: dial error (dial tcp [2600:1f16:1cd0:331c:ae39:2044:a814:2b53]:5432: connect: no route to host)
```

**Root Cause**: 
- The CLI is attempting to connect via IPv6 address `[2600:1f16:1cd0:331c:ae39:2044:a814:2b53]:5432`
- Local network configuration doesn't have proper IPv6 routing
- Database hostname `db.ajwskzlxlvhkhlbedtrg.supabase.co` is not resolving properly

**Diagnosis Steps Taken**:
```bash
# Test main URL connectivity - WORKING
ping ajwskzlxlvhkhlbedtrg.supabase.co  # SUCCESS (172.64.149.246)

# Test database hostname - FAILED  
ping db.ajwskzlxlvhkhlbedtrg.supabase.co  # No answer
nslookup db.ajwskzlxlvhkhlbedtrg.supabase.co  # Can't find

# Test API connectivity - WORKING
curl -X GET 'https://ajwskzlxlvhkhlbedtrg.supabase.co/rest/v1/' -H 'apikey: [SERVICE_ROLE_KEY]'  # SUCCESS
```

### 2. MCP Supabase Tools Read-Only Access

**Problem**: The MCP Supabase integration tools are connected as read-only user and cannot execute DDL operations.

**Error Messages**:
```json
{"error":{"name":"Error","message":"Cannot apply migration in read-only mode."}}
{"error":{"name":"Error","message":"Failed to run sql query: ERROR: 25006: cannot execute CREATE EXTENSION in a read-only transaction"}}
```

**Root Cause**:
- MCP tools are connected as `supabase_read_only_user` (confirmed via `SELECT current_user`)
- Read-only users cannot execute DDL commands like `CREATE EXTENSION`, `CREATE TABLE`, etc.

### 3. Environment Configuration Status

**Working Components**:
- ✅ SUPABASE_ACCESS_TOKEN is properly configured: `sbp_ee787264c52929f5200549ab77a8e324ddbcf826`
- ✅ Project URL is accessible: `https://ajwskzlxlvhkhlbedtrg.supabase.co`
- ✅ Service role key is valid and working
- ✅ Supabase CLI version 2.40.6 is installed and authenticated
- ✅ REST API endpoints are responding correctly
- ✅ MCP tools can read data and project configuration

**Failing Components**:
- ❌ CLI cannot connect to database (IPv6/networking issue)
- ❌ MCP tools cannot execute DDL commands (read-only access)
- ❌ Database hostname resolution fails

## Alternative Deployment Solutions

### Solution 1: Manual Deployment via Supabase Dashboard

**Process**:
1. Navigate to: https://supabase.com/dashboard/project/ajwskzlxlvhkhlbedtrg
2. Go to SQL Editor
3. Execute migration files one by one in chronological order:

```sql
-- Migration files to execute in order:
-- 1. supabase/migrations/20250905000001_enable_extensions.sql
-- 2. supabase/migrations/20250905000002_create_profiles.sql
-- 3. supabase/migrations/20250905000003_create_games.sql
-- ... (continue with all 25 migration files)
```

### Solution 2: Management API Deployment Script

Create a deployment script that uses the Supabase Management API to execute SQL commands:

```bash
#!/bin/bash
# File: deploy_migrations_api.sh

SUPABASE_ACCESS_TOKEN="sbp_ee787264c52929f5200549ab77a8e324ddbcf826"
PROJECT_REF="ajwskzlxlvhkhlbedtrg"

# Function to execute SQL via Management API
execute_sql() {
    local sql_content="$1"
    local migration_name="$2"
    
    curl -X POST \
        "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
        -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"${sql_content}\"}"
}

# Deploy migrations in order
for migration_file in supabase/migrations/*.sql; do
    echo "Deploying: $migration_file"
    sql_content=$(cat "$migration_file" | sed 's/"/\\"/g' | tr '\n' ' ')
    execute_sql "$sql_content" "$(basename $migration_file)"
done
```

### Solution 3: Network Configuration Fix for CLI

**IPv6 Troubleshooting**:
```bash
# Disable IPv6 temporarily (macOS)
sudo networksetup -setv6off Wi-Fi

# Or force IPv4 DNS resolution
echo "172.64.149.246 db.ajwskzlxlvhkhlbedtrg.supabase.co" | sudo tee -a /etc/hosts

# Re-enable IPv6 after deployment
sudo networksetup -setv6automatic Wi-Fi
```

### Solution 4: Local PostgreSQL Connection String

If the above network fix works, use direct connection:
```bash
# Extract connection details from debug output
# Connection string format: 
# postgresql://cli_login_postgres:[password]@db.ajwskzlxlvhkhlbedtrg.supabase.co:5432/postgres

# Use psql directly (if available)
psql "postgresql://cli_login_postgres:[password]@db.ajwskzlxlvhkhlbedtrg.supabase.co:5432/postgres" < migration_file.sql
```

## Migration Files Summary

**Total Migration Files**: 25
**File Pattern**: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
**Date Range**: 2025-09-05 to 2025-09-08

**Key Migrations Include**:
1. Extensions (vector, uuid-ossp, unaccent)
2. Core tables (profiles, games, assets)
3. Social features (likes, comments, follows)
4. Analytics and marketplace
5. Embeddings and search
6. Indexes and RLS policies  
7. Functions and triggers
8. Seed data
9. Chat system tables
10. Export system tables

## Recommended Next Steps

### Immediate Action (Manual Deployment)
1. Use **Solution 1** (Manual Dashboard) for immediate deployment
2. Navigate to Supabase SQL Editor
3. Execute migrations in chronological order
4. Verify each migration before proceeding to the next

### Long-term Solution (Fix CLI)
1. Work with network administrator to resolve IPv6 connectivity
2. Test network configuration fixes
3. Validate CLI deployment workflow
4. Update documentation with working CLI process

### Verification Steps After Any Deployment
1. Verify all tables are created: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`
2. Check extensions: `SELECT * FROM pg_extension;`
3. Validate RLS policies: `SELECT * FROM pg_policies;`
4. Test application connectivity
5. Run security and performance advisors

## Environment Status Summary

**Project Configuration**:
- Project ID: `ajwskzlxlvhkhlbedtrg`
- Project URL: `https://ajwskzlxlvhkhlbedtrg.supabase.co`
- Database: PostgreSQL 15
- CLI Version: 2.40.6
- Status: Database empty, ready for migrations

**Authentication Tokens**:
- Access Token: ✅ Valid and working
- Service Role Key: ✅ Valid and working  
- Anon Key: ✅ Valid and working

**Network Connectivity**:
- Main URL: ✅ Accessible
- REST API: ✅ Working
- Database Host: ❌ Not resolving
- IPv6: ❌ No route to host
- IPv4: ✅ Available as fallback