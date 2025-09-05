# GameGen Platform: API Design & Endpoints

**Version**: 1.0  
**Date**: 2025-09-05  
**API Version**: v1  
**Base URL**: `https://api.gamegen.com/v1` (Production), `http://localhost:3000/api/v1` (Development)

## API Architecture Overview

The GameGen API follows RESTful principles with GraphQL-style flexibility for complex queries. Built on NextJS App Router API routes with Supabase backend services, the API provides comprehensive access to platform features while maintaining security and performance.

### Core Principles
- **RESTful Design**: Standard HTTP methods and status codes
- **Consistent Response Format**: Standardized JSON responses with metadata
- **Rate Limiting**: Tier-based request limits with graceful degradation
- **Authentication**: JWT-based auth with refresh token rotation
- **Validation**: Strict input validation with helpful error messages
- **Caching**: Intelligent caching strategies for optimal performance

### Response Format Standard

```typescript
// Success Response
interface APIResponse<T> {
  success: true;
  data: T;
  metadata?: {
    pagination?: PaginationMeta;
    timing?: number; // Request processing time in ms
    version?: string;
  };
}

// Error Response
interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    trace_id?: string;
  };
}

// Pagination Metadata
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}
```

## Authentication Endpoints

### POST /auth/signup
Create new user account with email verification.

**Request Body:**
```typescript
{
  email: string;
  password: string;
  username: string;
  display_name?: string;
  accept_terms: boolean;
  referral_code?: string;
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    user: UserProfile;
    session: Session;
    requires_verification: boolean;
  }
}
```

### POST /auth/signin
Authenticate user with email/password or OAuth provider.

**Request Body:**
```typescript
{
  email?: string;
  password?: string;
  provider?: 'google' | 'discord' | 'github' | 'apple';
  remember_me?: boolean;
}
```

### POST /auth/signout
Invalidate current session and refresh tokens.

### POST /auth/refresh
Refresh access token using refresh token.

### GET /auth/user
Get current authenticated user profile.

**Response:**
```typescript
{
  success: true;
  data: {
    user: UserProfile;
    subscription: SubscriptionDetails;
    credits: CreditBalance;
  }
}
```

## Game Management Endpoints

### GET /games
List and search games with filtering and pagination.

**Query Parameters:**
```typescript
{
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100
  sort?: 'created_at' | 'updated_at' | 'play_count' | 'like_count';
  order?: 'asc' | 'desc';
  visibility?: 'public' | 'unlisted' | 'private';
  genre?: GameGenre;
  creator_id?: string;
  search?: string; // Full-text search
  tags?: string[]; // Filter by tags
  featured?: boolean;
  created_after?: string; // ISO date
  created_before?: string; // ISO date
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    games: GameSummary[];
    filters: {
      genres: string[];
      popular_tags: string[];
    };
  };
  metadata: {
    pagination: PaginationMeta;
    timing: number;
  }
}
```

### POST /games
Create new game project.

**Request Body:**
```typescript
{
  title: string;
  description?: string;
  genre?: GameGenre;
  visibility?: 'private' | 'unlisted' | 'public';
  template_id?: string; // Use existing template
  initial_prompt?: string; // AI generation prompt
  tags?: string[];
}
```

### GET /games/:id
Get detailed game information including game data.

**Response:**
```typescript
{
  success: true;
  data: {
    game: GameDetails;
    assets: GameAsset[];
    versions: GameVersionSummary[];
    collaborators?: CollaboratorInfo[];
    analytics?: GameAnalytics; // Only for creator
  }
}
```

### PUT /games/:id
Update game metadata and configuration.

**Request Body:**
```typescript
{
  title?: string;
  description?: string;
  tags?: string[];
  visibility?: GameVisibility;
  game_data?: GameConfiguration;
  thumbnail_url?: string;
}
```

### DELETE /games/:id
Soft delete game (moves to trash, permanent after 30 days).

### POST /games/:id/fork
Create fork/copy of existing game.

**Request Body:**
```typescript
{
  title: string;
  visibility?: GameVisibility;
  include_assets?: boolean; // Default: true
}
```

### POST /games/:id/publish
Publish game to community with validation.

**Request Body:**
```typescript
{
  visibility: 'public' | 'educational';
  content_rating: 'everyone' | 'teen' | 'mature';
  is_educational?: boolean;
  curriculum_subjects?: string[];
}
```

## Game Editor Endpoints

### PUT /games/:id/data
Update complete game data/configuration.

**Request Body:**
```typescript
{
  game_data: GameConfiguration;
  version_summary?: string;
  is_major_version?: boolean;
}
```

### GET /games/:id/versions
List all versions of a game with changelog.

### POST /games/:id/versions/:version_id/restore
Restore game to specific version.

### WebSocket /games/:id/collaborate
Real-time collaboration WebSocket endpoint.

**Connection Authentication:**
```typescript
// Send JWT token in connection headers
{
  Authorization: 'Bearer <jwt_token>'
}
```

**Message Types:**
```typescript
// Client → Server
{
  type: 'join' | 'edit' | 'cursor' | 'leave';
  data: any;
  timestamp: number;
}

// Server → Client  
{
  type: 'user_joined' | 'user_left' | 'edit_applied' | 'cursor_moved' | 'conflict';
  data: any;
  user_id: string;
  timestamp: number;
}
```

## AI Generation Endpoints

### POST /ai/generate/game
Generate complete game from natural language prompt.

**Request Body:**
```typescript
{
  prompt: string; // Game description
  genre?: GameGenre;
  complexity?: 'simple' | 'intermediate' | 'complex';
  style_preferences?: {
    art_style: 'pixel' | 'minimal' | 'detailed';
    color_palette: 'bright' | 'dark' | 'pastel' | 'monochrome';
    mood: 'fun' | 'serious' | 'relaxed' | 'energetic';
  };
  constraints?: {
    max_levels?: number;
    target_duration?: number; // minutes
    educational?: boolean;
  };
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    game_id: string;
    generation_id: string;
    estimated_time: number; // seconds
    credits_consumed: number;
  }
}
```

### GET /ai/generate/:generation_id/status
Check status of ongoing AI generation.

**Response:**
```typescript
{
  success: true;
  data: {
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number; // 0-100
    current_step?: string;
    estimated_remaining?: number; // seconds
    result?: {
      game_id: string;
      preview_url: string;
    };
    error?: string;
  }
}
```

### POST /ai/generate/asset
Generate individual game assets.

**Request Body:**
```typescript
{
  asset_type: 'sprite' | 'background' | 'audio' | 'texture';
  prompt: string;
  specifications: {
    dimensions?: { width: number; height: number };
    format?: string;
    style_reference?: string; // URL to style example
    animation_frames?: number; // For animated sprites
    duration?: number; // For audio assets
  };
  context?: {
    game_id?: string; // For style consistency
    existing_assets?: string[]; // Asset IDs for context
  };
}
```

### POST /ai/code/generate
Generate game logic code from description.

**Request Body:**
```typescript
{
  description: string;
  code_type: 'behavior' | 'mechanic' | 'ui' | 'system';
  context: {
    existing_code?: string;
    game_framework: 'toxoid';
    target_objects?: string[]; // Game objects to affect
  };
  parameters?: {
    complexity_level: 'beginner' | 'intermediate' | 'advanced';
    performance_priority: boolean;
    include_comments: boolean;
  };
}
```

## Asset Management Endpoints

### GET /assets
List user's assets with filtering.

**Query Parameters:**
```typescript
{
  type?: AssetType;
  game_id?: string;
  search?: string;
  created_after?: string;
  page?: number;
  limit?: number;
}
```

### POST /assets/upload
Upload custom asset (Pro+ tiers).

**Request Body (multipart/form-data):**
```typescript
{
  file: File;
  name: string;
  asset_type: AssetType;
  game_id?: string;
  metadata?: {
    dimensions?: { width: number; height: number };
    tags?: string[];
    description?: string;
  };
}
```

### DELETE /assets/:id
Delete asset (if not referenced by any games).

### GET /assets/community
Browse community asset library.

### POST /assets/community
Submit asset to community library (Pro+ tiers).

## Social & Community Endpoints

### GET /users/:username
Get public user profile and portfolio.

**Response:**
```typescript
{
  success: true;
  data: {
    user: PublicUserProfile;
    games: GameSummary[]; // Public games
    statistics: {
      total_games: number;
      total_plays: number;
      followers: number;
      following: number;
    };
    achievements: Achievement[];
  }
}
```

### POST /users/:user_id/follow
Follow/unfollow user.

### GET /social/feed
Get personalized social feed.

**Query Parameters:**
```typescript
{
  type?: 'all' | 'following' | 'featured';
  page?: number;
  limit?: number;
}
```

### POST /games/:id/like
Like/unlike game.

### GET /games/:id/comments
Get game comments with pagination.

### POST /games/:id/comments
Add comment to game.

**Request Body:**
```typescript
{
  content: string;
  parent_comment_id?: string; // For replies
}
```

### GET /collections
List user's collections.

### POST /collections
Create new collection.

### PUT /collections/:id/games
Add/remove games from collection.

## Analytics Endpoints

### GET /analytics/games/:id
Get detailed game analytics (creator only).

**Response:**
```typescript
{
  success: true;
  data: {
    overview: {
      total_plays: number;
      unique_players: number;
      average_session: number; // seconds
      completion_rate: number; // percentage
    };
    timeline: {
      date: string;
      plays: number;
      unique_players: number;
    }[];
    demographics: {
      platforms: Record<string, number>;
      countries: Record<string, number>;
      referrers: Record<string, number>;
    };
    engagement: {
      likes: number;
      comments: number;
      shares: number;
      forks: number;
    };
  }
}
```

### GET /analytics/user
Get user's creation analytics.

**Response:**
```typescript
{
  success: true;
  data: {
    overview: {
      total_games: number;
      total_plays: number;
      credits_used_month: number;
      ai_generations: number;
    };
    top_games: GameAnalyticsSummary[];
    monthly_stats: MonthlyStats[];
    achievements: RecentAchievement[];
  }
}
```

## Marketplace Endpoints

### GET /marketplace/templates
Browse template marketplace.

**Query Parameters:**
```typescript
{
  category?: 'educational' | 'commercial' | 'entertainment';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  price_range?: 'free' | 'premium' | 'all';
  sort?: 'popularity' | 'newest' | 'rating' | 'price';
}
```

### GET /marketplace/templates/:id
Get detailed template information.

### POST /marketplace/purchases
Purchase template or asset pack.

**Request Body:**
```typescript
{
  item_type: 'template' | 'asset_pack';
  item_id: string;
  payment_method_id: string; // Stripe payment method
  coupon_code?: string;
}
```

## Export & Publishing Endpoints

### POST /games/:id/export
Generate game export for various platforms.

**Request Body:**
```typescript
{
  platform: 'web' | 'desktop' | 'mobile' | 'source';
  options: {
    optimize_size?: boolean;
    include_analytics?: boolean;
    custom_domain?: string; // For web exports
    app_name?: string; // For mobile exports
    bundle_id?: string; // For mobile exports
  };
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    export_id: string;
    estimated_time: number; // seconds
  }
}
```

### GET /exports/:export_id/status
Check export build status.

### GET /exports/:export_id/download
Download completed export build.

## Webhooks & Integrations

### POST /webhooks/stripe
Handle Stripe payment webhooks for subscription management.

### POST /webhooks/ai/completed
Handle AI generation completion callbacks.

### GET /integrations/lms/games
LMS integration endpoint for educational institutions.

## Rate Limiting

### Rate Limit Structure
```typescript
interface RateLimit {
  tier: 'free' | 'pro' | 'max' | 'educational';
  limits: {
    requests_per_minute: number;
    requests_per_hour: number;
    requests_per_day: number;
    ai_generations_per_day: number;
    concurrent_collaborations: number;
    export_builds_per_day: number;
  };
}

// Example rate limits
const RATE_LIMITS = {
  free: {
    requests_per_minute: 30,
    requests_per_hour: 1000,
    requests_per_day: 10000,
    ai_generations_per_day: 10,
    concurrent_collaborations: 1,
    export_builds_per_day: 3
  },
  pro: {
    requests_per_minute: 100,
    requests_per_hour: 5000,
    requests_per_day: 50000,
    ai_generations_per_day: 100,
    concurrent_collaborations: 5,
    export_builds_per_day: 10
  }
  // ... other tiers
};
```

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1693920000
X-RateLimit-Tier: pro
```

## Error Codes Reference

### Authentication Errors (4001-4099)
- `4001`: Invalid credentials
- `4002`: Account not verified
- `4003`: Subscription required
- `4004`: Token expired
- `4005`: Account suspended

### Game Management Errors (4101-4199)
- `4101`: Game not found
- `4102`: Access denied
- `4103`: Game limit reached
- `4104`: Invalid game data
- `4105`: Collaboration full

### AI Generation Errors (4201-4299)
- `4201`: Insufficient credits
- `4202`: Invalid prompt
- `4203`: Generation failed
- `4204`: Content policy violation
- `4205`: Generation timeout

### System Errors (5001-5099)
- `5001`: Internal server error
- `5002`: Database connection error
- `5003`: External service error
- `5004`: File upload error
- `5005`: Export build error

## TypeScript SDK Example

```typescript
import { GameGenAPI } from '@gamegen/sdk';

const api = new GameGenAPI({
  baseURL: 'https://api.gamegen.com/v1',
  apiKey: process.env.GAMEGEN_API_KEY,
});

// Create and generate a game
const game = await api.games.create({
  title: 'My Awesome Game',
  visibility: 'private'
});

const generation = await api.ai.generateGame({
  prompt: 'A simple platformer where you collect coins',
  genre: 'platformer'
});

// Monitor generation progress
const result = await api.ai.waitForGeneration(generation.generation_id);
console.log('Game created:', result.game_id);
```

This comprehensive API design provides all necessary endpoints for the GameGen platform while maintaining RESTful principles, strong typing, and excellent developer experience.