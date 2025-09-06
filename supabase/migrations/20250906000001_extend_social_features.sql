-- Migration: Extend Social Features for Community Integration
-- Description: Add achievements, activity feeds, notifications, and advanced social features
-- Date: 2025-09-06

-- Achievement system
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE CHECK (length(name) >= 1 AND length(name) <= 100),
    description TEXT NOT NULL CHECK (length(description) <= 500),
    category TEXT NOT NULL CHECK (category IN ('creator', 'social', 'milestone', 'special', 'community')),
    
    -- Achievement configuration
    icon_url TEXT,
    badge_color TEXT DEFAULT '#3B82F6',
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    
    -- Unlock conditions
    conditions JSONB NOT NULL DEFAULT '{}', -- Structured unlock criteria
    is_secret BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    total_unlocked INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievement unlocks
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
    
    -- Unlock details
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    unlock_data JSONB DEFAULT '{}', -- Context about how/when unlocked
    progress_data JSONB DEFAULT '{}', -- For multi-step achievements
    
    -- Display preferences
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    
    UNIQUE(user_id, achievement_id)
);

-- Activity feed system
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Activity details
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'game_created', 'game_published', 'game_liked', 'game_commented',
        'user_followed', 'achievement_unlocked', 'collection_created',
        'template_shared', 'asset_uploaded', 'challenge_completed',
        'game_featured', 'milestone_reached', 'collaboration_joined'
    )),
    
    -- Related entities (optional)
    target_game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    target_collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    target_achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    
    -- Activity metadata
    activity_data JSONB DEFAULT '{}', -- Additional context
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
    
    -- Engagement metrics
    impression_count INTEGER DEFAULT 0,
    engagement_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Composite index for efficient feed queries
    INDEX CONCURRENTLY idx_activities_feed (user_id, created_at DESC),
    INDEX CONCURRENTLY idx_activities_type (activity_type, created_at DESC)
);

-- User notification system
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Notification details
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'follow', 'game_like', 'game_comment', 'game_featured',
        'achievement_unlocked', 'challenge_invite', 'mention',
        'collaboration_invite', 'collection_add', 'system_announcement'
    )),
    
    title TEXT NOT NULL CHECK (length(title) <= 200),
    content TEXT CHECK (length(content) <= 1000),
    
    -- Related entities (optional)
    related_game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    related_comment_id UUID REFERENCES game_comments(id) ON DELETE CASCADE,
    related_activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    
    -- Notification state
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Additional metadata
    action_url TEXT, -- Deep link for notification action
    notification_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX CONCURRENTLY idx_notifications_recipient (recipient_id, created_at DESC),
    INDEX CONCURRENTLY idx_notifications_unread (recipient_id) WHERE is_read = FALSE
);

-- Community challenges and game jams
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Challenge details
    title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
    description TEXT NOT NULL CHECK (length(description) <= 5000),
    short_description TEXT CHECK (length(short_description) <= 300),
    
    -- Challenge configuration
    challenge_type TEXT DEFAULT 'community' CHECK (challenge_type IN ('game_jam', 'weekly', 'themed', 'skill', 'community')),
    difficulty TEXT DEFAULT 'all' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'all')),
    
    -- Timing
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    submission_deadline TIMESTAMPTZ,
    voting_ends_at TIMESTAMPTZ,
    
    -- Rules and constraints
    rules JSONB DEFAULT '{}', -- Challenge-specific rules
    constraints JSONB DEFAULT '{}', -- Technical constraints (engine version, assets, etc.)
    
    -- Participation
    max_participants INTEGER,
    team_size_limit INTEGER DEFAULT 1,
    allow_solo BOOLEAN DEFAULT TRUE,
    allow_teams BOOLEAN DEFAULT FALSE,
    
    -- Rewards and recognition
    prizes JSONB DEFAULT '[]', -- Array of prize objects
    winner_count INTEGER DEFAULT 1,
    
    -- Media
    banner_url TEXT,
    thumbnail_url TEXT,
    
    -- Status and metadata
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'upcoming', 'active', 'voting', 'completed', 'cancelled')),
    participant_count INTEGER DEFAULT 0,
    submission_count INTEGER DEFAULT 0,
    
    -- Visibility and features
    is_featured BOOLEAN DEFAULT FALSE,
    is_official BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CHECK (ends_at > starts_at),
    CHECK (submission_deadline IS NULL OR submission_deadline <= ends_at),
    CHECK (voting_ends_at IS NULL OR voting_ends_at >= COALESCE(submission_deadline, ends_at))
);

-- Challenge participation tracking
CREATE TABLE challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Team information
    team_name TEXT CHECK (length(team_name) <= 100),
    team_members UUID[] DEFAULT '{}', -- Array of user IDs
    team_lead_id UUID REFERENCES profiles(id),
    
    -- Participation details
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'active', 'submitted', 'disqualified', 'withdrawn')),
    
    -- Submission
    submission_game_id UUID REFERENCES games(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ,
    submission_notes TEXT CHECK (length(submission_notes) <= 2000),
    
    UNIQUE(challenge_id, user_id)
);

-- Game ratings and reviews
CREATE TABLE game_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Rating details
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_title TEXT CHECK (length(review_title) <= 200),
    review_content TEXT CHECK (length(review_content) <= 3000),
    
    -- Rating categories (optional detailed ratings)
    gameplay_rating INTEGER CHECK (gameplay_rating >= 1 AND gameplay_rating <= 5),
    graphics_rating INTEGER CHECK (graphics_rating >= 1 AND graphics_rating <= 5),
    audio_rating INTEGER CHECK (audio_rating >= 1 AND audio_rating <= 5),
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    
    -- Review metadata
    is_verified_purchase BOOLEAN DEFAULT FALSE, -- Future: if paid games exist
    playtime_minutes INTEGER,
    completed_game BOOLEAN DEFAULT FALSE,
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Engagement
    helpful_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(game_id, user_id)
);

-- User mentions system
CREATE TABLE mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentioning_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    mentioned_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Context of mention
    context_type TEXT NOT NULL CHECK (context_type IN ('comment', 'review', 'challenge', 'game_description')),
    context_id UUID NOT NULL, -- ID of the context (comment_id, review_id, etc.)
    
    -- Mention details
    mention_text TEXT NOT NULL, -- The text that contained the mention
    position_start INTEGER, -- Character position of mention start
    position_end INTEGER, -- Character position of mention end
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(mentioning_user_id, mentioned_user_id, context_type, context_id)
);

-- User blocking system (for moderation)
CREATE TABLE user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    reason TEXT CHECK (reason IN ('spam', 'harassment', 'inappropriate_content', 'other')),
    notes TEXT CHECK (length(notes) <= 500),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

-- Game report system
CREATE TABLE game_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    reported_game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    
    reason TEXT NOT NULL CHECK (reason IN (
        'inappropriate_content', 'copyright_violation', 'spam',
        'misleading_description', 'broken_game', 'hate_speech', 'other'
    )),
    description TEXT CHECK (length(description) <= 2000),
    
    -- Report processing
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    moderator_notes TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(reporter_id, reported_game_id) -- Prevent duplicate reports from same user
);

-- Trending games materialized view (refreshed periodically)
CREATE MATERIALIZED VIEW trending_games AS
SELECT 
    g.id,
    g.title,
    g.creator_id,
    g.thumbnail_url,
    g.description,
    g.tags,
    g.created_at,
    g.play_count,
    g.like_count,
    g.fork_count,
    -- Trending score calculation
    (
        COALESCE(g.play_count, 0) * 1.0 +
        COALESCE(g.like_count, 0) * 3.0 +
        COALESCE(g.fork_count, 0) * 2.0 +
        -- Time decay factor (newer games get slight boost)
        CASE 
            WHEN g.created_at > NOW() - INTERVAL '7 days' THEN 10.0
            WHEN g.created_at > NOW() - INTERVAL '30 days' THEN 5.0
            ELSE 0.0
        END
    ) / (EXTRACT(EPOCH FROM (NOW() - g.created_at)) / 86400 + 1) as trending_score
FROM games g 
WHERE g.visibility = 'public' 
    AND g.is_featured IS NOT FALSE
ORDER BY trending_score DESC, g.created_at DESC;

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_trending_games_id ON trending_games (id);

-- Function to refresh trending games view
CREATE OR REPLACE FUNCTION refresh_trending_games()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY trending_games;
END;
$$;