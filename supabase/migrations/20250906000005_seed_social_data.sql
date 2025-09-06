-- Migration: Seed Data for Social Features
-- Description: Initial achievements, sample challenges, and system notifications
-- Date: 2025-09-06

-- Insert initial achievement definitions
INSERT INTO achievements (name, description, category, icon_url, badge_color, points, rarity, conditions, is_active) VALUES
-- Creator Achievements
('First Steps', 'Create your first game', 'creator', '/icons/achievements/first-game.svg', '#10B981', 10, 'common', 
 '{"type": "games_created", "threshold": 1}', true),

('Game Maker', 'Create 5 games', 'creator', '/icons/achievements/game-maker.svg', '#3B82F6', 25, 'common',
 '{"type": "games_created", "threshold": 5}', true),

('Prolific Creator', 'Create 25 games', 'creator', '/icons/achievements/prolific-creator.svg', '#8B5CF6', 100, 'rare',
 '{"type": "games_created", "threshold": 25}', true),

('Game Studio', 'Create 100 games', 'creator', '/icons/achievements/game-studio.svg', '#F59E0B', 500, 'epic',
 '{"type": "games_created", "threshold": 100}', true),

('Legend', 'Create 500 games', 'creator', '/icons/achievements/legend.svg', '#EF4444', 2500, 'legendary',
 '{"type": "games_created", "threshold": 500}', true),

-- Social Achievements
('Popular', 'Reach 10 followers', 'social', '/icons/achievements/popular.svg', '#06B6D4', 50, 'common',
 '{"type": "followers", "threshold": 10}', true),

('Influencer', 'Reach 100 followers', 'social', '/icons/achievements/influencer.svg', '#8B5CF6', 200, 'rare',
 '{"type": "followers", "threshold": 100}', true),

('Celebrity', 'Reach 1000 followers', 'social', '/icons/achievements/celebrity.svg', '#F59E0B', 1000, 'epic',
 '{"type": "followers", "threshold": 1000}', true),

('Beloved Creator', 'Receive 100 total likes on your games', 'social', '/icons/achievements/beloved.svg', '#EC4899', 100, 'common',
 '{"type": "likes_received", "threshold": 100}', true),

('Fan Favorite', 'Receive 1000 total likes on your games', 'social', '/icons/achievements/fan-favorite.svg', '#F59E0B', 500, 'rare',
 '{"type": "likes_received", "threshold": 1000}', true),

-- Milestone Achievements
('Welcome to GameGen', 'Complete your profile setup', 'milestone', '/icons/achievements/welcome.svg', '#10B981', 5, 'common',
 '{"type": "profile_complete", "threshold": 1}', true),

('Active Member', 'Be active for 30 days', 'milestone', '/icons/achievements/active-member.svg', '#3B82F6', 50, 'common',
 '{"type": "days_active", "threshold": 30}', true),

('Veteran', 'Be active for 365 days', 'milestone', '/icons/achievements/veteran.svg', '#8B5CF6', 365, 'epic',
 '{"type": "days_active", "threshold": 365}', true),

-- Community Achievements  
('Helper', 'Make 50 helpful comments', 'community', '/icons/achievements/helper.svg', '#06B6D4', 100, 'common',
 '{"type": "helpful_comments", "threshold": 50}', true),

('Mentor', 'Help 10 new creators', 'community', '/icons/achievements/mentor.svg', '#8B5CF6', 250, 'rare',
 '{"type": "users_helped", "threshold": 10}', true),

('Challenge Champion', 'Win 5 community challenges', 'community', '/icons/achievements/champion.svg', '#F59E0B', 500, 'epic',
 '{"type": "challenges_won", "threshold": 5}', true),

-- Special Achievements (manually awarded)
('Beta Tester', 'Participated in GameGen beta', 'special', '/icons/achievements/beta-tester.svg', '#6366F1', 100, 'rare',
 '{"type": "manual", "description": "Awarded to early beta participants"}', true),

('Community Contributor', 'Made significant contributions to the GameGen community', 'special', '/icons/achievements/contributor.svg', '#8B5CF6', 200, 'epic',
 '{"type": "manual", "description": "Awarded for exceptional community contributions"}', true),

('GameGen Team', 'Member of the GameGen development team', 'special', '/icons/achievements/team-member.svg', '#EF4444', 1000, 'legendary',
 '{"type": "manual", "description": "Awarded to GameGen team members"}', true);

-- Insert sample community challenges
INSERT INTO challenges (
    creator_id, title, description, short_description, challenge_type, difficulty,
    starts_at, ends_at, submission_deadline, voting_ends_at,
    rules, constraints, max_participants, team_size_limit, allow_solo, allow_teams,
    prizes, winner_count, banner_url, thumbnail_url, status, is_featured, is_official, tags
) VALUES
-- Weekly pixel art challenge
(
    (SELECT id FROM profiles WHERE email LIKE '%@gamegen.com' LIMIT 1),
    'Pixel Perfect Weekly #1: Retro Arcade',
    E'Create a game that captures the essence of classic arcade games from the 80s and 90s. Think Pac-Man, Space Invaders, Frogger, or Centipede. Your game should feature:\n\n• Simple, intuitive controls\n• Progressively increasing difficulty\n• High score system\n• Classic pixel art style\n• Catchy retro sound effects\n\nBonus points for creative twists on classic mechanics!',
    'Create a retro arcade-style game with classic pixel art and addictive gameplay',
    'weekly', 'all',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '8 days',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '10 days',
    jsonb_build_object(
        'theme', 'retro_arcade',
        'required_elements', jsonb_build_array('high_score_system', 'progressive_difficulty'),
        'bonus_points', jsonb_build_array('original_soundtrack', 'multiple_power_ups', 'boss_battles')
    ),
    jsonb_build_object(
        'max_file_size_mb', 50,
        'required_engine', 'toxoid',
        'max_development_time', '1_week'
    ),
    500, 1, true, false,
    jsonb_build_array(
        jsonb_build_object('place', 1, 'prize', 'GameGen Pro subscription (3 months)', 'value', 150),
        jsonb_build_object('place', 2, 'prize', 'GameGen Pro subscription (1 month)', 'value', 50),
        jsonb_build_object('place', 3, 'prize', 'Featured game spotlight', 'value', 0)
    ),
    3, '/images/challenges/retro-arcade-banner.jpg', '/images/challenges/retro-arcade-thumb.jpg',
    'upcoming', true, true, ARRAY['retro', 'arcade', 'pixel-art', 'weekly']
),

-- Monthly game jam
(
    (SELECT id FROM profiles WHERE email LIKE '%@gamegen.com' LIMIT 1),
    'GameGen Game Jam: "Unexpected Allies"',
    E'Theme: Unexpected Allies\n\nCreate a game where the most unlikely characters must work together to overcome challenges. This could be:\n\n• A puzzle game where opposing elements must cooperate\n• An adventure where enemies become friends\n• A strategy game with shifting alliances\n• A platformer where you control multiple characters with different abilities\n\nThe key is to explore the theme of cooperation between unlikely partners. How do different personalities, abilities, or even species come together to achieve a common goal?\n\n**Judging Criteria:**\n• Theme interpretation (30%)\n• Gameplay innovation (25%)\n• Art and presentation (20%)\n• Technical execution (15%)\n• Community engagement (10%)\n\n**Timeline:**\n• Theme announcement: Today\n• Development period: 3 weeks\n• Submission deadline: 3 weeks from today\n• Community voting: 1 week\n• Winner announcement: 4 weeks from today',
    'Monthly game jam with theme "Unexpected Allies" - create games about unlikely partnerships',
    'game_jam', 'all',
    NOW(),
    NOW() + INTERVAL '21 days',
    NOW() + INTERVAL '21 days',
    NOW() + INTERVAL '28 days',
    jsonb_build_object(
        'theme', 'unexpected_allies',
        'interpretation_guidelines', jsonb_build_array(
            'cooperation_mechanics', 'character_diversity', 'alliance_formation'
        ),
        'judging_criteria', jsonb_build_object(
            'theme_interpretation', 30,
            'gameplay_innovation', 25,
            'art_presentation', 20,
            'technical_execution', 15,
            'community_engagement', 10
        )
    ),
    jsonb_build_object(
        'max_team_size', 4,
        'development_time_weeks', 3,
        'submission_requirements', jsonb_build_array('playable_demo', 'source_code', 'dev_log')
    ),
    200, 4, true, true,
    jsonb_build_array(
        jsonb_build_object('place', 1, 'prize', 'GameGen Max subscription (6 months) + $500 cash', 'value', 800),
        jsonb_build_object('place', 2, 'prize', 'GameGen Pro subscription (3 months) + $250 cash', 'value', 400),
        jsonb_build_object('place', 3, 'prize', 'GameGen Pro subscription (1 month) + $100 cash', 'value', 150),
        jsonb_build_object('place', 'community_choice', 'prize', 'Community Choice Award + Featured spotlight', 'value', 0)
    ),
    4, '/images/challenges/unexpected-allies-banner.jpg', '/images/challenges/unexpected-allies-thumb.jpg',
    'active', true, true, ARRAY['game-jam', 'monthly', 'cooperation', 'storytelling']
),

-- Beginner-friendly challenge
(
    (SELECT id FROM profiles WHERE email LIKE '%@gamegen.com' LIMIT 1),
    'First Timer Friday: Simple Platformer',
    E'New to GameGen? This challenge is perfect for you!\n\nCreate your first platformer game with these simple requirements:\n\n• A character that can move left/right and jump\n• At least 3 platforms to jump between\n• One collectible item (coin, gem, etc.)\n• A simple goal (reach the end, collect all items, etc.)\n\n**Learning Goals:**\n• Understand basic GameGen controls\n• Learn about collision detection\n• Practice pixel art creation\n• Get familiar with the community\n\n**Resources Provided:**\n• Starter template with basic platformer setup\n• Pixel art asset pack\n• Step-by-step tutorial video\n• Beginner-friendly Discord channel for help\n\nDon\'t worry about making it perfect - we\'re here to help you learn!',
    'Beginner-friendly challenge to create your first platformer game with helpful resources',
    'skill', 'beginner',
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '10 days',
    NOW() + INTERVAL '9 days',
    NOW() + INTERVAL '12 days',
    jsonb_build_object(
        'skill_level', 'beginner',
        'required_elements', jsonb_build_array('player_movement', 'jumping', 'platforms', 'collectible'),
        'learning_objectives', jsonb_build_array('basic_controls', 'collision_detection', 'pixel_art', 'community_engagement')
    ),
    jsonb_build_object(
        'template_provided', true,
        'asset_pack_included', true,
        'tutorial_available', true,
        'mentor_support', true
    ),
    100, 1, true, false,
    jsonb_build_array(
        jsonb_build_object('place', 1, 'prize', 'GameGen Pro trial (1 month) + Beginner Badge', 'value', 50),
        jsonb_build_object('place', 'participation', 'prize', 'First Timer Achievement + Asset Pack', 'value', 0)
    ),
    1, '/images/challenges/first-timer-banner.jpg', '/images/challenges/first-timer-thumb.jpg',
    'upcoming', true, true, ARRAY['beginner', 'platformer', 'tutorial', 'first-time']
);

-- Insert some system notification templates
INSERT INTO notifications (
    recipient_id, notification_type, title, content, 
    action_url, notification_data
)
SELECT 
    id,
    'system_announcement',
    'Welcome to GameGen!',
    'Welcome to the GameGen community! Start by creating your first pixel art game and exploring what other creators have built. Don''t forget to follow some creators you admire!',
    '/dashboard',
    jsonb_build_object('welcome_message', true, 'priority', 'high')
FROM profiles 
WHERE created_at > NOW() - INTERVAL '1 day'
ON CONFLICT DO NOTHING;

-- Insert sample activity feed entries (for demonstration)
-- This would normally be created by user actions, but we'll add some samples
INSERT INTO activities (
    user_id, activity_type, target_game_id, activity_data, visibility
)
SELECT 
    p.id,
    'game_created',
    g.id,
    jsonb_build_object(
        'game_title', g.title,
        'game_type', g.game_type,
        'is_first_game', (
            SELECT COUNT(*) = 1 
            FROM games g2 
            WHERE g2.creator_id = p.id AND g2.visibility = 'public'
        )
    ),
    'public'
FROM profiles p
JOIN games g ON g.creator_id = p.id
WHERE g.created_at > NOW() - INTERVAL '7 days'
    AND g.visibility = 'public'
ON CONFLICT DO NOTHING;

-- Create some sample collections
INSERT INTO collections (
    creator_id, name, description, is_public, tags
)
SELECT 
    id,
    'My Favorite Games',
    'A curated collection of games that inspire me and showcase great pixel art techniques.',
    true,
    ARRAY['favorites', 'inspiration']
FROM profiles
WHERE total_games_created > 0
LIMIT 10
ON CONFLICT DO NOTHING;

-- Add games to collections
INSERT INTO collection_games (collection_id, game_id, added_by, order_index)
SELECT 
    c.id,
    g.id,
    c.creator_id,
    ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY g.like_count DESC)
FROM collections c
CROSS JOIN LATERAL (
    SELECT id, like_count
    FROM games
    WHERE visibility = 'public'
        AND creator_id != c.creator_id
    ORDER BY like_count DESC
    LIMIT 5
) g
ON CONFLICT DO NOTHING;

-- Update the trending games materialized view
REFRESH MATERIALIZED VIEW trending_games;