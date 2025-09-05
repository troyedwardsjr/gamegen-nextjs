# GameGen Platform: Authentication & Security Architecture

**Version**: 1.0  
**Date**: 2025-09-05  
**Security Framework**: Zero-trust architecture with defense in depth  
**Compliance**: SOC 2 Type II, COPPA, GDPR, CCPA  

## Authentication Architecture

### Overview
GameGen implements a modern, secure authentication system built on Supabase Auth with JWT tokens, multi-factor authentication, and social login providers. The system supports multiple user tiers with role-based access control and educational institution management.

### Authentication Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │  Supabase Auth  │    │   GameGen API   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                       │                       │
          │ 1. Login Request      │                       │
          │──────────────────────▶│                       │
          │                       │ 2. Validate Credentials│
          │                       │──────────────────────▶│
          │                       │                       │
          │                       │ 3. Create JWT Tokens  │
          │                       │◀──────────────────────│
          │ 4. Return Tokens      │                       │
          │◀──────────────────────│                       │
          │                       │                       │
          │ 5. API Request + JWT  │                       │
          │───────────────────────────────────────────────▶│
          │                       │                       │
          │ 6. Verify & Process   │                       │
          │◀───────────────────────────────────────────────│
```

### Token Strategy

#### Access Tokens
- **Type**: JWT with short expiration (15 minutes)
- **Contents**: User ID, subscription tier, permissions
- **Storage**: Memory only (not localStorage)
- **Transmission**: HTTP-only cookies or Authorization header

```typescript
interface AccessTokenPayload {
  sub: string; // User ID
  email: string;
  tier: 'free' | 'pro' | 'max' | 'educational';
  role: string[];
  permissions: string[];
  iat: number;
  exp: number;
  aud: 'gamegen-api';
  iss: 'gamegen-auth';
}
```

#### Refresh Tokens
- **Type**: Secure random tokens (32+ characters)
- **Expiration**: 30 days (revocable)
- **Storage**: HTTP-only, secure, SameSite cookies
- **Rotation**: New refresh token issued on each use

```typescript
interface RefreshTokenData {
  id: string;
  user_id: string;
  token_hash: string; // Bcrypt hash
  device_info: string;
  last_used: Date;
  expires_at: Date;
  revoked: boolean;
  created_at: Date;
}
```

### Multi-Factor Authentication

#### TOTP (Time-based One-Time Passwords)
- **Implementation**: RFC 6238 standard
- **Apps**: Google Authenticator, Authy, 1Password
- **Backup**: Recovery codes (10 single-use codes)
- **Enforcement**: Required for Max tier and educational accounts

#### SMS/Email Verification
- **Fallback**: When TOTP unavailable
- **Rate Limiting**: 3 attempts per 15 minutes
- **Expiration**: 10 minutes
- **Provider**: Supabase Auth SMS/Email

```typescript
interface MFAConfiguration {
  enabled: boolean;
  methods: ('totp' | 'sms' | 'email')[];
  backup_codes: string[]; // Hashed
  enforce_for_tier: boolean;
  last_verified: Date;
}
```

### Social Authentication Providers

#### Primary Providers
- **Google**: Primary for ease of use
- **Discord**: Gaming community integration  
- **GitHub**: Developer audience
- **Apple**: Mobile users (iOS requirement)

#### Provider Configuration
```typescript
interface SocialProvider {
  name: string;
  client_id: string;
  scopes: string[];
  auto_link_by_email: boolean;
  require_verified_email: boolean;
}

const SOCIAL_PROVIDERS = {
  google: {
    client_id: process.env.GOOGLE_CLIENT_ID,
    scopes: ['openid', 'email', 'profile'],
    auto_link_by_email: true,
    require_verified_email: true
  },
  discord: {
    client_id: process.env.DISCORD_CLIENT_ID,
    scopes: ['identify', 'email'],
    auto_link_by_email: false,
    require_verified_email: true
  }
  // ... other providers
};
```

## Authorization & Access Control

### Role-Based Access Control (RBAC)

#### User Roles
```typescript
enum UserRole {
  USER = 'user',           // Standard user
  CREATOR = 'creator',     // Content creator with monetization
  EDUCATOR = 'educator',   // Educational institution user
  MODERATOR = 'moderator', // Community moderator
  ADMIN = 'admin'          // Platform administrator
}

enum Permission {
  // Game permissions
  GAME_CREATE = 'game:create',
  GAME_EDIT_OWN = 'game:edit:own',
  GAME_DELETE_OWN = 'game:delete:own',
  GAME_EXPORT = 'game:export',
  GAME_COLLABORATE = 'game:collaborate',
  
  // Asset permissions
  ASSET_UPLOAD = 'asset:upload',
  ASSET_SELL = 'asset:sell',
  ASSET_DOWNLOAD = 'asset:download',
  
  // AI permissions
  AI_GENERATE_BASIC = 'ai:generate:basic',
  AI_GENERATE_ADVANCED = 'ai:generate:advanced',
  AI_UNLIMITED = 'ai:unlimited',
  
  // Community permissions
  COMMUNITY_POST = 'community:post',
  COMMUNITY_COMMENT = 'community:comment',
  COMMUNITY_MODERATE = 'community:moderate',
  
  // Admin permissions
  USER_MANAGE = 'user:manage',
  CONTENT_MODERATE = 'content:moderate',
  ANALYTICS_VIEW = 'analytics:view'
}
```

#### Subscription Tier Permissions
```typescript
const TIER_PERMISSIONS = {
  free: [
    Permission.GAME_CREATE,
    Permission.GAME_EDIT_OWN,
    Permission.GAME_DELETE_OWN,
    Permission.AI_GENERATE_BASIC,
    Permission.COMMUNITY_POST,
    Permission.COMMUNITY_COMMENT
  ],
  pro: [
    ...TIER_PERMISSIONS.free,
    Permission.GAME_EXPORT,
    Permission.GAME_COLLABORATE,
    Permission.ASSET_UPLOAD,
    Permission.AI_GENERATE_ADVANCED
  ],
  max: [
    ...TIER_PERMISSIONS.pro,
    Permission.ASSET_SELL,
    Permission.AI_UNLIMITED,
    Permission.ANALYTICS_VIEW
  ],
  educational: [
    ...TIER_PERMISSIONS.pro,
    Permission.USER_MANAGE, // For classroom management
    'edu:bulk_create',
    'edu:progress_track'
  ]
};
```

### Row Level Security (RLS) Policies

#### Dynamic Policy Generation
```sql
-- Users can only access their own data
CREATE POLICY "Users access own data" ON profiles
    FOR ALL USING (auth.uid() = id);

-- Games visibility policy
CREATE POLICY "Game visibility access" ON games
    FOR SELECT USING (
        visibility = 'public' 
        OR (visibility = 'educational' AND auth.jwt() ->> 'tier' = 'educational')
        OR creator_id = auth.uid()
        OR id IN (
            -- Shared with user through collaboration
            SELECT game_id FROM collaboration_sessions cs
            WHERE cs.participants ? auth.uid()::text
            AND cs.ended_at IS NULL
        )
    );

-- Credit usage policy
CREATE POLICY "Credit usage tracking" ON ai_generations
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND (
            -- Check daily credit limits based on tier
            (SELECT credits_used_today FROM profiles WHERE id = auth.uid()) 
            < CASE 
                WHEN (SELECT subscription_tier FROM profiles WHERE id = auth.uid()) = 'free' THEN 10
                WHEN (SELECT subscription_tier FROM profiles WHERE id = auth.uid()) = 'pro' THEN 100
                ELSE 999999 -- Max tier
            END
        )
    );
```

## Security Implementation

### Password Security

#### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- At least one special character
- Not in common password lists

#### Password Hashing
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  // Validate password strength
  if (!isStrongPassword(password)) {
    throw new Error('Password does not meet security requirements');
  }
  
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Session Security

#### Session Management
```typescript
interface SessionConfiguration {
  access_token_expiry: number; // 15 minutes
  refresh_token_expiry: number; // 30 days
  max_concurrent_sessions: number; // 5 for free, 10 for pro+
  session_timeout: number; // 2 hours of inactivity
  remember_me_duration: number; // 90 days
}

class SessionManager {
  async createSession(userId: string, deviceInfo: DeviceInfo): Promise<Session> {
    // Revoke oldest sessions if at limit
    await this.enforceSessionLimit(userId);
    
    const accessToken = await this.generateAccessToken(userId);
    const refreshToken = await this.generateRefreshToken(userId, deviceInfo);
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes
    };
  }
  
  async refreshSession(refreshToken: string): Promise<Session> {
    const tokenData = await this.validateRefreshToken(refreshToken);
    
    // Rotate refresh token
    await this.revokeRefreshToken(refreshToken);
    return this.createSession(tokenData.user_id, tokenData.device_info);
  }
}
```

#### Secure Cookie Configuration
```typescript
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/',
  domain: process.env.COOKIE_DOMAIN
};
```

### Input Validation & Sanitization

#### Request Validation Middleware
```typescript
import { z } from 'zod';
import DOMPurify from 'dompurify';

const GameCreateSchema = z.object({
  title: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s\-_]+$/),
  description: z.string().max(2000).optional(),
  genre: z.enum(['platformer', 'shooter', 'puzzle', 'rpg']),
  visibility: z.enum(['private', 'unlisted', 'public']).default('private'),
  tags: z.array(z.string().max(20)).max(10)
});

function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  // Parse and validate
  const validated = schema.parse(data);
  
  // Sanitize string fields
  if (typeof validated === 'object' && validated !== null) {
    for (const [key, value] of Object.entries(validated)) {
      if (typeof value === 'string') {
        (validated as any)[key] = DOMPurify.sanitize(value, { 
          ALLOWED_TAGS: [], 
          ALLOWED_ATTR: [] 
        });
      }
    }
  }
  
  return validated;
}
```

### Rate Limiting & DDoS Protection

#### Multi-Layer Rate Limiting
```typescript
interface RateLimitConfig {
  window: number; // Time window in seconds
  max: number;    // Max requests in window
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator?: (req: Request) => string;
}

const RATE_LIMITS = {
  // Global rate limits
  global: { window: 60, max: 1000 },
  
  // Per-user rate limits
  authenticated: { window: 60, max: 100 },
  
  // Per-IP rate limits
  anonymous: { window: 60, max: 20 },
  
  // Endpoint-specific limits
  auth: { window: 900, max: 5 }, // 5 login attempts per 15 minutes
  ai_generation: { window: 3600, max: 10 }, // 10 generations per hour (free tier)
  
  // Tier-based limits
  pro_ai: { window: 3600, max: 100 },
  max_ai: { window: 3600, max: 1000 }
};

class RateLimiter {
  async checkLimit(key: string, config: RateLimitConfig): Promise<boolean> {
    const count = await this.redis.incr(`rate_limit:${key}`);
    
    if (count === 1) {
      await this.redis.expire(`rate_limit:${key}`, config.window);
    }
    
    return count <= config.max;
  }
}
```

### Content Security Policy (CSP)

```typescript
const CSP_POLICY = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Toxoid WASM
    'https://js.stripe.com',
    'https://www.google-analytics.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components
    'https://fonts.googleapis.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://cdn.gamegen.com',
    'https://avatars.githubusercontent.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  'connect-src': [
    "'self'",
    'https://api.gamegen.com',
    'https://supabase.co',
    'wss://realtime.supabase.co'
  ],
  'media-src': [
    "'self'",
    'blob:',
    'https://cdn.gamegen.com'
  ],
  'frame-src': [
    'https://js.stripe.com'
  ],
  'worker-src': [
    "'self'",
    'blob:' // Required for Toxoid WASM workers
  ]
};
```

### Data Protection & Privacy

#### GDPR Compliance
```typescript
interface PrivacyControls {
  data_processing_consent: boolean;
  marketing_consent: boolean;
  analytics_consent: boolean;
  third_party_sharing: boolean;
  retention_period: number; // days
}

class PrivacyManager {
  async exportUserData(userId: string): Promise<UserDataExport> {
    // Compile all user data across all tables
    const userData = await Promise.all([
      this.getUserProfile(userId),
      this.getUserGames(userId),
      this.getUserAssets(userId),
      this.getUserSessions(userId),
      this.getUserAnalytics(userId)
    ]);
    
    return {
      export_date: new Date(),
      user_id: userId,
      data: userData
    };
  }
  
  async deleteUserData(userId: string): Promise<void> {
    // Anonymize or delete data according to GDPR
    await this.anonymizeUserContent(userId);
    await this.deletePersonalData(userId);
    await this.logDeletionRequest(userId);
  }
}
```

#### COPPA Compliance (Educational Users)
```typescript
interface COPPACompliance {
  parental_consent_required: boolean;
  data_collection_minimal: boolean;
  no_behavioral_advertising: boolean;
  secure_data_handling: boolean;
}

function validateEducationalUser(user: UserRegistration): boolean {
  if (user.age < 13) {
    return user.parental_consent === true 
      && user.school_verification !== null;
  }
  return true;
}
```

### Audit Logging & Monitoring

#### Security Event Logging
```typescript
enum SecurityEventType {
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILED = 'auth.login.failed',
  LOGIN_BLOCKED = 'auth.login.blocked',
  PASSWORD_CHANGED = 'auth.password.changed',
  MFA_ENABLED = 'auth.mfa.enabled',
  PERMISSION_DENIED = 'auth.permission.denied',
  SUSPICIOUS_ACTIVITY = 'security.suspicious.activity',
  DATA_BREACH_ATTEMPT = 'security.breach.attempt'
}

interface SecurityEvent {
  type: SecurityEventType;
  user_id?: string;
  ip_address: string;
  user_agent: string;
  metadata: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

class SecurityLogger {
  async logEvent(event: SecurityEvent): Promise<void> {
    // Log to database
    await this.database.securityEvents.create(event);
    
    // Send to SIEM system
    if (event.severity === 'high' || event.severity === 'critical') {
      await this.alertingService.sendAlert(event);
    }
    
    // Real-time monitoring
    this.metrics.increment(`security.events.${event.type}`);
  }
}
```

### Incident Response

#### Automated Response System
```typescript
class IncidentResponseSystem {
  async handleSuspiciousActivity(userId: string, events: SecurityEvent[]): Promise<void> {
    const riskScore = this.calculateRiskScore(events);
    
    if (riskScore > 80) {
      // Immediate account lockdown
      await this.lockUserAccount(userId, 'high_risk_activity');
      await this.notifySecurityTeam('critical', { userId, riskScore, events });
    } else if (riskScore > 60) {
      // Require MFA for next login
      await this.requireMFAVerification(userId);
      await this.notifyUser(userId, 'security_alert');
    }
  }
  
  async handleDataBreachAttempt(attempt: SecurityEvent): Promise<void> {
    // Immediate countermeasures
    await this.blockIPAddress(attempt.ip_address, '24h');
    await this.requirePasswordReset(attempt.user_id);
    
    // Legal and compliance notifications
    await this.notifyLegalTeam(attempt);
    await this.prepareBreachNotification(attempt);
  }
}
```

This comprehensive authentication and security architecture ensures GameGen maintains the highest security standards while providing a seamless user experience across all platform features.