# Community Features & Social Integration - Technical Design Document

**Project:** GameGen - AI-powered pixel art game creation platform  
**Priority:** P2  
**Sprint:** 4  
**Estimated Effort:** 36 hours  
**Document Version:** 1.0  
**Date:** September 6, 2025

---

## Executive Summary

The Community Features & Social Integration system transforms GameGen from an isolated game creation platform into a vibrant social ecosystem. This system enables user discovery, engagement, and collaboration while maintaining platform quality through intelligent moderation and curation.

**Key Objectives:**
- Create a comprehensive social graph connecting creators and players
- Implement engagement systems (likes, comments, follows) to drive retention
- Build community discovery mechanisms with intelligent algorithms
- Enable content curation through collections and playlists
- Establish creator recognition through achievements and verification
- Facilitate social sharing and viral growth

**Timeline Constraint:** 3-month MVP delivery with extensible architecture for future enhancements.

---

## Technical Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GameGen Community Platform                        │
├─────────────────────────────────────────────────────────────────────┤
│  Frontend Layer (Next.js 14 + TypeScript + HeroUI)                  │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  User Profiles  │  │  Game Discovery │  │  Social Feeds   │     │
│  │  & Portfolios   │  │  & Collections  │  │  & Activities   │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Achievement    │  │  Community      │  │  Social Sharing │     │
│  │  System         │  │  Moderation     │  │  Integration    │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
├─────────────────────────────────────────────────────────────────────┤
│  API Layer (Next.js API Routes + Supabase Edge Functions)           │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Social Graph   │  │  Content        │  │  Activity Feed  │     │
│  │  Management     │  │  Moderation     │  │  Algorithm      │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Achievement    │  │  Trending       │  │  External API   │     │
│  │  Processing     │  │  Analytics      │  │  Integration    │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
├─────────────────────────────────────────────────────────────────────┤
│  Database Layer (Supabase PostgreSQL)                              │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Social Graph   │  │  Content &      │  │  Activity &     │     │
│  │  Tables         │  │  Moderation     │  │  Analytics      │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Achievements   │  │  Collections    │  │  Vector         │     │
│  │  & Badges       │  │  & Curation     │  │  Embeddings     │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
├─────────────────────────────────────────────────────────────────────┤
│  External Services                                                  │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Social Media   │  │  Image          │  │  AI Moderation  │     │
│  │  APIs (Twitter, │  │  Processing     │  │  (Claude API)   │     │
│  │  Discord)       │  │  (Supabase)     │  │                 │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Components

1. **Social Graph Engine**: Manages user relationships and follows
2. **Activity Feed System**: Real-time activity aggregation with relevance scoring
3. **Content Discovery Engine**: AI-powered game recommendation and trending
4. **Achievement System**: Dynamic progress tracking and badge rewards
5. **Moderation Pipeline**: Automated and manual content review system
6. **Community Curation**: User-driven collections and featured content

---

## Database Schema Extensions

### Enhanced Social Features Schema

The existing social features schema provides a foundation. We'll extend it with additional tables for comprehensive community functionality:

```sql
-- Enhanced user activity tracking
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'game_created', 'game_published', 'game_liked', 'game_commented',
        'user_followed', 'collection_created', 'achievement_earned',
        'game_featured', 'badge_earned'
    )),
    target_id UUID, -- Generic reference (game_id, user_id, etc.)
    target_type TEXT CHECK (target_type IN ('game', 'user', 'collection', 'comment')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievement system
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'creation', 'community', 'engagement', 'milestone', 'special'
    )),
    requirements JSONB NOT NULL, -- Flexible requirement definition
    points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
    progress JSONB DEFAULT '{}', -- Track progress toward completion
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id)
);

-- Enhanced collections with collaboration
CREATE TABLE collection_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'contributor' CHECK (role IN ('contributor', 'moderator')),
    permissions JSONB DEFAULT '{"add": true, "remove": false, "moderate": false}',
    invited_by UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(collection_id, user_id)
);

-- Community challenges and game jams
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 100),
    description TEXT NOT NULL,
    theme TEXT,
    constraints JSONB DEFAULT '{}', -- Technical/creative constraints
    
    -- Timing
    registration_starts TIMESTAMPTZ NOT NULL,
    registration_ends TIMESTAMPTZ NOT NULL,
    challenge_starts TIMESTAMPTZ NOT NULL,
    challenge_ends TIMESTAMPTZ NOT NULL,
    
    -- Configuration
    max_participants INTEGER,
    is_public BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Prizes and recognition
    prizes JSONB DEFAULT '{}',
    
    -- Statistics
    participant_count INTEGER DEFAULT 0,
    submission_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    team_name TEXT,
    submission_game_id UUID REFERENCES games(id),
    
    -- Status tracking
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'active', 'submitted', 'withdrawn')),
    
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    
    UNIQUE(challenge_id, user_id)
);

-- Content reporting and moderation
CREATE TABLE content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('game', 'comment', 'profile', 'collection')),
    content_id UUID NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN (
        'inappropriate_content', 'spam', 'harassment', 'copyright',
        'fake_content', 'violence', 'other'
    )),
    description TEXT,
    
    -- Moderation workflow
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    moderator_id UUID REFERENCES profiles(id),
    moderator_notes TEXT,
    resolution TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Featured content system
CREATE TABLE featured_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('game', 'user', 'collection', 'challenge')),
    content_id UUID NOT NULL,
    featured_by UUID REFERENCES profiles(id) NOT NULL,
    
    -- Feature configuration
    feature_type TEXT NOT NULL CHECK (feature_type IN (
        'hero_spotlight', 'trending_today', 'editor_pick', 'community_favorite'
    )),
    title TEXT,
    description TEXT,
    custom_thumbnail_url TEXT,
    
    -- Scheduling
    featured_from TIMESTAMPTZ DEFAULT NOW(),
    featured_until TIMESTAMPTZ,
    
    -- Metrics
    impression_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social sharing tracking
CREATE TABLE social_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('game', 'collection', 'profile')),
    content_id UUID NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('twitter', 'discord', 'facebook', 'reddit', 'direct_link')),
    share_url TEXT NOT NULL,
    
    -- Tracking
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0, -- Users who signed up from this share
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trending algorithm data
CREATE TABLE trending_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('game', 'user', 'collection')),
    content_id UUID NOT NULL,
    metric_date DATE DEFAULT CURRENT_DATE,
    
    -- Engagement metrics
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    plays INTEGER DEFAULT 0, -- For games
    forks INTEGER DEFAULT 0, -- For games
    
    -- Calculated scores
    engagement_score FLOAT DEFAULT 0,
    trending_score FLOAT DEFAULT 0,
    quality_score FLOAT DEFAULT 0,
    
    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(content_type, content_id, metric_date)
);
```

### Indexes for Performance

```sql
-- Activity feed optimization
CREATE INDEX idx_user_activities_user_created ON user_activities(user_id, created_at DESC);
CREATE INDEX idx_user_activities_type_created ON user_activities(activity_type, created_at DESC);

-- Social graph optimization
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id, created_at DESC);
CREATE INDEX idx_user_follows_following ON user_follows(following_id, created_at DESC);

-- Content discovery optimization
CREATE INDEX idx_games_visibility_trending ON games(visibility, like_count DESC, play_count DESC) WHERE visibility = 'public';
CREATE INDEX idx_trending_metrics_score ON trending_metrics(content_type, trending_score DESC, metric_date DESC);

-- Achievement system optimization
CREATE INDEX idx_user_achievements_user_completed ON user_achievements(user_id, completed_at DESC NULLS LAST);

-- Moderation optimization
CREATE INDEX idx_content_reports_status ON content_reports(status, created_at DESC);
```

---

## API Endpoint Specifications

### RESTful API Architecture

All endpoints follow RESTful conventions with consistent error handling and response formats.

```typescript
// Base response interface
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}
```

### Social Graph Endpoints

```typescript
// Follow/Unfollow System
POST   /api/social/follow
DELETE /api/social/follow/{userId}
GET    /api/social/followers/{userId}?page=1&limit=20
GET    /api/social/following/{userId}?page=1&limit=20

// Social stats
GET    /api/social/stats/{userId}
// Returns: { followers: number, following: number, games: number, likes: number }

interface FollowRequest {
  userId: string;
}

interface FollowResponse {
  followed: boolean;
  followerCount: number;
}
```

### Activity Feed Endpoints

```typescript
// Personal feed (following users)
GET /api/feed/personal?page=1&limit=20&since=2025-01-01T00:00:00Z

// Discover feed (trending/recommended)
GET /api/feed/discover?page=1&limit=20&algorithm=trending

// User activity stream
GET /api/feed/user/{userId}?page=1&limit=20

interface ActivityFeedItem {
  id: string;
  activityType: 'game_created' | 'game_liked' | 'user_followed' | 'achievement_earned';
  user: UserProfile;
  target?: Game | User | Achievement;
  metadata?: any;
  createdAt: string;
  engagementScore: number;
}
```

### Game Engagement Endpoints

```typescript
// Like/Unlike system
POST   /api/games/{gameId}/like
DELETE /api/games/{gameId}/like

// Comments system
GET    /api/games/{gameId}/comments?page=1&limit=20&sort=newest
POST   /api/games/{gameId}/comments
PUT    /api/comments/{commentId}
DELETE /api/comments/{commentId}

// Report content
POST /api/content/report

interface CommentRequest {
  content: string;
  parentCommentId?: string;
}

interface CommentResponse {
  id: string;
  content: string;
  author: UserProfile;
  parentCommentId?: string;
  isEdited: boolean;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### Collections Endpoints

```typescript
// Collection management
GET    /api/collections/user/{userId}?page=1&limit=20
POST   /api/collections
PUT    /api/collections/{collectionId}
DELETE /api/collections/{collectionId}

// Collection games
GET    /api/collections/{collectionId}/games?page=1&limit=20
POST   /api/collections/{collectionId}/games
DELETE /api/collections/{collectionId}/games/{gameId}

// Collaboration
POST   /api/collections/{collectionId}/collaborators
PUT    /api/collections/{collectionId}/collaborators/{userId}
DELETE /api/collections/{collectionId}/collaborators/{userId}

interface CollectionRequest {
  name: string;
  description?: string;
  isPublic: boolean;
  isCollaborative: boolean;
}
```

### Achievement System Endpoints

```typescript
// User achievements
GET /api/users/{userId}/achievements?category=all&completed=true
GET /api/achievements?category=creation&active=true

// Achievement progress
GET /api/users/{userId}/achievement-progress

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: 'creation' | 'community' | 'engagement' | 'milestone' | 'special';
  points: number;
  requirements: any;
  completedAt?: string;
  progress?: any;
}
```

### Community Discovery Endpoints

```typescript
// Trending content
GET /api/discover/trending?type=games&timeframe=24h&page=1&limit=20

// Search with social signals
GET /api/search?q=pixel+platformer&type=games&social=true&page=1&limit=20

// Personalized recommendations
GET /api/discover/recommended?type=games&userId={userId}&page=1&limit=20

interface TrendingItem {
  id: string;
  type: 'game' | 'user' | 'collection';
  content: Game | UserProfile | Collection;
  metrics: {
    views: number;
    likes: number;
    shares: number;
    engagementScore: number;
    trendingScore: number;
  };
  trendingRank: number;
}
```

### Challenge System Endpoints

```typescript
// Challenge management
GET  /api/challenges?status=active&featured=true&page=1&limit=20
GET  /api/challenges/{challengeId}
POST /api/challenges (admin/verified users only)

// Participation
POST   /api/challenges/{challengeId}/join
DELETE /api/challenges/{challengeId}/leave
POST   /api/challenges/{challengeId}/submit

interface ChallengeRequest {
  title: string;
  description: string;
  theme?: string;
  constraints?: any;
  registrationStarts: string;
  registrationEnds: string;
  challengeStarts: string;
  challengeEnds: string;
  maxParticipants?: number;
  isPublic: boolean;
  prizes?: any;
}
```

---

## Component Architecture

### React Component Hierarchy

```
community/
├── profiles/
│   ├── UserProfilePage.tsx           // Complete profile view
│   ├── UserProfileCard.tsx           // Compact profile display
│   ├── UserGamePortfolio.tsx         // Games showcase
│   ├── UserAchievements.tsx          // Achievement display
│   ├── UserStats.tsx                 // Follower/following stats
│   └── FollowButton.tsx              // Follow/unfollow action
├── social/
│   ├── ActivityFeed.tsx              // Main activity stream
│   ├── ActivityFeedItem.tsx          // Individual activity
│   ├── PersonalFeed.tsx              // Following-based feed
│   ├── DiscoverFeed.tsx              // Trending/recommended
│   ├── FollowSuggestions.tsx         // Who to follow
│   └── SocialShareButton.tsx         // Share to social media
├── engagement/
│   ├── LikeButton.tsx                // Like/unlike with animation
│   ├── CommentSystem.tsx             // Complete commenting
│   ├── CommentThread.tsx             // Nested comment display
│   ├── CommentForm.tsx               // Comment creation/editing
│   └── ReportModal.tsx               // Content reporting
├── collections/
│   ├── CollectionGrid.tsx            // Collections display
│   ├── CollectionCard.tsx            // Individual collection
│   ├── CollectionCreator.tsx         // Create new collection
│   ├── CollectionGameList.tsx        // Games in collection
│   └── CollaboratorManager.tsx       // Manage collection access
├── discovery/
│   ├── TrendingGames.tsx             // Trending games widget
│   ├── FeaturedContent.tsx           // Editor picks/featured
│   ├── GameRecommendations.tsx       // Personalized suggestions
│   ├── SearchWithSocial.tsx          // Enhanced search
│   └── CategoryBrowser.tsx           // Browse by category
├── achievements/
│   ├── AchievementBadge.tsx          // Individual achievement
│   ├── AchievementProgress.tsx       // Progress indicators
│   ├── AchievementNotification.tsx   // Achievement unlock popup
│   └── LeaderboardWidget.tsx         // Top creators/achievers
├── challenges/
│   ├── ChallengeBrowser.tsx          // Browse challenges
│   ├── ChallengeCard.tsx             // Challenge summary
│   ├── ChallengeDetail.tsx           // Full challenge view
│   ├── ChallengeParticipation.tsx    // Join/submit interface
│   └── ChallengeResults.tsx          // Winners/submissions
├── moderation/
│   ├── ContentModerationTools.tsx    // Admin moderation
│   ├── ReportQueue.tsx               // Manage reports
│   ├── FeaturedContentManager.tsx    // Manage featured content
│   └── CommunityGuidelines.tsx       // Guidelines display
└── shared/
    ├── SocialMetaTags.tsx            // Open Graph tags
    ├── VirialityIndicator.tsx        // Share/engagement metrics
    ├── CommunityBreadcrumbs.tsx      // Navigation breadcrumbs
    └── UserVerificationBadge.tsx     // Verified user indicator
```

### Key Component Specifications

#### UserProfilePage Component

```typescript
interface UserProfilePageProps {
  userId: string;
  currentUserId?: string;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({
  userId,
  currentUserId
}) => {
  const { user, games, achievements, stats, isLoading } = useUserProfile(userId);
  const { isFollowing, followUser, unfollowUser } = useFollowStatus(userId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-teal-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-8 border border-white/20">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar 
              src={user?.avatar_url} 
              size="xl"
              className="ring-4 ring-white/20"
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">
                  {user?.display_name || user?.username}
                </h1>
                {user?.is_verified && <UserVerificationBadge />}
              </div>
              
              <p className="text-white/80 mb-4">{user?.bio}</p>
              
              <UserStats 
                followers={stats?.followers || 0}
                following={stats?.following || 0}
                games={stats?.games || 0}
                likes={stats?.likes || 0}
              />
              
              {currentUserId && currentUserId !== userId && (
                <FollowButton
                  isFollowing={isFollowing}
                  onFollow={() => followUser()}
                  onUnfollow={() => unfollowUser()}
                  className="mt-4"
                />
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="games" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="games">Games ({stats?.games})</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="games">
            <UserGamePortfolio userId={userId} />
          </TabsContent>
          
          <TabsContent value="achievements">
            <UserAchievements userId={userId} />
          </TabsContent>
          
          <TabsContent value="collections">
            <CollectionGrid userId={userId} />
          </TabsContent>
          
          <TabsContent value="activity">
            <ActivityFeed userId={userId} type="user" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
```

#### ActivityFeed Component

```typescript
interface ActivityFeedProps {
  type: 'personal' | 'discover' | 'user';
  userId?: string;
  algorithm?: 'chronological' | 'trending' | 'relevant';
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  type,
  userId,
  algorithm = 'relevant'
}) => {
  const {
    activities,
    isLoading,
    hasMore,
    fetchMore,
    refresh
  } = useActivityFeed({ type, userId, algorithm });

  return (
    <div className="space-y-6">
      {/* Feed Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">
            {type === 'personal' && 'Following'}
            {type === 'discover' && 'Discover'}
            {type === 'user' && 'Activity'}
          </h2>
          
          {type !== 'user' && (
            <Select value={algorithm} onValueChange={setAlgorithm}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevant">Most Relevant</SelectItem>
                <SelectItem value="chronological">Latest</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        
        <Button
          onClick={refresh}
          variant="ghost"
          size="sm"
          className="text-white/70 hover:text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Activity Items */}
      <div className="space-y-4">
        {activities.map((activity) => (
          <ActivityFeedItem
            key={activity.id}
            activity={activity}
            showEngagement={type === 'discover'}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-8">
          <Button
            onClick={fetchMore}
            disabled={isLoading}
            className="bg-white/10 backdrop-blur-md hover:bg-white/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
```

---

## UI/UX Flow Diagrams

### User Journey: Discovering and Engaging with Community

```
User Login
    │
    ▼
┌─────────────────────┐
│   Dashboard Home    │ ◄─── Direct navigation
│                     │
│ • Personal Feed     │
│ • Trending Games    │
│ • Achievements      │
│ • Quick Create      │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│   Discover Feed     │
│                     │
│ • Algorithm Choice  │
│ • Featured Content  │
│ • Trending Items    │
│ • Recommendations   │
└─────────────────────┘
    │
    ▼ (User clicks on interesting game)
┌─────────────────────┐
│   Game Detail       │
│                     │
│ • Play Button       │ ──────┐
│ • Like/Comment      │       │
│ • Creator Profile   │       │
│ • Similar Games     │       │
└─────────────────────┘       │
    │                         │
    ▼ (User clicks creator)    │
┌─────────────────────┐       │
│  Creator Profile    │       │
│                     │       │
│ • Follow Button     │       │
│ • Game Portfolio    │       │
│ • Achievements      │       │
│ • Collections       │       │
└─────────────────────┘       │
    │                         │
    ▼ (User follows)           │
┌─────────────────────┐       │
│  Personal Feed      │       │
│  Updated            │       │
│                     │       │
│ • Creator's new     │       │
│   activities shown  │       │
└─────────────────────┘       │
                              │
                              ▼ (User plays game)
                        ┌─────────────────────┐
                        │   Game Player       │
                        │                     │
                        │ • Embedded Toxoid   │
                        │ • Post-play Actions │
                        │   - Rate/Comment    │
                        │   - Add to Collection│
                        │   - Share           │
                        │   - Fork (Pro users)│
                        └─────────────────────┘
```

### Social Interaction Flow

```
User sees interesting game
    │
    ▼
┌─────────────────────┐
│   Like Button       │ ──── Immediate feedback
│   Animation         │      • Heart animation
└─────────────────────┘      • Count update
    │                        • Activity logged
    ▼
┌─────────────────────┐
│   Comment Section   │
│                     │
│ • View existing     │ ──── Thread expansion
│ • Add new comment   │      • Nested replies
│ • Report option     │      • Rich formatting
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  Share Options      │
│                     │
│ • Twitter/X         │ ──── External sharing
│ • Discord           │      • Custom messaging
│ • Direct Link       │      • Open Graph tags
│ • Copy Link         │      • Tracking pixels
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  Add to Collection  │
│                     │
│ • Existing colls    │ ──── Collection mgmt
│ • Create new        │      • Quick create
│ • Collaborative    │      • Permission check
└─────────────────────┘
```

### Achievement Unlock Flow

```
User performs action
    │
    ▼
┌─────────────────────┐
│  Achievement Check  │ ──── Server-side logic
│  (Background)       │      • Progress update
└─────────────────────┘      • Completion check
    │
    ▼ (Achievement unlocked)
┌─────────────────────┐
│  Achievement        │ ──── Visual feedback
│  Notification       │      • Modal popup
│                     │      • Confetti animation
│ • Badge icon        │      • Sound effect
│ • Title/Description │      • Social sharing
│ • Points earned     │      • XP progress
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  Profile Updated    │ ──── Persistent display
│                     │      • Badge collection
│ • New achievement   │      • Leaderboard update
│   added to profile  │      • Social activity
│ • Points added      │      
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  Activity Feed      │ ──── Social amplification
│  Update             │      • Achievement activity
│                     │      • Follower notifications
│ • "User earned X"   │      • Engagement boost
│   activity created  │
└─────────────────────┘
```

---

## Technical Implementation Plan

### Phase 1: Foundation (Sprint 4.1 - 12 hours)

**Database Schema Implementation**
- [ ] Extend existing social tables with new features
- [ ] Create achievement system tables
- [ ] Add trending metrics and analytics tables
- [ ] Implement proper indexes for performance
- [ ] Create database migration scripts

**API Foundation**
- [ ] Implement core social graph endpoints
- [ ] Create activity feed API infrastructure
- [ ] Add achievement system APIs
- [ ] Set up content moderation endpoints

**Component Foundation**
- [ ] Create base social component library
- [ ] Implement UserProfileCard component
- [ ] Build FollowButton with optimistic updates
- [ ] Create ActivityFeedItem component

### Phase 2: Core Social Features (Sprint 4.2 - 12 hours)

**User Profiles and Portfolios**
- [ ] Complete UserProfilePage implementation
- [ ] Build UserGamePortfolio showcase
- [ ] Implement UserAchievements display
- [ ] Add social stats and analytics

**Activity Feeds**
- [ ] Implement PersonalFeed (following-based)
- [ ] Create DiscoverFeed (trending algorithm)
- [ ] Build activity aggregation system
- [ ] Add real-time feed updates

**Engagement Systems**
- [ ] Complete like/unlike functionality
- [ ] Implement comment system with threading
- [ ] Add content reporting features
- [ ] Build social sharing integration

### Phase 3: Advanced Community Features (Sprint 4.3 - 12 hours)

**Collections and Curation**
- [ ] Implement collection creation/management
- [ ] Add collaborative collection features
- [ ] Build collection discovery system
- [ ] Create curated playlists

**Achievement System**
- [ ] Implement achievement progress tracking
- [ ] Create achievement unlock notifications
- [ ] Build achievement-based recommendations
- [ ] Add gamification elements

**Community Discovery**
- [ ] Implement trending algorithm
- [ ] Create personalized recommendations
- [ ] Build featured content system
- [ ] Add community challenges (basic)

---

## Integration Points with Existing Systems

### Game Creator Integration

The community features deeply integrate with the existing game creator:

```typescript
// Enhanced game save with social metadata
interface GameSavePayload {
  // Existing game data
  gameData: GameData;
  title: string;
  description: string;
  
  // New social metadata
  visibility: 'private' | 'unlisted' | 'public';
  tags: string[];
  allowComments: boolean;
  allowForks: boolean;
  
  // Achievement triggers
  triggerAchievements: boolean;
}

// Integration with chat panel for social features
const GameCreatorChatPanel = () => {
  const { shareToSocial, addToCollection } = useSocialFeatures();
  
  // Add social actions to chat commands
  const socialCommands = [
    {
      command: '/share',
      action: () => shareToSocial('current_game'),
      description: 'Share current game to social media'
    },
    {
      command: '/save-to-collection',
      action: () => addToCollection('current_game'),
      description: 'Add game to a collection'
    }
  ];
};
```

### Authentication System Integration

Enhanced user profiles with social features:

```typescript
// Extended user context
interface UserContextValue {
  // Existing auth data
  user: User | null;
  session: Session | null;
  
  // New social data
  socialStats: {
    followers: number;
    following: number;
    games: number;
    achievements: number;
  };
  
  unreadActivities: number;
  recentAchievements: Achievement[];
  
  // Social actions
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  updateSocialStats: () => Promise<void>;
}
```

### Navigation Integration

Enhanced navigation with social indicators:

```typescript
const AuthNavbar = () => {
  const { unreadActivities, recentAchievements } = useUser();
  
  return (
    <nav className="...">
      {/* Existing nav items */}
      
      {/* New social nav items */}
      <Button variant="ghost" href="/community">
        <Users className="h-4 w-4 mr-2" />
        Community
      </Button>
      
      <Button variant="ghost" href="/feed">
        <Activity className="h-4 w-4 mr-2" />
        Feed
        {unreadActivities > 0 && (
          <Badge className="ml-2">{unreadActivities}</Badge>
        )}
      </Button>
      
      <Button variant="ghost" href="/achievements">
        <Award className="h-4 w-4 mr-2" />
        Achievements
        {recentAchievements.length > 0 && (
          <Badge className="ml-2">New!</Badge>
        )}
      </Button>
    </nav>
  );
};
```

---

## Security Considerations

### Content Moderation Pipeline

```typescript
interface ContentModerationSystem {
  // Automated screening
  autoModerate: (content: ContentItem) => ModerationResult;
  
  // Manual review queue
  addToReviewQueue: (content: ContentItem, reason: string) => void;
  
  // Community reporting
  reportContent: (contentId: string, reason: ReportReason) => void;
  
  // Action enforcement
  enforceAction: (contentId: string, action: ModerationAction) => void;
}

enum ModerationAction {
  APPROVE = 'approve',
  FLAG = 'flag',
  HIDE = 'hide',
  REMOVE = 'remove',
  BAN_USER = 'ban_user'
}

// Automated content screening using Claude AI
const autoModerateContent = async (content: string): Promise<ModerationResult> => {
  const prompt = `
    Analyze this user-generated content for community safety:
    Content: "${content}"
    
    Check for:
    - Inappropriate language
    - Harassment or bullying
    - Spam or promotional content
    - Harmful instructions
    - Copyright violations
    
    Respond with JSON: { "safe": boolean, "issues": string[], "confidence": number }
  `;
  
  const response = await claudeAPI.analyze(prompt);
  return JSON.parse(response);
};
```

### Privacy and Data Protection

```typescript
interface PrivacySettings {
  profile: {
    showEmail: boolean;
    showRealName: boolean;
    showLocation: boolean;
    showWebsite: boolean;
  };
  
  activity: {
    showGameActivity: boolean;
    showFollowActivity: boolean;
    showAchievements: boolean;
    allowTagging: boolean;
  };
  
  communication: {
    allowDirectMessages: boolean;
    allowCollabInvites: boolean;
    allowMentions: boolean;
  };
}

// Privacy-aware data queries
const getUserProfile = async (userId: string, viewerId?: string) => {
  const profile = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  // Apply privacy filters based on relationship
  return applyPrivacyFilters(profile, viewerId);
};
```

### Rate Limiting and Abuse Prevention

```typescript
interface RateLimitConfig {
  follows: { limit: 100, window: '1h' };
  likes: { limit: 1000, window: '1h' };
  comments: { limit: 50, window: '1h' };
  reports: { limit: 10, window: '24h' };
  gameCreation: { limit: 10, window: '24h' };
}

// Implement rate limiting middleware
const rateLimitMiddleware = (action: keyof RateLimitConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const config = RateLimitConfig[action];
    
    const current = await redis.get(`rate_limit:${action}:${userId}`);
    if (current && parseInt(current) >= config.limit) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many ${action} requests. Try again later.`
        }
      });
    }
    
    await redis.incr(`rate_limit:${action}:${userId}`);
    await redis.expire(`rate_limit:${action}:${userId}`, parseTimeWindow(config.window));
    
    next();
  };
};
```

---

## Performance Optimization

### Database Query Optimization

```sql
-- Materialized view for user stats (updated via triggers)
CREATE MATERIALIZED VIEW user_social_stats AS
SELECT 
    p.id as user_id,
    COALESCE(follower_counts.followers, 0) as followers,
    COALESCE(following_counts.following, 0) as following,
    COALESCE(game_counts.games, 0) as games,
    COALESCE(like_counts.likes_received, 0) as likes_received,
    COALESCE(achievement_counts.achievements, 0) as achievements
FROM profiles p
LEFT JOIN (
    SELECT following_id, COUNT(*) as followers 
    FROM user_follows 
    GROUP BY following_id
) follower_counts ON p.id = follower_counts.following_id
LEFT JOIN (
    SELECT follower_id, COUNT(*) as following 
    FROM user_follows 
    GROUP BY follower_id
) following_counts ON p.id = following_counts.follower_id
LEFT JOIN (
    SELECT creator_id, COUNT(*) as games 
    FROM games 
    WHERE visibility = 'public'
    GROUP BY creator_id
) game_counts ON p.id = game_counts.creator_id
LEFT JOIN (
    SELECT g.creator_id, COUNT(*) as likes_received
    FROM game_likes gl
    JOIN games g ON gl.game_id = g.id
    GROUP BY g.creator_id
) like_counts ON p.id = like_counts.creator_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as achievements
    FROM user_achievements
    WHERE completed_at IS NOT NULL
    GROUP BY user_id
) achievement_counts ON p.id = achievement_counts.user_id;

-- Refresh stats periodically
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_social_stats;
END;
$$ LANGUAGE plpgsql;

-- Schedule stats refresh every 15 minutes
SELECT cron.schedule('refresh-user-stats', '*/15 * * * *', 'SELECT refresh_user_stats();');
```

### Caching Strategy

```typescript
interface CacheStrategy {
  // Redis caching for frequently accessed data
  userProfiles: {
    key: (userId: string) => `profile:${userId}`;
    ttl: 300; // 5 minutes
  };
  
  activityFeeds: {
    key: (userId: string, type: string) => `feed:${type}:${userId}`;
    ttl: 600; // 10 minutes
  };
  
  trendingContent: {
    key: (type: string) => `trending:${type}`;
    ttl: 1800; // 30 minutes
  };
  
  gameMetadata: {
    key: (gameId: string) => `game:${gameId}`;
    ttl: 3600; // 1 hour
  };
}

// Cache implementation with automatic invalidation
class SocialCache {
  private redis: Redis;
  
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const cached = await this.redis.get(`profile:${userId}`);
    if (cached) return JSON.parse(cached);
    
    const profile = await fetchUserProfile(userId);
    if (profile) {
      await this.redis.setex(`profile:${userId}`, 300, JSON.stringify(profile));
    }
    
    return profile;
  }
  
  async invalidateUserProfile(userId: string): Promise<void> {
    await this.redis.del(`profile:${userId}`);
    // Also invalidate related activity feeds
    await this.redis.del(`feed:personal:${userId}`);
    await this.redis.del(`feed:user:${userId}`);
  }
}
```

### Real-time Updates

```typescript
// WebSocket integration for real-time social features
interface RealTimeSocialEvents {
  'user:followed': { followerId: string; followingId: string };
  'game:liked': { userId: string; gameId: string; likeCount: number };
  'comment:created': { comment: Comment; gameId: string };
  'achievement:unlocked': { userId: string; achievement: Achievement };
}

class SocialRealtimeManager {
  private supabase: SupabaseClient;
  
  constructor() {
    this.setupRealtimeSubscriptions();
  }
  
  private setupRealtimeSubscriptions() {
    // Listen for new activities
    this.supabase
      .channel('user_activities')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_activities'
      }, (payload) => {
        this.broadcastActivity(payload.new);
      })
      .subscribe();
      
    // Listen for new follows
    this.supabase
      .channel('user_follows')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_follows'
      }, (payload) => {
        this.broadcastFollow(payload.new);
      })
      .subscribe();
  }
  
  private broadcastActivity(activity: UserActivity) {
    // Notify followers of this user's activity
    this.notifyFollowers(activity.user_id, {
      type: 'activity:created',
      data: activity
    });
  }
}
```

### Image and Asset Optimization

```typescript
// Optimized image handling for social features
interface ImageOptimizationConfig {
  avatars: {
    sizes: [64, 128, 256];
    format: 'webp';
    quality: 85;
  };
  
  gameThumbnails: {
    sizes: [320, 640, 1280];
    format: 'webp';
    quality: 80;
  };
  
  achievementIcons: {
    sizes: [32, 64];
    format: 'webp';
    quality: 90;
  };
}

const optimizeAndUploadImage = async (
  file: File,
  type: keyof ImageOptimizationConfig,
  userId: string
): Promise<string[]> => {
  const config = ImageOptimizationConfig[type];
  const optimizedVersions: string[] = [];
  
  for (const size of config.sizes) {
    const optimized = await sharp(await file.arrayBuffer())
      .resize(size, size, { fit: 'cover' })
      .webp({ quality: config.quality })
      .toBuffer();
      
    const fileName = `${type}/${userId}/${size}.webp`;
    const { data } = await supabase.storage
      .from('social-images')
      .upload(fileName, optimized, {
        contentType: 'image/webp',
        cacheControl: '31536000' // 1 year cache
      });
      
    if (data) {
      optimizedVersions.push(data.path);
    }
  }
  
  return optimizedVersions;
};
```

---

## Timeline and Milestones

### Sprint 4.1 (Week 1 - 12 hours)
**Foundation & Database Setup**

- [ ] **Day 1-2 (4h)**: Database schema extensions and migrations
  - Implement new social tables (achievements, challenges, trending)
  - Add proper indexes and constraints
  - Create migration scripts with rollback support
  - Test schema with sample data

- [ ] **Day 3-4 (4h)**: Core API infrastructure
  - Social graph endpoints (follow/unfollow)
  - Activity feed API foundation
  - Achievement system APIs
  - Basic content moderation endpoints

- [ ] **Day 5-6 (4h)**: Base component library
  - UserProfileCard component
  - FollowButton with optimistic updates
  - ActivityFeedItem component
  - Social sharing utilities

### Sprint 4.2 (Week 2 - 12 hours)
**Core Social Features**

- [ ] **Day 1-2 (4h)**: User profiles and portfolios
  - Complete UserProfilePage implementation
  - UserGamePortfolio showcase component
  - UserAchievements display system
  - Social stats integration

- [ ] **Day 3-4 (4h)**: Activity feed system
  - PersonalFeed (following-based activities)
  - DiscoverFeed (trending algorithm)
  - Activity aggregation and ranking
  - Real-time feed updates via WebSocket

- [ ] **Day 5-6 (4h)**: Engagement systems
  - Like/unlike functionality with animations
  - Comment system with threading support
  - Content reporting and moderation
  - Social sharing to external platforms

### Sprint 4.3 (Week 3 - 12 hours)
**Advanced Community Features**

- [ ] **Day 1-2 (4h)**: Collections and curation
  - Collection creation and management UI
  - Collaborative collection features
  - Collection discovery and browsing
  - Curated playlist functionality

- [ ] **Day 3-4 (4h)**: Achievement system
  - Achievement progress tracking
  - Unlock notifications and animations
  - Achievement-based recommendations
  - Leaderboard and recognition systems

- [ ] **Day 5-6 (4h)**: Community discovery
  - Trending algorithm implementation
  - Personalized game recommendations
  - Featured content management system
  - Basic community challenges framework

### Success Metrics

**Technical Metrics:**
- API response times < 200ms for 95% of requests
- Database queries optimized for < 50ms execution
- Real-time updates delivered within 1 second
- Image optimization achieving 60% size reduction

**User Experience Metrics:**
- Profile page load times < 2 seconds
- Activity feed refresh < 1 second
- Social actions (like/follow) < 500ms response
- Achievement unlock animations smooth at 60fps

**Performance Targets:**
- Support 1,000 concurrent users
- Handle 10,000 daily active users
- Process 100,000 social interactions per day
- Maintain 99.9% uptime for social features

---

## Risk Mitigation

### Technical Risks

**Database Performance Under Load**
- Risk: Social queries becoming slow with large datasets
- Mitigation: Implement proper indexing, query optimization, and caching layers
- Contingency: Add read replicas and implement query result pagination

**Real-time Feature Scalability**
- Risk: WebSocket connections overwhelming server resources
- Mitigation: Implement connection pooling and selective subscription model
- Contingency: Fallback to polling-based updates for non-critical features

**Content Moderation Overwhelm**
- Risk: Manual moderation queue growing beyond manageable size
- Mitigation: Implement AI-powered pre-screening and community flagging
- Contingency: Temporary auto-moderation with higher sensitivity thresholds

### Product Risks

**Low Initial Engagement**
- Risk: Users not adopting social features due to empty network
- Mitigation: Implement strong onboarding flow and seed content from creators
- Contingency: Gamification incentives and achievement rewards for early adopters

**Content Quality Concerns**
- Risk: Low-quality or inappropriate content affecting platform reputation
- Mitigation: Curator approval system for featured content and verified creators
- Contingency: Community voting system for content quality assessment

### Security Risks

**Social Engineering and Abuse**
- Risk: Bad actors manipulating social systems for gain
- Mitigation: Rate limiting, behavioral analysis, and community reporting
- Contingency: Manual review escalation and temporary feature restrictions

**Privacy Violations**
- Risk: Unintended exposure of private user information
- Mitigation: Comprehensive privacy settings and data access auditing
- Contingency: Immediate privacy lockdown mode and user notification system

---

## Post-Launch Roadmap

### Phase 4: Advanced Social Features (Month 4-5)
- Advanced community challenges with prizes
- Creator monetization through tips and commissions
- Advanced collaborative game development tools
- Community-driven game jams with integrated voting

### Phase 5: AI-Powered Community (Month 6)
- AI-powered game recommendations based on social graph
- Intelligent content curation using machine learning
- Automated community insights and trend analysis
- AI-assisted community moderation with learning capabilities

### Phase 6: Platform Expansion (Month 7+)
- Mobile app with social features
- Integration with external gaming platforms
- Advanced analytics dashboard for creators
- White-label community solutions for educational institutions

---

This technical design document provides a comprehensive roadmap for implementing the Community Features & Social Integration system within the 3-month timeline constraint while maintaining extensibility for future enhancements. The architecture leverages GameGen's existing tech stack and follows established patterns to ensure seamless integration with the current platform.

The modular design allows for incremental deployment and testing, with each sprint delivering tangible value to users while building toward the complete social ecosystem vision.