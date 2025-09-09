# AI Pixel Art & Asset Generation Pipeline - Production Deployment Guide (Enhanced)

## Overview
This guide covers the complete deployment and monitoring setup for the AI Pixel Art & Asset Generation Pipeline with P2 Enhancements implemented in feature/ai-pixel-art-pipeline branch.

## 🎨 Latest Enhancements (P2 Features)

### Enhanced Post-Processing Pipeline
- **Smart Image Processing**: Automatic Sharp library detection with fallback
- **Real Pixel Art Optimization**: Advanced pixel-perfect processing with nearest-neighbor scaling
- **Intelligent Color Mapping**: RGB distance-based color palette mapping
- **Advanced Quality Metrics**: Real image analysis with pixel art scoring

### Advanced Pixellab Provider Integration
- **Contextual Animation Prompts**: Smart frame-specific prompts for animations
- **Batch Style Consistency**: Parallel batch generation with style enforcement  
- **Frame Consistency Validation**: Automatic consistency scoring between frames
- **Enhanced Provider Configuration**: Pixellab-specific optimization parameters

### Pixel Art Quality Validation
- **Specialized Validation**: Dimension optimization, format validation, compression analysis
- **Animation Quality Scoring**: Frame consistency and key frame validation
- **Enhanced Approval Thresholds**: Higher quality requirements for pixel art assets

## Pre-Deployment Checklist

### 0. Dependencies Installation (P2 Enhancement)
For optimal performance, install Sharp image processing library:

```bash
# Recommended for production deployment
npm install sharp

# Platform-specific installation if needed
npm install sharp --platform=linux --arch=x64  # For Linux deployment
npm install sharp --platform=darwin --arch=x64 # For macOS
```

**Note**: The enhanced pipeline automatically detects Sharp availability and falls back gracefully if not installed.

### 1. Environment Variables
Ensure these environment variables are configured in production:

```bash
# AI Provider APIs
PIXELLAB_API_KEY=xxx                    # Primary pixel art provider
RETRODIFFUSION_API_KEY=xxx              # Specialized retro-style provider
OPENAI_API_KEY=xxx                      # DALL-E fallback provider

# Processing Configuration
AI_MAX_CONCURRENT_JOBS=10               # Maximum concurrent AI generation jobs
AI_DEFAULT_TIMEOUT=180000               # Default timeout (3 minutes)
AI_QUALITY_THRESHOLD=0.7                # Quality validation threshold
AI_ENABLE_ANIMATIONS=true               # Enable animation generation
AI_ENABLE_BATCH_PROCESSING=true         # Enable theme pack generation

# Provider Health Monitoring
AI_HEALTH_CHECK_INTERVAL=300            # Health check interval (5 minutes)
AI_FAILURE_THRESHOLD=3                  # Consecutive failures before failover
AI_RECOVERY_THRESHOLD=2                 # Successful requests before recovery

# Credit System Integration
AI_CREDIT_COST_SINGLE_ASSET=10          # Credits per single asset
AI_CREDIT_COST_THEME_PACK=150           # Base credits per theme pack
AI_CREDIT_MULTIPLIER_COMPLEX=1.5        # Multiplier for complex themes
AI_CREDIT_MULTIPLIER_ANIMATIONS=1.4     # Multiplier for animations

# Storage Configuration
AI_STORAGE_BUCKET=gamegen-ai-assets     # Supabase storage bucket
AI_TEMP_STORAGE_DURATION=24             # Hours to keep temp files
AI_PROCESSING_STORAGE_PATH=processing   # Storage path for processing files

# Monitoring and Alerting
AI_ENABLE_MONITORING=true               # Enable comprehensive monitoring
AI_LOG_LEVEL=info                       # Logging level (error, warn, info, debug)
AI_WEBHOOK_ALERTS_URL=xxx               # Webhook for critical alerts (optional)
SENTRY_DSN=xxx                          # Sentry error tracking (optional)
```

### 2. Database Migration Deployment

#### Option 1: Supabase CLI (Recommended)
```bash
# Link to production project
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy all AI pipeline migrations
npx supabase db push

# Generate updated TypeScript types
npx supabase gen types typescript > lib/supabase/database.types.ts
```

#### Option 2: Manual Dashboard Deployment
If CLI fails, deploy migrations manually via Supabase Dashboard SQL Editor:

1. Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/sql
2. Execute migration files in order:
   - `20250909190000_create_ai_generation_queue_tables.sql`
   - `20250909200000_create_asset_style_management_tables.sql`
   - `20250909210000_create_theme_asset_pack_tables.sql`
   - `20250909220000_create_approval_workflow_tables.sql`

#### Option 3: Management API Script
Use the automated deployment script:
```bash
./scripts/deploy_migrations_api.sh --production
```

### 3. Storage Bucket Setup
Create required storage buckets in Supabase Dashboard:

```sql
-- Execute in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('ai-assets', 'ai-assets', true),
  ('ai-temp', 'ai-temp', false),
  ('ai-processing', 'ai-processing', false);

-- Set storage policies
CREATE POLICY "Users can upload AI assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ai-assets' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view AI assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'ai-assets');

CREATE POLICY "Service role full access" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role');
```

### 4. Provider API Verification
Test all AI provider connections:

```bash
# Test API endpoint
curl -X POST /api/ai/generate-asset/test-providers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "providers": {
    "pixellab": { "status": "healthy", "response_time_ms": 150 },
    "retrodiffusion": { "status": "healthy", "response_time_ms": 200 },
    "dalle": { "status": "healthy", "response_time_ms": 300 }
  },
  "overall_status": "healthy"
}
```

## Deployment Steps

### 1. Code Deployment
Deploy the application with the AI pipeline code:

```bash
# Build and test
npm run build
npm run test:ai

# Deploy to production (example with Vercel)
vercel --prod

# Or with your deployment platform
npm run deploy:production
```

### 2. Database Migration Verification
Verify all AI pipeline tables are created:

```bash
# Check migration status
npx supabase migration list

# Verify table creation
npx supabase db reset --linked
```

### 3. Initialize Default Data
Seed the database with initial AI configuration:

```sql
-- Execute in production database
-- Initialize default queue configuration (already in migration)
INSERT INTO ai_generation_queue_config (
  max_concurrent_jobs,
  max_queue_size,
  is_active
) VALUES (10, 200, true)
ON CONFLICT (is_active) DO UPDATE SET
  max_concurrent_jobs = 10,
  max_queue_size = 200;

-- Initialize theme templates (already in migration)
-- Verify theme templates exist
SELECT * FROM ai_theme_templates WHERE is_active = true;
```

### 4. Provider Health Monitoring Setup
Initialize provider health monitoring:

```bash
# Test provider health endpoint
curl -X GET /api/ai/providers/health \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## Monitoring & Observability

### 1. Real-time Monitoring Dashboard
Create monitoring queries for Supabase Dashboard:

```sql
-- Active generation jobs
SELECT 
  status,
  COUNT(*) as job_count,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_age_seconds
FROM ai_generation_jobs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY status;

-- Provider performance metrics
SELECT 
  provider_name,
  is_healthy,
  success_rate_24h,
  average_response_time_ms,
  active_requests
FROM ai_provider_health_status;

-- Queue performance
SELECT 
  total_queued,
  total_processing,
  avg_processing_time_seconds,
  active_workers
FROM ai_generation_queue_config 
WHERE is_active = true;
```

### 2. Alerting Setup
Configure alerts for critical metrics:

```javascript
// Example webhook alert function
export async function sendCriticalAlert(alert) {
  if (process.env.AI_WEBHOOK_ALERTS_URL) {
    await fetch(process.env.AI_WEBHOOK_ALERTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 AI Pipeline Alert: ${alert.message}`,
        details: alert.details,
        timestamp: new Date().toISOString(),
        severity: alert.severity
      })
    });
  }
}
```

Alert triggers:
- Provider health failures (3+ consecutive failures)
- Queue size exceeding 80% capacity
- Processing time >5 minutes for single assets
- Credit system integration failures
- Asset approval workflow errors

### 3. Performance Monitoring
Key metrics to track:

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Average generation time | <30s | >2 minutes |
| Queue processing rate | >10 jobs/min | <2 jobs/min |
| Provider success rate | >95% | <80% |
| Credit system accuracy | 100% | <99% |
| Storage upload success | >99% | <95% |

### 4. Error Tracking
Configure error tracking with structured logging:

```typescript
// lib/ai/monitoring/error-tracker.ts
export class AIErrorTracker {
  static async logError(error: Error, context: any) {
    console.error('AI Pipeline Error:', {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userId: context.userId,
      jobId: context.jobId,
      provider: context.provider
    });

    // Send to external monitoring service
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, { extra: context });
    }
  }
}
```

## Health Checks & Status Endpoints

### 1. System Health Check
```bash
GET /api/ai/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T12:00:00Z",
  "components": {
    "database": { "status": "healthy", "response_time_ms": 50 },
    "storage": { "status": "healthy", "response_time_ms": 100 },
    "providers": {
      "pixellab": { "status": "healthy", "response_time_ms": 150 },
      "retrodiffusion": { "status": "healthy", "response_time_ms": 200 },
      "dalle": { "status": "degraded", "response_time_ms": 1500 }
    },
    "queue": { 
      "status": "healthy", 
      "queued_jobs": 5, 
      "processing_jobs": 3,
      "capacity_usage": 0.15
    }
  }
}
```

### 2. Detailed Status Monitoring
```bash
GET /api/ai/status/detailed
```

## Backup & Recovery

### 1. Data Backup Strategy
- **Database**: Automatic daily backups via Supabase
- **Generated Assets**: Stored in Supabase Storage with CDN
- **Processing Files**: Automatic cleanup after 24 hours
- **Configuration**: Version controlled in git repository

### 2. Recovery Procedures

#### Provider Failover Recovery
```bash
# Manual provider recovery
curl -X POST /api/ai/providers/recovery \
  -H "Content-Type: application/json" \
  -d '{"provider": "pixellab", "action": "force_recovery"}'
```

#### Queue Recovery
```bash
# Restart stuck jobs
curl -X POST /api/ai/queue/recovery \
  -H "Content-Type: application/json" \
  -d '{"action": "restart_stuck_jobs", "older_than_minutes": 30}'
```

## Performance Optimization

### 1. Database Optimization
```sql
-- Optimize frequently queried indexes
CREATE INDEX CONCURRENTLY idx_ai_generation_jobs_user_status 
  ON ai_generation_jobs(user_id, status) 
  WHERE status IN ('queued', 'processing');

-- Partition large tables (if needed)
-- Analyze query performance regularly
ANALYZE ai_generation_jobs;
```

### 2. Caching Strategy
- Provider responses: 5-minute cache for identical requests
- Asset metadata: 1-hour cache for processed assets
- Theme configurations: 24-hour cache for template data
- User preferences: Session-based cache

### 3. Resource Management
- Max concurrent jobs: Scale based on subscription tier
- Memory limits: Monitor Canvas processing memory usage
- Storage cleanup: Automatic cleanup of temporary files
- Rate limiting: Per-user limits based on subscription

## Security Considerations

### 1. API Security
- All endpoints require authentication
- Rate limiting per user and subscription tier
- Input validation for all generation parameters
- Content moderation for generated assets

### 2. Asset Security
- Generated assets stored with user-specific paths
- Temporary processing files isolated per user
- Asset approval workflow for public content
- Automatic content scanning for inappropriate material

### 3. Provider Security
- API keys stored in environment variables only
- Request signing where supported
- Request/response logging (excluding sensitive data)
- Provider rotation capabilities

## Rollback Plan

If issues arise, rollback procedures:

### 1. Code Rollback
```bash
# Revert to previous deployment
git revert 4ff7732
npm run deploy:production
```

### 2. Database Rollback
```sql
-- Disable AI features temporarily
UPDATE ai_generation_queue_config 
SET is_active = false 
WHERE is_active = true;

-- If needed, drop AI tables (backup first!)
-- Only as last resort - data will be lost
```

### 3. Feature Flag Rollback
```typescript
// Disable AI features in application
const AI_PIPELINE_ENABLED = process.env.AI_PIPELINE_ENABLED === 'true';
```

## Post-Deployment Verification

### 1. Smoke Tests
```bash
# Test single asset generation
curl -X POST /api/ai/generate-asset \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_JWT" \
  -d '{
    "prompt": "pixel art sword",
    "style": "16bit",
    "category": "item"
  }'

# Test theme pack generation
curl -X POST /api/ai/generate-theme-pack \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_JWT" \
  -d '{
    "themeId": "retro_platformer_basic"
  }'
```

### 2. Integration Tests
- Credit system integration
- Asset library integration  
- Approval workflow integration
- Real-time progress tracking
- Storage bucket operations

### 3. Performance Tests
- Load test with 50 concurrent requests
- Memory usage monitoring during processing
- Database query performance verification
- Provider response time validation

## Support & Maintenance

### 1. Regular Maintenance Tasks
- Weekly provider performance review
- Monthly cost optimization analysis
- Quarterly security audit
- Database performance optimization

### 2. Scaling Considerations
- Monitor queue size and processing rates
- Scale concurrent job limits based on usage
- Consider provider API rate limits
- Plan for storage growth and costs

### 3. Future Enhancements
- Additional AI providers integration
- Advanced animation generation
- Custom model fine-tuning
- Enhanced quality validation
- Real-time collaborative asset editing

---

## Quick Reference

### Key Endpoints
- Health Check: `GET /api/ai/health`
- Generate Asset: `POST /api/ai/generate-asset`
- Theme Pack: `POST /api/ai/generate-theme-pack`
- Job Status: `GET /api/ai/generation-jobs/[id]`
- Provider Health: `GET /api/ai/providers/health`

### Critical Monitoring Queries
```sql
-- Queue health
SELECT status, COUNT(*) FROM ai_generation_jobs GROUP BY status;

-- Provider performance  
SELECT provider_name, success_rate_24h, is_healthy FROM ai_provider_health_status;

-- Credit usage
SELECT SUM(credits_used) as daily_credits FROM ai_generation_jobs 
WHERE created_at > CURRENT_DATE;
```

### Emergency Contacts
- Primary Developer: [Your contact info]
- DevOps Team: [DevOps contact info]
- Supabase Support: [Support details]
- Provider Support: [AI provider support details]

---

🚀 **Generated with [Claude Code](https://claude.ai/code)**

Co-Authored-By: Claude <noreply@anthropic.com>