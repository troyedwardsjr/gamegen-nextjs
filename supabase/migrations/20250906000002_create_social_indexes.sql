-- Migration: Create Indexes for Social Features Performance
-- Description: Comprehensive indexing strategy for social features
-- Date: 2025-09-06

-- Achievement system indexes
CREATE INDEX CONCURRENTLY idx_achievements_category ON achievements(category, is_active);
CREATE INDEX CONCURRENTLY idx_achievements_rarity ON achievements(rarity, is_active);
CREATE INDEX CONCURRENTLY idx_user_achievements_user ON user_achievements(user_id, unlocked_at DESC);
CREATE INDEX CONCURRENTLY idx_user_achievements_featured ON user_achievements(user_id) WHERE is_featured = TRUE;

-- Activity feed indexes (most critical for performance)
CREATE INDEX CONCURRENTLY idx_activities_user_time ON activities(user_id, created_at DESC) WHERE visibility IN ('public', 'followers');
CREATE INDEX CONCURRENTLY idx_activities_type_time ON activities(activity_type, created_at DESC);
CREATE INDEX CONCURRENTLY idx_activities_target_game ON activities(target_game_id, created_at DESC) WHERE target_game_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_activities_engagement ON activities(engagement_count DESC, created_at DESC) WHERE visibility = 'public';

-- Notification system indexes
CREATE INDEX CONCURRENTLY idx_notifications_recipient_unread ON notifications(recipient_id, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX CONCURRENTLY idx_notifications_type ON notifications(notification_type, created_at DESC);
CREATE INDEX CONCURRENTLY idx_notifications_sender ON notifications(sender_id, created_at DESC) WHERE sender_id IS NOT NULL;

-- Challenge system indexes
CREATE INDEX CONCURRENTLY idx_challenges_status_time ON challenges(status, starts_at, ends_at);
CREATE INDEX CONCURRENTLY idx_challenges_featured ON challenges(is_featured, starts_at) WHERE is_featured = TRUE;
CREATE INDEX CONCURRENTLY idx_challenges_type ON challenges(challenge_type, status);
CREATE INDEX CONCURRENTLY idx_challenge_participants_user ON challenge_participants(user_id, joined_at DESC);
CREATE INDEX CONCURRENTLY idx_challenge_participants_status ON challenge_participants(challenge_id, status);

-- Game ratings and reviews indexes
CREATE INDEX CONCURRENTLY idx_game_ratings_game ON game_ratings(game_id, rating DESC, created_at DESC);
CREATE INDEX CONCURRENTLY idx_game_ratings_user ON game_ratings(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_game_ratings_featured ON game_ratings(game_id, created_at DESC) WHERE is_featured = TRUE;
CREATE INDEX CONCURRENTLY idx_game_ratings_verified ON game_ratings(game_id, rating DESC) WHERE is_verified_purchase = TRUE;

-- Social graph indexes (for follow system)
CREATE INDEX CONCURRENTLY idx_user_follows_follower ON user_follows(follower_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_user_follows_following ON user_follows(following_id, created_at DESC);

-- Game social features indexes
CREATE INDEX CONCURRENTLY idx_game_likes_user ON game_likes(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_game_likes_game ON game_likes(game_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_game_comments_game ON game_comments(game_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX CONCURRENTLY idx_game_comments_author ON game_comments(author_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_game_comments_parent ON game_comments(parent_comment_id, created_at ASC) WHERE parent_comment_id IS NOT NULL;

-- Collection system indexes
CREATE INDEX CONCURRENTLY idx_collections_creator ON collections(creator_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_collections_public ON collections(is_public, created_at DESC) WHERE is_public = TRUE;
CREATE INDEX CONCURRENTLY idx_collection_games_collection ON collection_games(collection_id, order_index ASC);
CREATE INDEX CONCURRENTLY idx_collection_games_game ON collection_games(game_id, created_at DESC);

-- Mention system indexes
CREATE INDEX CONCURRENTLY idx_mentions_mentioned_user ON mentions(mentioned_user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_mentions_context ON mentions(context_type, context_id);

-- Moderation system indexes
CREATE INDEX CONCURRENTLY idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX CONCURRENTLY idx_user_blocks_blocked ON user_blocks(blocked_id);
CREATE INDEX CONCURRENTLY idx_game_reports_status ON game_reports(status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_game_reports_game ON game_reports(reported_game_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_game_reports_reporter ON game_reports(reporter_id, created_at DESC);

-- Full-text search indexes
CREATE INDEX CONCURRENTLY idx_challenges_text_search ON challenges USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX CONCURRENTLY idx_game_ratings_text_search ON game_ratings USING gin(to_tsvector('english', COALESCE(review_title, '') || ' ' || COALESCE(review_content, '')));

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_user_activity_feed ON activities(user_id, activity_type, created_at DESC) WHERE visibility IN ('public', 'followers');
CREATE INDEX CONCURRENTLY idx_game_social_stats ON games(visibility, like_count DESC, play_count DESC, created_at DESC) WHERE visibility = 'public';

-- Partial indexes for better performance on filtered queries
CREATE INDEX CONCURRENTLY idx_games_featured ON games(created_at DESC, like_count DESC) WHERE is_featured = TRUE AND visibility = 'public';
CREATE INDEX CONCURRENTLY idx_challenges_active ON challenges(starts_at, ends_at, participant_count DESC) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_notifications_system ON notifications(recipient_id, created_at DESC) WHERE notification_type = 'system_announcement';

-- Indexes for real-time features
CREATE INDEX CONCURRENTLY idx_activities_realtime ON activities(created_at DESC) WHERE created_at > NOW() - INTERVAL '1 hour';
CREATE INDEX CONCURRENTLY idx_notifications_realtime ON notifications(recipient_id, created_at DESC) WHERE created_at > NOW() - INTERVAL '24 hours' AND is_read = FALSE;