-- Migration: Row Level Security Policies for Social Features
-- Description: Comprehensive RLS policies for social features security
-- Date: 2025-09-06

-- Enable RLS on all social tables
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_reports ENABLE ROW LEVEL SECURITY;

-- Achievement Policies
-- Anyone can view active achievements
CREATE POLICY "achievements_select_public" ON achievements
    FOR SELECT USING (is_active = true AND (is_secret = false OR id IN (
        SELECT achievement_id FROM user_achievements WHERE user_id = auth.uid()
    )));

-- Only admins can manage achievements
CREATE POLICY "achievements_admin_all" ON achievements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (
                subscription_tier = 'enterprise' OR 
                email LIKE '%@gamegen.com'
            )
        )
    );

-- User Achievement Policies
-- Users can view their own achievements and public achievements of others
CREATE POLICY "user_achievements_select" ON user_achievements
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (is_public = true AND user_id IN (
            SELECT id FROM profiles WHERE id IS NOT NULL
        ))
    );

-- Users can only insert their own achievements (triggered by system)
CREATE POLICY "user_achievements_insert_own" ON user_achievements
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own achievement display preferences
CREATE POLICY "user_achievements_update_own" ON user_achievements
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Activity Feed Policies
-- Users can view public activities and activities from users they follow
CREATE POLICY "activities_select_visible" ON activities
    FOR SELECT USING (
        visibility = 'public' OR
        (visibility = 'followers' AND (
            user_id = auth.uid() OR
            user_id IN (
                SELECT following_id FROM user_follows WHERE follower_id = auth.uid()
            )
        )) OR
        (visibility = 'private' AND user_id = auth.uid())
    );

-- Users can only insert their own activities
CREATE POLICY "activities_insert_own" ON activities
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own activities
CREATE POLICY "activities_update_own" ON activities
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Notification Policies
-- Users can only view their own notifications
CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT USING (recipient_id = auth.uid());

-- System can insert notifications for any user
CREATE POLICY "notifications_insert_system" ON notifications
    FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own" ON notifications
    FOR DELETE USING (recipient_id = auth.uid());

-- Challenge Policies
-- Everyone can view published challenges
CREATE POLICY "challenges_select_public" ON challenges
    FOR SELECT USING (
        status IN ('upcoming', 'active', 'voting', 'completed') OR
        creator_id = auth.uid()
    );

-- Authenticated users can create challenges
CREATE POLICY "challenges_insert_auth" ON challenges
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND creator_id = auth.uid());

-- Challenge creators can update their own challenges
CREATE POLICY "challenges_update_own" ON challenges
    FOR UPDATE USING (creator_id = auth.uid())
    WITH CHECK (creator_id = auth.uid());

-- Admins can manage any challenge
CREATE POLICY "challenges_admin_manage" ON challenges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND subscription_tier = 'enterprise'
        )
    );

-- Challenge Participation Policies
-- Users can view participation in public challenges
CREATE POLICY "challenge_participants_select" ON challenge_participants
    FOR SELECT USING (
        user_id = auth.uid() OR
        challenge_id IN (
            SELECT id FROM challenges 
            WHERE status IN ('active', 'voting', 'completed')
        )
    );

-- Users can join challenges
CREATE POLICY "challenge_participants_insert" ON challenge_participants
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can update their own participation
CREATE POLICY "challenge_participants_update_own" ON challenge_participants
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Game Rating Policies
-- Everyone can view ratings for public games
CREATE POLICY "game_ratings_select_public" ON game_ratings
    FOR SELECT USING (
        game_id IN (SELECT id FROM games WHERE visibility = 'public') OR
        user_id = auth.uid()
    );

-- Authenticated users can rate games
CREATE POLICY "game_ratings_insert_auth" ON game_ratings
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can update their own ratings
CREATE POLICY "game_ratings_update_own" ON game_ratings
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own ratings
CREATE POLICY "game_ratings_delete_own" ON game_ratings
    FOR DELETE USING (user_id = auth.uid());

-- Mention Policies
-- Users can view mentions where they are involved
CREATE POLICY "mentions_select_involved" ON mentions
    FOR SELECT USING (
        mentioning_user_id = auth.uid() OR 
        mentioned_user_id = auth.uid()
    );

-- System can create mentions
CREATE POLICY "mentions_insert_system" ON mentions
    FOR INSERT WITH CHECK (true);

-- User Block Policies
-- Users can only view their own blocks
CREATE POLICY "user_blocks_select_own" ON user_blocks
    FOR SELECT USING (blocker_id = auth.uid());

-- Users can block others
CREATE POLICY "user_blocks_insert_own" ON user_blocks
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND blocker_id = auth.uid());

-- Users can unblock (delete their blocks)
CREATE POLICY "user_blocks_delete_own" ON user_blocks
    FOR DELETE USING (blocker_id = auth.uid());

-- Game Report Policies
-- Users can view their own reports
CREATE POLICY "game_reports_select_own" ON game_reports
    FOR SELECT USING (reporter_id = auth.uid());

-- Moderators can view all reports
CREATE POLICY "game_reports_select_moderator" ON game_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (
                subscription_tier = 'enterprise' OR
                email LIKE '%@gamegen.com'
            )
        )
    );

-- Users can report games
CREATE POLICY "game_reports_insert_auth" ON game_reports
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND reporter_id = auth.uid());

-- Moderators can update reports
CREATE POLICY "game_reports_update_moderator" ON game_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (
                subscription_tier = 'enterprise' OR
                email LIKE '%@gamegen.com'
            )
        )
    );

-- Additional policies for existing social tables
-- (Ensuring they work with the new extended system)

-- Enhanced user_follows policies
DROP POLICY IF EXISTS "user_follows_select" ON user_follows;
CREATE POLICY "user_follows_select" ON user_follows
    FOR SELECT USING (
        follower_id = auth.uid() OR 
        following_id = auth.uid() OR
        follower_id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = following_id)
    );

-- Enhanced game_likes policies
DROP POLICY IF EXISTS "game_likes_select" ON game_likes;
CREATE POLICY "game_likes_select" ON game_likes
    FOR SELECT USING (
        user_id = auth.uid() OR
        game_id IN (SELECT id FROM games WHERE visibility = 'public')
    );

-- Enhanced game_comments policies with blocking
DROP POLICY IF EXISTS "game_comments_select" ON game_comments;
CREATE POLICY "game_comments_select" ON game_comments
    FOR SELECT USING (
        (game_id IN (SELECT id FROM games WHERE visibility = 'public') OR 
         game_id IN (SELECT id FROM games WHERE creator_id = auth.uid()) OR
         author_id = auth.uid())
        AND is_deleted = false
        AND author_id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = auth.uid())
    );

-- Enhanced collections policies
DROP POLICY IF EXISTS "collections_select" ON collections;
CREATE POLICY "collections_select" ON collections
    FOR SELECT USING (
        creator_id = auth.uid() OR
        (is_public = true AND creator_id NOT IN (
            SELECT blocked_id FROM user_blocks WHERE blocker_id = auth.uid()
        ))
    );