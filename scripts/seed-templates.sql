-- Seed data for templates to populate the featured templates API
-- This script adds sample games and templates to demonstrate the system

-- Create a system user profile for official templates
INSERT INTO profiles (id, username, display_name, bio, subscription_tier, is_verified)
VALUES (
  'system-user-001',
  'gamegen_official',
  'GameGen Official',
  'Official GameGen templates and educational content',
  'educational',
  true
) ON CONFLICT (id) DO NOTHING;

-- Create some demo games that will serve as templates
INSERT INTO games (id, creator_id, title, description, genre, tags, visibility, is_template, is_featured, published_at, thumbnail_url, screenshot_urls, game_data)
VALUES 
  (
    'game-template-001',
    'system-user-001',
    'Simple Platformer',
    'A basic 2D platformer template with jumping mechanics, collectibles, and simple enemies. Perfect for beginners learning game development.',
    'platformer',
    ARRAY['beginner', 'tutorial', '2d', 'platformer', 'pixel-art'],
    'public',
    true,
    true,
    NOW(),
    '/api/placeholder/400/300',
    ARRAY['/api/placeholder/800/600', '/api/placeholder/800/600'],
    '{
      "width": 800,
      "height": 600,
      "gravity": 0.8,
      "jumpForce": 15,
      "playerSpeed": 5,
      "physics": true,
      "entities": [
        {"type": "player", "x": 100, "y": 400, "width": 32, "height": 32},
        {"type": "platform", "x": 0, "y": 500, "width": 800, "height": 100},
        {"type": "collectible", "x": 300, "y": 450, "width": 16, "height": 16},
        {"type": "enemy", "x": 500, "y": 450, "width": 24, "height": 24}
      ]
    }'::jsonb
  ),
  (
    'game-template-002',
    'system-user-001',
    'Space Shooter',
    'A classic space shooter template with enemy waves, power-ups, and scoring system. Great for learning about game loops and collision detection.',
    'shooter',
    ARRAY['intermediate', 'space', 'shooter', 'arcade', 'retro'],
    'public',
    true,
    true,
    NOW(),
    '/api/placeholder/400/300',
    ARRAY['/api/placeholder/800/600', '/api/placeholder/800/600'],
    '{
      "width": 800,
      "height": 600,
      "playerSpeed": 7,
      "bulletSpeed": 10,
      "enemySpeed": 3,
      "spawnRate": 2,
      "physics": false,
      "entities": [
        {"type": "player", "x": 400, "y": 500, "width": 48, "height": 48},
        {"type": "enemy", "x": 200, "y": 100, "width": 32, "height": 32},
        {"type": "powerup", "x": 400, "y": 300, "width": 20, "height": 20}
      ]
    }'::jsonb
  ),
  (
    'game-template-003',
    'system-user-001',
    'Puzzle Game',
    'A tile-matching puzzle game template with grid-based gameplay, scoring, and level progression. Ideal for understanding game state management.',
    'puzzle',
    ARRAY['beginner', 'puzzle', 'match-3', 'casual', 'grid'],
    'public',
    true,
    true,
    NOW(),
    '/api/placeholder/400/300',
    ARRAY['/api/placeholder/800/600', '/api/placeholder/800/600'],
    '{
      "width": 600,
      "height": 800,
      "gridSize": 8,
      "tileSize": 64,
      "colors": ["red", "blue", "green", "yellow", "purple"],
      "matchCount": 3,
      "physics": false,
      "entities": [
        {"type": "grid", "x": 100, "y": 100, "width": 512, "height": 512},
        {"type": "scoreboard", "x": 50, "y": 50, "width": 200, "height": 40}
      ]
    }'::jsonb
  ),
  (
    'game-template-004',
    'system-user-001',
    'RPG Adventure',
    'A basic RPG template with character movement, dialogue system, inventory, and combat mechanics. Advanced template for comprehensive game development.',
    'rpg',
    ARRAY['advanced', 'rpg', 'adventure', 'story', 'inventory'],
    'public',
    true,
    true,
    NOW(),
    '/api/placeholder/400/300',
    ARRAY['/api/placeholder/800/600', '/api/placeholder/800/600'],
    '{
      "width": 1024,
      "height": 768,
      "tileSize": 32,
      "playerSpeed": 4,
      "physics": true,
      "ai": true,
      "entities": [
        {"type": "player", "x": 512, "y": 400, "width": 32, "height": 32, "health": 100, "mana": 50},
        {"type": "npc", "x": 300, "y": 300, "width": 32, "height": 32, "dialogue": "Welcome to our village!"},
        {"type": "enemy", "x": 700, "y": 500, "width": 32, "height": 32, "health": 30},
        {"type": "item", "x": 400, "y": 200, "width": 16, "height": 16, "itemType": "potion"}
      ]
    }'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Create template records that reference these games
INSERT INTO templates (id, creator_id, game_id, name, description, category, difficulty, status, created_at, updated_at)
VALUES
  (
    'template-001',
    'system-user-001',
    'game-template-001',
    'Simple Platformer',
    'A beginner-friendly 2D platformer template featuring jump mechanics, collectibles, and basic enemy AI. Includes pixel-art sprites and sound effects. Perfect for learning the fundamentals of game physics and player movement.',
    'educational',
    'beginner',
    'approved',
    NOW(),
    NOW()
  ),
  (
    'template-002',
    'system-user-001',
    'game-template-002',
    'Space Shooter',
    'A classic arcade-style space shooter with enemy waves, power-ups, and progressive difficulty. Features particle effects, background scrolling, and high score tracking. Great for understanding game loops and collision systems.',
    'educational',
    'intermediate',
    'approved',
    NOW(),
    NOW()
  ),
  (
    'template-003',
    'system-user-001',
    'game-template-003',
    'Puzzle Game',
    'A tile-matching puzzle game with cascade mechanics, special tiles, and level progression. Includes smooth animations, combo system, and achievement tracking. Excellent for learning state management and UI design.',
    'educational',
    'beginner',
    'approved',
    NOW(),
    NOW()
  ),
  (
    'template-004',
    'system-user-001',
    'game-template-004',
    'RPG Adventure',
    'A comprehensive RPG template with turn-based combat, inventory system, quest management, and dialogue trees. Features multiple character classes, equipment system, and save/load functionality.',
    'commercial',
    'advanced',
    'approved',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Update template counts and usage statistics (mock data)
UPDATE templates SET 
  download_count = CASE 
    WHEN difficulty = 'beginner' THEN 1500 + (RANDOM() * 500)::int
    WHEN difficulty = 'intermediate' THEN 800 + (RANDOM() * 700)::int  
    WHEN difficulty = 'advanced' THEN 300 + (RANDOM() * 500)::int
    ELSE 100
  END,
  rating = 4.0 + (RANDOM() * 1.0),
  rating_count = CASE 
    WHEN difficulty = 'beginner' THEN 150 + (RANDOM() * 100)::int
    WHEN difficulty = 'intermediate' THEN 80 + (RANDOM() * 120)::int
    WHEN difficulty = 'advanced' THEN 30 + (RANDOM() * 70)::int
    ELSE 10
  END
WHERE creator_id = 'system-user-001';

-- Update game statistics to match
UPDATE games SET
  play_count = CASE 
    WHEN genre = 'platformer' THEN 5000 + (RANDOM() * 3000)::int
    WHEN genre = 'shooter' THEN 3000 + (RANDOM() * 4000)::int
    WHEN genre = 'puzzle' THEN 2000 + (RANDOM() * 3000)::int
    WHEN genre = 'rpg' THEN 1000 + (RANDOM() * 2000)::int
    ELSE 500
  END,
  like_count = CASE 
    WHEN is_featured = true THEN 200 + (RANDOM() * 300)::int
    ELSE 50 + (RANDOM() * 150)::int
  END,
  fork_count = CASE 
    WHEN is_template = true THEN 50 + (RANDOM() * 100)::int
    ELSE 5 + (RANDOM() * 20)::int
  END
WHERE creator_id = 'system-user-001';

-- Add some play session data to make the templates look active
INSERT INTO play_sessions (game_id, player_id, session_duration, completion_percentage, final_score, platform, created_at)
SELECT 
  g.id,
  NULL, -- Anonymous player
  (60 + RANDOM() * 300)::int, -- 1-5 minutes
  (20 + RANDOM() * 80)::int, -- 20-100% completion
  (RANDOM() * 10000)::int, -- Random score
  (ARRAY['web', 'desktop', 'mobile'])[ceil(RANDOM() * 3)], -- Random platform
  NOW() - (RANDOM() * INTERVAL '7 days') -- Random time in last week
FROM games g 
WHERE g.creator_id = 'system-user-001'
  AND NOT EXISTS (
    SELECT 1 FROM play_sessions ps WHERE ps.game_id = g.id
  );