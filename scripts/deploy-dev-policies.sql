-- Manual deployment script for dev-friendly RLS policies
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/ajwskzlxlvhkhlbedtrg/sql

-- 1. Create dev-friendly policy for games table
DROP POLICY IF EXISTS "Users can manage their own games" ON games;
CREATE POLICY "Enable all operations for development" ON games
FOR ALL
USING (
  -- Allow dev user ID specifically (from dev-mode.ts)
  auth.uid()::text = '00000000-0000-4000-8000-000000000001'
  OR
  -- Allow normal user operations
  auth.uid() = creator_id
  OR
  -- Allow if no auth context (for debugging)
  auth.uid() IS NULL
);

-- 2. Create dev-friendly policy for profiles table
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile or dev mode" ON profiles
FOR ALL
USING (
  auth.uid() = id 
  OR 
  auth.uid()::text = '00000000-0000-4000-8000-000000000001'
  OR
  id::text = '00000000-0000-4000-8000-000000000001'
);

-- 3. Create dev-friendly policy for game_scripts table
DROP POLICY IF EXISTS "Users can modify own scripts" ON game_scripts;
CREATE POLICY "Users can modify own scripts or dev mode" ON game_scripts
FOR ALL
USING (
  auth.uid() = creator_id
  OR
  auth.uid()::text = '00000000-0000-4000-8000-000000000001'
  OR
  creator_id::text = '00000000-0000-4000-8000-000000000001'
);

-- 4. Create dev-friendly policy for game_assets table  
DROP POLICY IF EXISTS "Users can modify own assets" ON game_assets;
CREATE POLICY "Users can modify own assets or dev mode" ON game_assets
FOR ALL
USING (
  auth.uid() = creator_id
  OR
  auth.uid()::text = '00000000-0000-4000-8000-000000000001'
  OR
  creator_id::text = '00000000-0000-4000-8000-000000000001'
);

-- 5. Ensure the dev user profile exists
INSERT INTO profiles (
  id,
  username,
  display_name,
  bio,
  subscription_tier,
  subscription_status,
  credits_remaining,
  is_verified,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-4000-8000-000000000001',
  'dev_creator',
  'GameGen Developer',
  'Development user for testing GameGen platform features',
  'max',
  'active',
  999999,
  true,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_status = EXCLUDED.subscription_status,
  credits_remaining = EXCLUDED.credits_remaining,
  is_verified = EXCLUDED.is_verified,
  updated_at = now();

-- 6. Seed basic script templates
INSERT INTO game_scripts (
  id,
  game_id,
  creator_id,
  name,
  script_type,
  description,
  javascript_code,
  source_hash,
  toxoid_metadata,
  generated_by_ai,
  is_active,
  execution_order,
  validation_status,
  created_at,
  updated_at
) VALUES 
-- Basic Player Movement Template
(
  '10000000-0000-4000-8000-000000000001',
  null, -- Template scripts don't belong to a specific game
  '00000000-0000-4000-8000-000000000001', -- Dev user creates templates
  'Player Movement Controller',
  'component',
  'Basic WASD movement controller for player entities',
  '// Basic Player Movement Controller
import { Component, System } from "toxoid";

class MovementComponent extends Component {
  constructor() {
    super();
    this.velocity = { x: 0, y: 0 };
    this.speed = 200;
    this.friction = 0.8;
  }
}

class MovementSystem extends System {
  constructor() {
    super();
    this.requiredComponents = [MovementComponent];
  }
  
  update(entities, input, deltaTime) {
    entities.forEach(entity => {
      const movement = entity.getComponent(MovementComponent);
      
      // Handle input
      if (input.isKeyPressed("ArrowLeft") || input.isKeyPressed("a")) {
        movement.velocity.x = -movement.speed;
      } else if (input.isKeyPressed("ArrowRight") || input.isKeyPressed("d")) {
        movement.velocity.x = movement.speed;
      } else {
        movement.velocity.x *= movement.friction;
      }
      
      if (input.isKeyPressed("ArrowUp") || input.isKeyPressed("w")) {
        movement.velocity.y = -movement.speed;
      } else if (input.isKeyPressed("ArrowDown") || input.isKeyPressed("s")) {
        movement.velocity.y = movement.speed;
      } else {
        movement.velocity.y *= movement.friction;
      }
      
      // Apply movement
      entity.position.x += movement.velocity.x * deltaTime;
      entity.position.y += movement.velocity.y * deltaTime;
    });
  }
}

// Export for Toxoid
export { MovementComponent, MovementSystem };',
  'movement_template_hash_001',
  '{"api_calls": ["input.isKeyPressed", "entity.getComponent", "entity.position"], "components_used": ["MovementComponent"], "memory_estimate": 1024, "entities_affected": ["player"], "performance_score": 8}',
  false,
  true,
  1,
  'valid',
  now(),
  now()
),

-- Basic Sprite Renderer Template
(
  '10000000-0000-4000-8000-000000000002',
  null,
  '00000000-0000-4000-8000-000000000001',
  'Sprite Renderer',
  'component', 
  'Basic sprite rendering system for 2D games',
  '// Basic Sprite Renderer
import { Component, System } from "toxoid";

class SpriteComponent extends Component {
  constructor(spriteUrl, width = 32, height = 32) {
    super();
    this.spriteUrl = spriteUrl;
    this.width = width;
    this.height = height;
    this.visible = true;
    this.scale = { x: 1, y: 1 };
    this.rotation = 0;
  }
}

class RenderSystem extends System {
  constructor() {
    super();
    this.requiredComponents = [SpriteComponent];
  }
  
  update(entities, input, deltaTime, renderer) {
    entities.forEach(entity => {
      const sprite = entity.getComponent(SpriteComponent);
      
      if (!sprite.visible) return;
      
      renderer.drawSprite({
        url: sprite.spriteUrl,
        x: entity.position.x,
        y: entity.position.y,
        width: sprite.width * sprite.scale.x,
        height: sprite.height * sprite.scale.y,
        rotation: sprite.rotation
      });
    });
  }
}

export { SpriteComponent, RenderSystem };',
  'sprite_template_hash_001',
  '{"api_calls": ["entity.getComponent", "renderer.drawSprite"], "components_used": ["SpriteComponent"], "memory_estimate": 512, "entities_affected": ["all"], "performance_score": 9}',
  false,
  true,
  2,
  'valid',
  now(),
  now()
),

-- Game Initialization Template
(
  '10000000-0000-4000-8000-000000000003',
  null,
  '00000000-0000-4000-8000-000000000001',
  'Game Initialization',
  'initialization',
  'Basic game setup and entity creation',
  '// Game Initialization Script
import { Entity } from "toxoid";

function initializeGame(world) {
  console.log("Initializing game...");
  
  // Create player entity
  const player = new Entity("player");
  player.position = { x: 100, y: 100 };
  world.addEntity(player);
  
  console.log("Game initialized successfully!");
  return player;
}

export { initializeGame };',
  'init_template_hash_001',
  '{"api_calls": ["world.addEntity", "console.log"], "components_used": [], "memory_estimate": 1024, "entities_affected": ["player"], "performance_score": 9}',
  false,
  true,
  0,
  'valid',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Verification queries
SELECT 'Dev user created:' as status, username, display_name FROM profiles WHERE id = '00000000-0000-4000-8000-000000000001';
SELECT 'Script templates created:' as status, count(*) as template_count FROM game_scripts WHERE game_id IS NULL;