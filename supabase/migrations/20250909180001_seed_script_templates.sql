-- Seed Script Templates for Code Editor
-- This migration creates initial script templates that users can load in the Code Editor

-- Create basic Toxoid system script templates
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
  gen_random_uuid(),
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
  encode('sha256', '// Basic Player Movement Controller...', 'hex'),
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
  gen_random_uuid(),
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
  encode('sha256', '// Basic Sprite Renderer...', 'hex'),
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
  gen_random_uuid(),
  null,
  '00000000-0000-4000-8000-000000000001',
  'Game Initialization',
  'initialization',
  'Basic game setup and entity creation',
  '// Game Initialization Script
import { Entity } from "toxoid";
import { MovementComponent, SpriteComponent } from "./components";

function initializeGame(world) {
  // Create player entity
  const player = new Entity("player");
  player.position = { x: 100, y: 100 };
  player.addComponent(new MovementComponent());
  player.addComponent(new SpriteComponent("/sprites/player.png", 32, 32));
  world.addEntity(player);
  
  // Create some background objects
  for (let i = 0; i < 5; i++) {
    const bg = new Entity(`background_${i}`);
    bg.position = { 
      x: Math.random() * 800, 
      y: Math.random() * 600 
    };
    bg.addComponent(new SpriteComponent("/sprites/tile.png", 64, 64));
    world.addEntity(bg);
  }
  
  console.log("Game initialized successfully!");
}

export { initializeGame };',
  encode('sha256', '// Game Initialization Script...', 'hex'),
  '{"api_calls": ["world.addEntity", "entity.addComponent"], "components_used": ["MovementComponent", "SpriteComponent"], "memory_estimate": 2048, "entities_affected": ["player", "background"], "performance_score": 7}',
  false,
  true,
  0,
  'valid',
  now(),
  now()
),

-- Collision System Template
(
  gen_random_uuid(),
  null,
  '00000000-0000-4000-8000-000000000001',
  'Collision Detection',
  'system',
  'Basic AABB collision detection system',
  '// Collision Detection System
import { Component, System } from "toxoid";

class ColliderComponent extends Component {
  constructor(width, height, isSolid = false) {
    super();
    this.width = width;
    this.height = height;
    this.isSolid = isSolid;
    this.collisions = [];
  }
  
  getBounds(entity) {
    return {
      left: entity.position.x,
      right: entity.position.x + this.width,
      top: entity.position.y,
      bottom: entity.position.y + this.height
    };
  }
}

class CollisionSystem extends System {
  constructor() {
    super();
    this.requiredComponents = [ColliderComponent];
  }
  
  update(entities) {
    // Clear previous collisions
    entities.forEach(entity => {
      entity.getComponent(ColliderComponent).collisions = [];
    });
    
    // Check all entity pairs
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entityA = entities[i];
        const entityB = entities[j];
        
        const colliderA = entityA.getComponent(ColliderComponent);
        const colliderB = entityB.getComponent(ColliderComponent);
        
        const boundsA = colliderA.getBounds(entityA);
        const boundsB = colliderB.getBounds(entityB);
        
        if (this.isOverlapping(boundsA, boundsB)) {
          colliderA.collisions.push(entityB);
          colliderB.collisions.push(entityA);
          
          // Handle solid collisions
          if (colliderA.isSolid || colliderB.isSolid) {
            this.resolveCollision(entityA, entityB, boundsA, boundsB);
          }
        }
      }
    }
  }
  
  isOverlapping(boundsA, boundsB) {
    return !(
      boundsA.right <= boundsB.left ||
      boundsA.left >= boundsB.right ||
      boundsA.bottom <= boundsB.top ||
      boundsA.top >= boundsB.bottom
    );
  }
  
  resolveCollision(entityA, entityB, boundsA, boundsB) {
    // Simple separation - move entities apart
    const overlapX = Math.min(boundsA.right - boundsB.left, boundsB.right - boundsA.left);
    const overlapY = Math.min(boundsA.bottom - boundsB.top, boundsB.bottom - boundsA.top);
    
    if (overlapX < overlapY) {
      // Separate horizontally
      const direction = boundsA.left < boundsB.left ? -1 : 1;
      entityA.position.x += direction * overlapX * 0.5;
      entityB.position.x -= direction * overlapX * 0.5;
    } else {
      // Separate vertically
      const direction = boundsA.top < boundsB.top ? -1 : 1;
      entityA.position.y += direction * overlapY * 0.5;
      entityB.position.y -= direction * overlapY * 0.5;
    }
  }
}

export { ColliderComponent, CollisionSystem };',
  encode('sha256', '// Collision Detection System...', 'hex'),
  '{"api_calls": ["entity.getComponent", "entity.position"], "components_used": ["ColliderComponent"], "memory_estimate": 4096, "entities_affected": ["all"], "performance_score": 6}',
  false,
  true,
  3,
  'valid',
  now(),
  now()
);

-- Update script count for dev user
UPDATE profiles 
SET updated_at = now() 
WHERE id = '00000000-0000-4000-8000-000000000001';

-- Add helpful comment
COMMENT ON TABLE game_scripts IS 'Contains both user-created game scripts and template scripts (where game_id IS NULL)';