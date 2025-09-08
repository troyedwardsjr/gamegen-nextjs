-- Migration: Database Functions and Triggers for Social Features
-- Description: Automated functions for social feature management
-- Date: 2025-09-06

-- Function to update game statistics when likes change
CREATE OR REPLACE FUNCTION update_game_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE games 
        SET like_count = like_count + 1,
            updated_at = NOW()
        WHERE id = NEW.game_id;
        
        -- Create activity for game like
        INSERT INTO activities (
            user_id, activity_type, target_game_id, target_user_id,
            activity_data, visibility
        ) VALUES (
            NEW.user_id, 'game_liked', NEW.game_id,
            (SELECT creator_id FROM games WHERE id = NEW.game_id),
            jsonb_build_object(
                'game_title', (SELECT title FROM games WHERE id = NEW.game_id)
            ),
            'public'
        );
        
        -- Create notification for game creator (if not self-like)
        INSERT INTO notifications (
            recipient_id, sender_id, notification_type, title, content,
            related_game_id, action_url
        )
        SELECT 
            g.creator_id, NEW.user_id, 'game_like',
            p.display_name || ' liked your game',
            'Your game "' || g.title || '" received a like from ' || p.display_name,
            NEW.game_id,
            '/games/' || g.id
        FROM games g, profiles p
        WHERE g.id = NEW.game_id 
            AND p.id = NEW.user_id
            AND g.creator_id != NEW.user_id;
            
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE games 
        SET like_count = GREATEST(like_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.game_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for game like count updates
CREATE TRIGGER trigger_update_game_like_count
    AFTER INSERT OR DELETE ON game_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_game_like_count();

-- Function to update follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Create follow activity
        INSERT INTO activities (
            user_id, activity_type, target_user_id,
            activity_data, visibility
        ) VALUES (
            NEW.follower_id, 'user_followed', NEW.following_id,
            jsonb_build_object(
                'followed_username', (SELECT username FROM profiles WHERE id = NEW.following_id)
            ),
            'public'
        );
        
        -- Create notification for followed user
        INSERT INTO notifications (
            recipient_id, sender_id, notification_type, title, content,
            action_url
        )
        SELECT 
            NEW.following_id, NEW.follower_id, 'follow',
            p.display_name || ' started following you',
            p.display_name || ' is now following your GameGen profile',
            '/profile/' || p.username
        FROM profiles p
        WHERE p.id = NEW.follower_id;
        
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for follow activities
CREATE TRIGGER trigger_update_follow_counts
    AFTER INSERT OR DELETE ON user_follows
    FOR EACH ROW
    EXECUTE FUNCTION update_follow_counts();

-- Function to create comment activities and notifications
CREATE OR REPLACE FUNCTION handle_game_comment()
RETURNS TRIGGER AS $$
DECLARE
    game_creator_id UUID;
    game_title TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get game info
        SELECT creator_id, title INTO game_creator_id, game_title
        FROM games WHERE id = NEW.game_id;
        
        -- Create comment activity
        INSERT INTO activities (
            user_id, activity_type, target_game_id, target_user_id,
            activity_data, visibility
        ) VALUES (
            NEW.author_id, 'game_commented', NEW.game_id, game_creator_id,
            jsonb_build_object(
                'game_title', game_title,
                'comment_preview', LEFT(NEW.content, 100),
                'comment_id', NEW.id
            ),
            'public'
        );
        
        -- Create notification for game creator (if not self-comment)
        IF game_creator_id != NEW.author_id THEN
            INSERT INTO notifications (
                recipient_id, sender_id, notification_type, title, content,
                related_game_id, related_comment_id, action_url
            )
            SELECT 
                game_creator_id, NEW.author_id, 'game_comment',
                p.display_name || ' commented on your game',
                'New comment on "' || game_title || '": ' || LEFT(NEW.content, 150),
                NEW.game_id, NEW.id,
                '/games/' || NEW.game_id || '#comment-' || NEW.id
            FROM profiles p
            WHERE p.id = NEW.author_id;
        END IF;
        
        -- Handle parent comment notifications (replies)
        IF NEW.parent_comment_id IS NOT NULL THEN
            INSERT INTO notifications (
                recipient_id, sender_id, notification_type, title, content,
                related_game_id, related_comment_id, action_url
            )
            SELECT 
                parent.author_id, NEW.author_id, 'game_comment',
                p.display_name || ' replied to your comment',
                'Reply on "' || game_title || '": ' || LEFT(NEW.content, 150),
                NEW.game_id, NEW.id,
                '/games/' || NEW.game_id || '#comment-' || NEW.id
            FROM game_comments parent, profiles p
            WHERE parent.id = NEW.parent_comment_id 
                AND p.id = NEW.author_id
                AND parent.author_id != NEW.author_id;
        END IF;
        
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for game comments
CREATE TRIGGER trigger_handle_game_comment
    AFTER INSERT ON game_comments
    FOR EACH ROW
    EXECUTE FUNCTION handle_game_comment();

-- Function to handle achievement unlocks
CREATE OR REPLACE FUNCTION handle_achievement_unlock()
RETURNS TRIGGER AS $$
DECLARE
    achievement_name TEXT;
    achievement_points INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get achievement info
        SELECT name, points INTO achievement_name, achievement_points
        FROM achievements WHERE id = NEW.achievement_id;
        
        -- Update total unlocked count
        UPDATE achievements 
        SET total_unlocked = total_unlocked + 1
        WHERE id = NEW.achievement_id;
        
        -- Create achievement activity
        INSERT INTO activities (
            user_id, activity_type, target_achievement_id,
            activity_data, visibility
        ) VALUES (
            NEW.user_id, 'achievement_unlocked', NEW.achievement_id,
            jsonb_build_object(
                'achievement_name', achievement_name,
                'points_earned', achievement_points,
                'unlock_context', NEW.unlock_data
            ),
            CASE WHEN NEW.is_public THEN 'public' ELSE 'private' END
        );
        
        -- Create notification for user
        INSERT INTO notifications (
            recipient_id, notification_type, title, content,
            notification_data
        ) VALUES (
            NEW.user_id, 'achievement_unlocked',
            'Achievement Unlocked: ' || achievement_name,
            'Congratulations! You earned ' || achievement_points || ' points.',
            jsonb_build_object(
                'achievement_id', NEW.achievement_id,
                'points', achievement_points
            )
        );
        
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for achievement unlocks
CREATE TRIGGER trigger_handle_achievement_unlock
    AFTER INSERT ON user_achievements
    FOR EACH ROW
    EXECUTE FUNCTION handle_achievement_unlock();

-- Function to update challenge participant count
CREATE OR REPLACE FUNCTION update_challenge_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE challenges 
        SET participant_count = participant_count + 1
        WHERE id = NEW.challenge_id;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE challenges 
        SET participant_count = GREATEST(participant_count - 1, 0)
        WHERE id = OLD.challenge_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for challenge participant count
CREATE TRIGGER trigger_update_challenge_participant_count
    AFTER INSERT OR DELETE ON challenge_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_challenge_participant_count();

-- Function to handle challenge submissions
CREATE OR REPLACE FUNCTION handle_challenge_submission()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.submission_game_id IS NULL AND NEW.submission_game_id IS NOT NULL THEN
        -- Update submission count
        UPDATE challenges 
        SET submission_count = submission_count + 1
        WHERE id = NEW.challenge_id;
        
        -- Create submission activity
        INSERT INTO activities (
            user_id, activity_type, target_game_id,
            activity_data, visibility
        ) VALUES (
            NEW.user_id, 'challenge_completed', NEW.submission_game_id,
            jsonb_build_object(
                'challenge_id', NEW.challenge_id,
                'challenge_title', (SELECT title FROM challenges WHERE id = NEW.challenge_id),
                'game_title', (SELECT title FROM games WHERE id = NEW.submission_game_id)
            ),
            'public'
        );
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for challenge submissions
CREATE TRIGGER trigger_handle_challenge_submission
    AFTER UPDATE ON challenge_participants
    FOR EACH ROW
    EXECUTE FUNCTION handle_challenge_submission();

-- Function to process mentions in content
CREATE OR REPLACE FUNCTION process_mentions(
    content TEXT,
    mentioning_user_id UUID,
    context_type TEXT,
    context_id UUID
) RETURNS void AS $$
DECLARE
    mention_match TEXT;
    mentioned_username TEXT;
    mentioned_user_id UUID;
    mention_start INTEGER;
    mention_end INTEGER;
BEGIN
    -- Find all @username mentions in content
    FOR mention_match IN 
        SELECT DISTINCT unnest(regexp_split_to_array(content, '\s+'))
        WHERE unnest LIKE '@%' AND length(unnest) > 1
    LOOP
        mentioned_username := TRIM(LEADING '@' FROM mention_match);
        
        -- Find the mentioned user
        SELECT id INTO mentioned_user_id 
        FROM profiles 
        WHERE username = mentioned_username;
        
        IF mentioned_user_id IS NOT NULL AND mentioned_user_id != mentioning_user_id THEN
            -- Calculate mention position
            mention_start := POSITION('@' || mentioned_username IN content);
            mention_end := mention_start + LENGTH('@' || mentioned_username);
            
            -- Insert mention record
            INSERT INTO mentions (
                mentioning_user_id, mentioned_user_id, context_type, context_id,
                mention_text, position_start, position_end
            ) VALUES (
                mentioning_user_id, mentioned_user_id, context_type, context_id,
                '@' || mentioned_username, mention_start, mention_end
            ) ON CONFLICT DO NOTHING;
            
            -- Create notification for mentioned user
            INSERT INTO notifications (
                recipient_id, sender_id, notification_type, title, content,
                action_url, notification_data
            )
            SELECT 
                mentioned_user_id, mentioning_user_id, 'mention',
                p.display_name || ' mentioned you',
                'You were mentioned: ' || LEFT(content, 150),
                CASE context_type
                    WHEN 'comment' THEN '/games/' || (SELECT game_id FROM game_comments WHERE id = context_id) || '#comment-' || context_id
                    ELSE '/notifications'
                END,
                jsonb_build_object('context_type', context_type, 'context_id', context_id)
            FROM profiles p
            WHERE p.id = mentioning_user_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_user_achievements(user_id UUID) RETURNS void AS $$
DECLARE
    achievement RECORD;
    conditions JSONB;
    user_stats RECORD;
BEGIN
    -- Get user statistics
    SELECT 
        (SELECT COUNT(*) FROM games WHERE creator_id = user_id AND visibility = 'public') as games_created,
        (SELECT COUNT(*) FROM user_follows WHERE following_id = user_id) as follower_count,
        (SELECT COUNT(*) FROM game_likes WHERE user_id = user_id) as total_likes_given,
        (SELECT COALESCE(SUM(like_count), 0) FROM games WHERE creator_id = user_id) as total_likes_received,
        (SELECT COUNT(*) FROM game_comments WHERE author_id = user_id) as comments_made,
        (SELECT COUNT(*) FROM challenge_participants WHERE user_id = user_id AND submission_game_id IS NOT NULL) as challenges_completed
    INTO user_stats;
    
    -- Check each achievement
    FOR achievement IN 
        SELECT id, conditions 
        FROM achievements 
        WHERE is_active = true 
            AND id NOT IN (SELECT achievement_id FROM user_achievements WHERE user_achievements.user_id = check_user_achievements.user_id)
    LOOP
        -- Simple achievement checking logic (can be expanded)
        CASE achievement.conditions->>'type'
            WHEN 'games_created' THEN
                IF user_stats.games_created >= (achievement.conditions->>'threshold')::INTEGER THEN
                    INSERT INTO user_achievements (user_id, achievement_id, unlock_data)
                    VALUES (user_id, achievement.id, jsonb_build_object('games_created', user_stats.games_created));
                END IF;
                
            WHEN 'followers' THEN
                IF user_stats.follower_count >= (achievement.conditions->>'threshold')::INTEGER THEN
                    INSERT INTO user_achievements (user_id, achievement_id, unlock_data)
                    VALUES (user_id, achievement.id, jsonb_build_object('follower_count', user_stats.follower_count));
                END IF;
                
            WHEN 'likes_received' THEN
                IF user_stats.total_likes_received >= (achievement.conditions->>'threshold')::INTEGER THEN
                    INSERT INTO user_achievements (user_id, achievement_id, unlock_data)
                    VALUES (user_id, achievement.id, jsonb_build_object('likes_received', user_stats.total_likes_received));
                END IF;
        END CASE;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user activity feed
CREATE OR REPLACE FUNCTION get_user_activity_feed(
    user_id UUID,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    activity_type TEXT,
    user_id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    activity_data JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.activity_type,
        a.user_id,
        p.username,
        p.display_name,
        p.avatar_url,
        a.activity_data,
        a.created_at
    FROM activities a
    JOIN profiles p ON p.id = a.user_id
    WHERE (
        -- Public activities
        a.visibility = 'public' OR
        -- Activities from followed users
        (a.visibility = 'followers' AND a.user_id IN (
            SELECT following_id FROM user_follows WHERE follower_id = user_id
        )) OR
        -- User's own activities
        a.user_id = user_id
    )
    AND a.user_id NOT IN (
        SELECT blocked_id FROM user_blocks WHERE blocker_id = user_id
    )
    ORDER BY a.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;