-- Migration: Seed Chat Prompt Templates
-- Description: Inserts default prompt templates for different game types
-- Date: 2025-09-05

-- Insert default prompt templates for different game genres
INSERT INTO chat_prompt_templates (name, category, description, prompt_text, tags, is_public) VALUES

-- RPG Templates
('Classic Fantasy RPG Starter', 'rpg', 'A template for starting a classic fantasy RPG with character creation', 
'I want to create a classic fantasy RPG game. Help me design a character creation system with these elements:
- Character classes (warrior, mage, rogue, cleric)
- Attribute system (strength, intelligence, dexterity, constitution)
- Starting equipment and spells
- Basic combat mechanics
- Character progression system

Please suggest pixel art sprites and game mechanics for this RPG.', 
ARRAY['fantasy', 'character-creation', 'combat', 'progression'], true),

('Sci-Fi RPG Template', 'rpg', 'Template for creating science fiction RPG games',
'I want to create a sci-fi RPG set in space. Help me design:
- Futuristic character classes (pilot, engineer, psychic, soldier)
- Technology-based equipment and weapons
- Spaceship mechanics and customization
- Alien races and faction system
- Cybernetic upgrades and skill trees

Generate concepts for pixel art assets and game mechanics.', 
ARRAY['sci-fi', 'space', 'technology', 'aliens'], true),

-- Platformer Templates  
('Retro Platformer Starter', 'platformer', 'Classic 2D platformer game template',
'I want to create a retro-style 2D platformer game. Help me design:
- Main character with unique abilities (jump, dash, wall-jump)
- Level design with obstacles and enemies
- Power-ups and collectibles system
- Boss battles and special abilities
- 8-bit inspired art style and animations

Please suggest pixel art concepts and level mechanics.', 
ARRAY['retro', 'jumping', 'enemies', 'powerups'], true),

('Metroidvania Template', 'platformer', 'Template for interconnected world exploration platformer',
'I want to create a Metroidvania-style game. Help me design:
- Interconnected world map with locked areas
- Ability-gated progression (new abilities unlock new areas)
- Character upgrade system and new traversal mechanics
- Environmental storytelling and hidden secrets
- Boss fights that grant new abilities

Generate concepts for pixel art environments and ability progression.', 
ARRAY['metroidvania', 'exploration', 'abilities', 'interconnected'], true),

-- Puzzle Templates
('Logic Puzzle Game', 'puzzle', 'Template for creating logic-based puzzle games',
'I want to create a logic puzzle game. Help me design:
- Core puzzle mechanics (switches, buttons, doors)
- Difficulty progression and complexity scaling
- Visual feedback and player guidance systems
- Level editor for user-generated content
- Achievement system for perfect solutions

Please suggest pixel art UI elements and puzzle mechanics.', 
ARRAY['logic', 'switches', 'difficulty', 'editor'], true),

('Physics Puzzle Template', 'puzzle', 'Template for physics-based puzzle games',
'I want to create a physics-based puzzle game. Help me design:
- Gravity and momentum-based mechanics
- Destructible environments and object interactions
- Tool system (ropes, springs, levers, pulleys)
- Chain reaction puzzles and timing challenges
- Sandbox mode for experimentation

Generate concepts for pixel art physics objects and interactions.', 
ARRAY['physics', 'gravity', 'tools', 'chain-reactions'], true),

-- Shooter Templates
('Top-Down Shooter', 'shooter', 'Template for arcade-style top-down shooter',
'I want to create a top-down shooter game. Help me design:
- Player ship with multiple weapon types
- Enemy waves with different behaviors and patterns
- Power-up system and weapon upgrades
- Boss battles with multiple phases
- Score system and leaderboards

Please suggest pixel art sprites for ships, weapons, and effects.', 
ARRAY['top-down', 'weapons', 'enemies', 'bosses'], true),

('Side-Scrolling Shooter', 'shooter', 'Template for side-scrolling shoot-em-up games',
'I want to create a side-scrolling shooter (shmup). Help me design:
- Auto-scrolling levels with varied backgrounds
- Player ship with focused and spread shot options
- Complex enemy formations and attack patterns
- Screen-filling boss battles
- Bullet-hell sequences and safe zones

Generate concepts for pixel art ships, bullets, and explosion effects.', 
ARRAY['shmup', 'auto-scroll', 'formations', 'bullet-hell'], true),

-- Strategy Templates
('Tower Defense Game', 'strategy', 'Template for tower defense strategy game',
'I want to create a tower defense game. Help me design:
- Different tower types with unique abilities
- Enemy types with various resistances and speeds
- Upgrade paths and tower evolution system
- Wave-based progression with increasing difficulty
- Resource management and economy system

Please suggest pixel art towers, enemies, and battlefield layouts.', 
ARRAY['tower-defense', 'upgrades', 'waves', 'economy'], true),

-- Adventure Templates
('Point & Click Adventure', 'adventure', 'Template for story-driven adventure game',
'I want to create a point & click adventure game. Help me design:
- Inventory system and item interactions
- Dialogue trees and character conversations
- Puzzle integration within the story
- Multiple locations and scene transitions
- Save system and story progression tracking

Generate concepts for pixel art characters, items, and environments.', 
ARRAY['point-click', 'inventory', 'dialogue', 'story'], true),

-- Simulation Templates
('Life Simulation Game', 'simulation', 'Template for life/city simulation games',
'I want to create a life simulation game. Help me design:
- Character needs and mood systems (hunger, sleep, happiness)
- Home customization and decoration options
- Relationship system with NPCs
- Career progression and skill development
- Day/night cycle and seasonal events

Please suggest pixel art characters, furniture, and environment tiles.', 
ARRAY['life-sim', 'needs', 'relationships', 'careers'], true),

-- Custom/General Templates
('Game Jam Quick Start', 'custom', 'Rapid prototyping template for game jams',
'I''m participating in a game jam and need to create a game quickly. Help me:
- Choose a simple but engaging core mechanic
- Design minimal viable gameplay loop
- Plan essential features only (no scope creep)
- Create placeholder art that can be easily replaced
- Structure code for rapid iteration and polish

What''s a good game concept I can complete in [TIME_LIMIT] with my skill level?', 
ARRAY['game-jam', 'rapid', 'prototype', 'minimal'], true),

('Educational Game Template', 'custom', 'Template for creating educational/learning games',
'I want to create an educational game. Help me design:
- Learning objectives and skill assessment
- Gamification elements (points, badges, progress)
- Adaptive difficulty based on player performance
- Progress tracking and parent/teacher dashboards
- Fun mechanics that reinforce learning concepts

What subject matter would work well with pixel art game mechanics?', 
ARRAY['educational', 'learning', 'assessment', 'adaptive'], true),

('Multiplayer Concept', 'custom', 'Template for designing multiplayer game mechanics',
'I want to add multiplayer features to my game. Help me design:
- Cooperative vs competitive gameplay modes
- Network synchronization for game state
- Player matchmaking and lobby systems
- Anti-cheat measures and fair play
- Social features (chat, friends, leaderboards)

How can I implement multiplayer in a pixel art game effectively?', 
ARRAY['multiplayer', 'coop', 'competitive', 'networking'], true);

-- Insert usage analytics for templates (simulate some initial usage)
UPDATE chat_prompt_templates 
SET usage_count = FLOOR(RANDOM() * 50) + 10 
WHERE is_public = true;

-- Create some example categories for quick filtering
INSERT INTO chat_prompt_templates (name, category, description, prompt_text, tags, is_public) VALUES
('Action Game Starter', 'custom', 'Generic template for action-oriented games',
'I want to create an action game. Help me decide on:
- Core player actions and controls
- Enemy types and AI behaviors  
- Level structure and pacing
- Difficulty curve and player progression
- Visual style and audio needs

What type of action game would be most engaging for players?', 
ARRAY['action', 'controls', 'enemies', 'difficulty'], true);

-- Comments for documentation
COMMENT ON TABLE chat_prompt_templates IS 'Contains default and user-created prompt templates to help users get started with different types of games';

-- Analytics query examples (for future admin interface)
-- Most popular templates: SELECT name, usage_count FROM chat_prompt_templates ORDER BY usage_count DESC;
-- Templates by category: SELECT category, COUNT(*) FROM chat_prompt_templates GROUP BY category;
-- Recent templates: SELECT name, created_at FROM chat_prompt_templates ORDER BY created_at DESC;