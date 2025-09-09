-- Seed initial game templates
-- Migration: 20250909140000_seed_initial_templates

-- Insert some sample games that can be used as templates
INSERT INTO games (id, creator_id, title, description, tags, genre, game_data, thumbnail_url, screenshot_urls, visibility, is_template, is_featured, play_count, like_count, created_at, updated_at) 
VALUES 
  (
    'game-template-1',
    (SELECT id FROM profiles LIMIT 1), -- Use first available profile
    'Platformer Adventure',
    'A classic side-scrolling platformer with collectibles and power-ups',
    ARRAY['platformer', 'adventure', 'classic'],
    'platformer',
    '{"physics": {"gravity": 9.8}, "player": {"speed": 200, "jumpHeight": 400}, "enemies": ["goomba", "koopa"], "powerups": ["mushroom", "fireflower"]}',
    '/api/placeholder/300/200?text=Platformer+Adventure',
    ARRAY['/api/placeholder/600/400?text=Level+1', '/api/placeholder/600/400?text=Level+2'],
    'public',
    true,
    true,
    1245,
    89,
    NOW(),
    NOW()
  ),
  (
    'game-template-2',
    (SELECT id FROM profiles LIMIT 1),
    'Space Shooter Classic',
    'Fast-paced space shooter with enemy waves and power-ups',
    ARRAY['shooter', 'space', 'arcade'],
    'shooter',
    '{"enemies": ["alien1", "alien2", "boss"], "weapons": ["laser", "plasma", "missile"], "levels": 10}',
    '/api/placeholder/300/200?text=Space+Shooter',
    ARRAY['/api/placeholder/600/400?text=Space+Battle', '/api/placeholder/600/400?text=Boss+Fight'],
    'public',
    true,
    false,
    892,
    45,
    NOW(),
    NOW()
  ),
  (
    'game-template-3',
    (SELECT id FROM profiles LIMIT 1),
    'Puzzle Mind Bender',
    'Brain-teasing puzzle game with multiple difficulty levels',
    ARRAY['puzzle', 'logic', 'brain'],
    'puzzle',
    '{"puzzleTypes": ["sliding", "rotation", "matching"], "difficulty": ["easy", "medium", "hard"], "levels": 50}',
    '/api/placeholder/300/200?text=Puzzle+Game',
    ARRAY['/api/placeholder/600/400?text=Puzzle+1', '/api/placeholder/600/400?text=Puzzle+2'],
    'public',
    true,
    true,
    567,
    78,
    NOW(),
    NOW()
  ),
  (
    'game-template-4',
    (SELECT id FROM profiles LIMIT 1),
    'RPG Adventure Starter',
    'Basic RPG framework with character progression and quests',
    ARRAY['rpg', 'adventure', 'fantasy'],
    'rpg',
    '{"classes": ["warrior", "mage", "rogue"], "stats": ["strength", "magic", "agility"], "quests": 15}',
    '/api/placeholder/300/200?text=RPG+Adventure',
    ARRAY['/api/placeholder/600/400?text=Character', '/api/placeholder/600/400?text=World+Map'],
    'public',
    true,
    false,
    1103,
    156,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Insert corresponding templates for these games
INSERT INTO templates (id, creator_id, game_id, name, description, category, difficulty, price, download_count, rating, rating_count, status, created_at, updated_at)
VALUES
  (
    'template-1',
    (SELECT id FROM profiles LIMIT 1),
    'game-template-1',
    'Platformer Adventure Template',
    'Perfect starting point for creating classic platformer games with pre-built physics, enemies, and power-up systems',
    'educational',
    'beginner',
    0.00,
    1245,
    4.5,
    89,
    'approved',
    NOW(),
    NOW()
  ),
  (
    'template-2',
    (SELECT id FROM profiles LIMIT 1),
    'game-template-2',
    'Space Shooter Template',
    'Fast-paced space shooter template with enemy AI, weapon systems, and progressive difficulty',
    'entertainment',
    'intermediate',
    0.00,
    892,
    4.2,
    45,
    'approved',
    NOW(),
    NOW()
  ),
  (
    'template-3',
    (SELECT id FROM profiles LIMIT 1),
    'game-template-3',
    'Puzzle Game Framework',
    'Comprehensive puzzle game template with multiple puzzle types and difficulty scaling',
    'educational',
    'beginner',
    0.00,
    567,
    4.7,
    78,
    'approved',
    NOW(),
    NOW()
  ),
  (
    'template-4',
    (SELECT id FROM profiles LIMIT 1),
    'game-template-4',
    'RPG Starter Kit',
    'Complete RPG foundation with character classes, progression system, and quest framework',
    'commercial',
    'advanced',
    9.99,
    1103,
    4.8,
    156,
    'approved',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;