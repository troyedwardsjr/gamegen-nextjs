/**
 * Toxoid Script Template Library
 *
 * Comprehensive collection of ECS patterns, game systems, and behavioral
 * templates for the GameGen platform. These templates serve as the foundation
 * for AI-generated scripts and provide proven patterns for game development.
 */

import {
  ScriptTemplate,
  SystemTemplate,
  ComponentTemplate,
  ToxoidPhases,
} from "@/types/toxoid";

// Component Templates
export const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  {
    name: "Position",
    description: "World position with X and Y coordinates",
    fields: [
      { name: "x", type: "number", default: 0, description: "X coordinate" },
      { name: "y", type: "number", default: 0, description: "Y coordinate" },
    ],
    defaultValues: { x: 0, y: 0 },
  },

  {
    name: "Velocity",
    description: "Movement velocity for physics-based motion",
    fields: [
      { name: "x", type: "number", default: 0, description: "X velocity" },
      { name: "y", type: "number", default: 0, description: "Y velocity" },
      {
        name: "maxSpeed",
        type: "number",
        default: 300,
        description: "Maximum speed limit",
      },
    ],
    defaultValues: { x: 0, y: 0, maxSpeed: 300 },
  },

  {
    name: "Health",
    description: "Entity health system with current and maximum values",
    fields: [
      {
        name: "value",
        type: "number",
        default: 100,
        description: "Current health",
      },
      {
        name: "maxValue",
        type: "number",
        default: 100,
        description: "Maximum health",
      },
    ],
    defaultValues: { value: 100, maxValue: 100 },
  },

  {
    name: "Damage",
    description: "Damage dealing component for projectiles and attacks",
    fields: [
      {
        name: "amount",
        type: "number",
        default: 10,
        description: "Damage amount",
      },
      {
        name: "type",
        type: "string",
        default: "physical",
        description: "Damage type",
      },
    ],
    defaultValues: { amount: 10, type: "physical" },
  },

  {
    name: "Collider",
    description: "Collision detection with bounding box",
    fields: [
      {
        name: "width",
        type: "number",
        default: 32,
        description: "Collision width",
      },
      {
        name: "height",
        type: "number",
        default: 32,
        description: "Collision height",
      },
      {
        name: "isTrigger",
        type: "boolean",
        default: false,
        description: "Is trigger collider",
      },
    ],
    defaultValues: { width: 32, height: 32, isTrigger: false },
  },

  {
    name: "Lifetime",
    description: "Entity with limited lifespan",
    fields: [
      {
        name: "timeLeft",
        type: "number",
        default: 5.0,
        description: "Remaining lifetime in seconds",
      },
      {
        name: "destroyOnExpire",
        type: "boolean",
        default: true,
        description: "Auto-destroy when expired",
      },
    ],
    defaultValues: { timeLeft: 5.0, destroyOnExpire: true },
  },

  {
    name: "AI",
    description: "Basic AI behavior component",
    fields: [
      {
        name: "state",
        type: "string",
        default: "idle",
        description: "Current AI state",
      },
      {
        name: "target",
        type: "number",
        default: 0,
        description: "Target entity ID",
      },
      {
        name: "alertDistance",
        type: "number",
        default: 100,
        description: "Detection range",
      },
    ],
    defaultValues: { state: "idle", target: 0, alertDistance: 100 },
  },
];

// System Templates
export const SYSTEM_TEMPLATES: SystemTemplate[] = [
  {
    name: "Movement System",
    query: "Position, Velocity",
    phase: ToxoidPhases.ON_UPDATE,
    description: "Updates entity positions based on velocity",
    codeTemplate: `
Toxoid.System.create("MovementSystem", "Position, Velocity", Toxoid.Phases.ON_UPDATE,
  function(iter) {
    iter.entities().forEach(entity => {
      const position = entity.getComponent("Position");
      const velocity = entity.getComponent("Velocity");
      
      if (position && velocity) {
        // Apply velocity to position
        position.x += velocity.x * iter.deltaTime;
        position.y += velocity.y * iter.deltaTime;
        
        // Apply speed limits if specified
        if (velocity.maxSpeed) {
          const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
          if (speed > velocity.maxSpeed) {
            const factor = velocity.maxSpeed / speed;
            velocity.x *= factor;
            velocity.y *= factor;
          }
        }
      }
    });
  }
);`,
    parameters: [],
  },

  {
    name: "Input System",
    query: "Position, Player",
    phase: ToxoidPhases.PRE_UPDATE,
    description: "Handles player input for movement and actions",
    codeTemplate: `
Toxoid.System.create("InputSystem", "Position, Player", Toxoid.Phases.PRE_UPDATE,
  function(iter) {
    const keyboard = Toxoid.API.getSingleton("KeyboardInput");
    if (!keyboard) return;
    
    const moveSpeed = {{MOVE_SPEED}};
    
    iter.entities().forEach(entity => {
      const position = entity.getComponent("Position");
      if (!position) return;
      
      let velocity = entity.getComponent("Velocity");
      if (!velocity) {
        entity.add("Velocity");
        velocity = entity.getComponent("Velocity");
      }
      
      // Reset velocity
      velocity.x = 0;
      velocity.y = 0;
      
      // Handle movement input
      if (keyboard.left) velocity.x -= moveSpeed;
      if (keyboard.right) velocity.x += moveSpeed;
      if (keyboard.up) velocity.y -= moveSpeed;
      if (keyboard.down) velocity.y += moveSpeed;
      
      // Handle action input
      if (keyboard.space) {
        handlePlayerAction(entity);
      }
    });
  }
);`,
    parameters: [
      {
        name: "MOVE_SPEED",
        type: "number",
        description: "Player movement speed",
        default: 200,
      },
    ],
  },

  {
    name: "Collision System",
    query: "Position, Collider",
    phase: ToxoidPhases.ON_UPDATE,
    description: "AABB collision detection between entities",
    codeTemplate: `
Toxoid.System.create("CollisionSystem", "Position, Collider", Toxoid.Phases.ON_UPDATE,
  function(iter) {
    const entities = iter.entities();
    
    // Check all entity pairs
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entityA = entities[i];
        const entityB = entities[j];
        
        if (checkAABBCollision(entityA, entityB)) {
          handleCollision(entityA, entityB);
        }
      }
    }
  }
);

function checkAABBCollision(entityA, entityB) {
  const posA = entityA.getComponent("Position");
  const posB = entityB.getComponent("Position");
  const colliderA = entityA.getComponent("Collider");
  const colliderB = entityB.getComponent("Collider");
  
  if (!posA || !posB || !colliderA || !colliderB) return false;
  
  const halfWidthA = colliderA.width / 2;
  const halfHeightA = colliderA.height / 2;
  const halfWidthB = colliderB.width / 2;
  const halfHeightB = colliderB.height / 2;
  
  return Math.abs(posA.x - posB.x) < halfWidthA + halfWidthB &&
         Math.abs(posA.y - posB.y) < halfHeightA + halfHeightB;
}

function handleCollision(entityA, entityB) {
  console.log(\`Collision between \${entityA.name} and \${entityB.name}\`);
  
  // Handle damage
  if (entityA.has("Damage") && entityB.has("Health")) {
    dealDamage(entityA, entityB);
  } else if (entityB.has("Damage") && entityA.has("Health")) {
    dealDamage(entityB, entityA);
  }
}`,
    parameters: [],
  },

  {
    name: "Lifetime System",
    query: "Lifetime",
    phase: ToxoidPhases.ON_UPDATE,
    description: "Manages entity lifetime and destruction",
    codeTemplate: `
Toxoid.System.create("LifetimeSystem", "Lifetime", Toxoid.Phases.ON_UPDATE,
  function(iter) {
    const toDestroy = [];
    
    iter.entities().forEach(entity => {
      const lifetime = entity.getComponent("Lifetime");
      if (!lifetime) return;
      
      lifetime.timeLeft -= iter.deltaTime;
      
      if (lifetime.timeLeft <= 0) {
        if (lifetime.destroyOnExpire) {
          toDestroy.push(entity.id);
        } else {
          // Trigger expiry event without destroying
          if (entity.onExpire) {
            entity.onExpire();
          }
        }
      }
    });
    
    // Destroy expired entities
    toDestroy.forEach(entityId => {
      Toxoid.API.removeEntity(entityId);
    });
  }
);`,
    parameters: [],
  },

  {
    name: "AI System",
    query: "Position, AI",
    phase: ToxoidPhases.ON_UPDATE,
    description: "Basic AI behavior system with state machine",
    codeTemplate: `
Toxoid.System.create("AISystem", "Position, AI", Toxoid.Phases.ON_UPDATE,
  function(iter) {
    iter.entities().forEach(entity => {
      const position = entity.getComponent("Position");
      const ai = entity.getComponent("AI");
      
      if (!position || !ai) return;
      
      switch (ai.state) {
        case 'idle':
          handleIdleState(entity, position, ai);
          break;
        case 'chase':
          handleChaseState(entity, position, ai);
          break;
        case 'attack':
          handleAttackState(entity, position, ai);
          break;
        case 'flee':
          handleFleeState(entity, position, ai);
          break;
      }
    });
  }
);

function handleIdleState(entity, position, ai) {
  // Look for player within alert distance
  const players = Toxoid.Query.create("Position, Player");
  let closestPlayer = null;
  let closestDistance = ai.alertDistance + 1;
  
  players.each(player => {
    const playerPos = player.getComponent("Position");
    const distance = Math.sqrt(
      (position.x - playerPos.x) ** 2 + 
      (position.y - playerPos.y) ** 2
    );
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestPlayer = player;
    }
  });
  
  if (closestPlayer && closestDistance <= ai.alertDistance) {
    ai.state = 'chase';
    ai.target = closestPlayer.id;
  }
}

function handleChaseState(entity, position, ai) {
  const target = Toxoid.API.getEntity(ai.target);
  if (!target) {
    ai.state = 'idle';
    ai.target = 0;
    return;
  }
  
  const targetPos = target.getComponent("Position");
  if (!targetPos) return;
  
  // Move towards target
  let velocity = entity.getComponent("Velocity");
  if (!velocity) {
    entity.add("Velocity");
    velocity = entity.getComponent("Velocity");
  }
  
  const dx = targetPos.x - position.x;
  const dy = targetPos.y - position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance > ai.alertDistance * 1.5) {
    // Lost target
    ai.state = 'idle';
    ai.target = 0;
  } else if (distance < 30) {
    // Close enough to attack
    ai.state = 'attack';
  } else {
    // Move towards target
    const chaseSpeed = {{CHASE_SPEED}};
    velocity.x = (dx / distance) * chaseSpeed;
    velocity.y = (dy / distance) * chaseSpeed;
  }
}`,
    parameters: [
      {
        name: "CHASE_SPEED",
        type: "number",
        description: "AI chase speed",
        default: 150,
      },
    ],
  },
];

// Complete Game Templates
export const COMPLETE_GAME_TEMPLATES: ScriptTemplate[] = [
  {
    id: "bullet-hell-basic",
    name: "Basic Bullet Hell Game",
    description:
      "Simple bullet hell game with player, enemies, and projectiles",
    category: "complete_game",
    difficulty: "intermediate",
    tags: ["bullet-hell", "shooting", "arcade"],
    dependencies: [],
    requiredComponents: [
      "Position",
      "Velocity",
      "Health",
      "Player",
      "Enemy",
      "Projectile",
    ],
    documentation:
      "Creates a basic bullet hell game with player movement, enemy spawning, and projectile mechanics",
    examples: [],
    code: `
// Bullet Hell Game Template
class BulletHellGame {
  constructor() {
    this.gameState = {
      score: 0,
      lives: 3,
      level: 1,
      enemySpawnRate: 2.0,
      lastEnemySpawn: 0
    };
    
    this.init();
  }
  
  init() {
    // Create custom components
    Toxoid.API.createComponent("Player");
    Toxoid.API.createComponent("Enemy");
    Toxoid.API.createComponent("Projectile");
    Toxoid.API.createComponent("PowerUp");
    
    // Register all systems
    this.createPlayerSystem();
    this.createEnemySystem();
    this.createProjectileSystem();
    this.createCollisionSystem();
    this.createSpawnSystem();
    
    // Create player
    this.createPlayer();
    
    console.log("Bullet Hell Game initialized!");
  }
  
  createPlayer() {
    const player = Toxoid.API.createEntity("Player");
    player.add("Position");
    player.add("Velocity");
    player.add("Health");
    player.add("Player");
    player.add("Collider");
    
    const position = player.getComponent("Position");
    position.x = 400;
    position.y = 500;
    
    const health = player.getComponent("Health");
    health.value = 100;
    health.maxValue = 100;
    
    const collider = player.getComponent("Collider");
    collider.width = 24;
    collider.height = 24;
    
    // Create visual representation
    player.visualId = Toxoid.API.filledRect(position.x - 12, position.y - 12, 24, 24, 
      {r: 0.2, g: 0.8, b: 0.2, a: 1.0});
    
    return player;
  }
  
  createPlayerSystem() {
    Toxoid.System.create("PlayerSystem", "Position, Player", Toxoid.Phases.PRE_UPDATE,
      (iter) => {
        const keyboard = Toxoid.API.getSingleton("KeyboardInput");
        if (!keyboard) return;
        
        const moveSpeed = 250;
        
        iter.entities().forEach(player => {
          const position = player.getComponent("Position");
          let velocity = player.getComponent("Velocity");
          
          if (!velocity) {
            player.add("Velocity");
            velocity = player.getComponent("Velocity");
          }
          
          // Movement
          velocity.x = 0;
          velocity.y = 0;
          
          if (keyboard.left && position.x > 20) velocity.x = -moveSpeed;
          if (keyboard.right && position.x < 780) velocity.x = moveSpeed;
          if (keyboard.up && position.y > 20) velocity.y = -moveSpeed;
          if (keyboard.down && position.y < 580) velocity.y = moveSpeed;
          
          // Shooting
          if (keyboard.space) {
            this.createPlayerProjectile(position.x, position.y - 20);
          }
          
          // Update visual
          if (player.visualId) {
            const visual = Toxoid.API.getEntity(player.visualId);
            if (visual) {
              const visualPos = visual.getComponent("Position");
              if (visualPos) {
                visualPos.x = position.x - 12;
                visualPos.y = position.y - 12;
              }
            }
          }
        });
      }
    );
  }
  
  createEnemySystem() {
    Toxoid.System.create("EnemySystem", "Position, Enemy", Toxoid.Phases.ON_UPDATE,
      (iter) => {
        iter.entities().forEach(enemy => {
          const position = enemy.getComponent("Position");
          let velocity = enemy.getComponent("Velocity");
          
          if (!velocity) {
            enemy.add("Velocity");
            velocity = entity.getComponent("Velocity");
          }
          
          // Simple downward movement
          velocity.y = 100;
          
          // Remove if off screen
          if (position.y > 650) {
            if (enemy.visualId) {
              Toxoid.API.removeEntity(enemy.visualId);
            }
            Toxoid.API.removeEntity(enemy.id);
          }
          
          // Update visual
          if (enemy.visualId) {
            const visual = Toxoid.API.getEntity(enemy.visualId);
            if (visual) {
              const visualPos = visual.getComponent("Position");
              if (visualPos) {
                visualPos.x = position.x - 15;
                visualPos.y = position.y - 15;
              }
            }
          }
        });
      }
    );
  }
  
  createSpawnSystem() {
    Toxoid.System.create("SpawnSystem", "Player", Toxoid.Phases.ON_UPDATE,
      (iter) => {
        const currentTime = Date.now() / 1000;
        
        if (currentTime - this.gameState.lastEnemySpawn > this.gameState.enemySpawnRate) {
          this.spawnEnemy();
          this.gameState.lastEnemySpawn = currentTime;
        }
      }
    );
  }
  
  spawnEnemy() {
    const enemy = Toxoid.API.createEntity("Enemy");
    enemy.add("Position");
    enemy.add("Velocity");
    enemy.add("Health");
    enemy.add("Enemy");
    enemy.add("Collider");
    
    const position = enemy.getComponent("Position");
    position.x = Math.random() * 760 + 20;
    position.y = -30;
    
    const health = enemy.getComponent("Health");
    health.value = 30;
    health.maxValue = 30;
    
    const collider = enemy.getComponent("Collider");
    collider.width = 30;
    collider.height = 30;
    
    // Create visual
    enemy.visualId = Toxoid.API.filledRect(position.x - 15, position.y - 15, 30, 30,
      {r: 0.8, g: 0.2, b: 0.2, a: 1.0});
    
    return enemy;
  }
  
  createPlayerProjectile(x, y) {
    const projectile = Toxoid.API.createEntity("PlayerBullet");
    projectile.add("Position");
    projectile.add("Velocity");
    projectile.add("Projectile");
    projectile.add("Collider");
    projectile.add("Lifetime");
    
    const position = projectile.getComponent("Position");
    position.x = x;
    position.y = y;
    
    const velocity = projectile.getComponent("Velocity");
    velocity.y = -400; // Move upward
    
    const collider = projectile.getComponent("Collider");
    collider.width = 8;
    collider.height = 12;
    
    const lifetime = projectile.getComponent("Lifetime");
    lifetime.timeLeft = 3.0;
    
    // Create visual
    projectile.visualId = Toxoid.API.filledRect(x - 4, y - 6, 8, 12,
      {r: 1.0, g: 1.0, b: 0.3, a: 1.0});
    
    return projectile;
  }
}

// Initialize the game
const bulletHellGame = new BulletHellGame();
`,
  },

  {
    id: "simple-platformer",
    name: "Simple Platformer",
    description: "Basic platformer with player, platforms, and gravity",
    category: "complete_game",
    difficulty: "beginner",
    tags: ["platformer", "2d", "physics"],
    dependencies: [],
    requiredComponents: [
      "Position",
      "Velocity",
      "Player",
      "Platform",
      "Gravity",
    ],
    documentation:
      "Creates a simple platformer with gravity, jumping, and collision with platforms",
    examples: [],
    code: `
// Simple Platformer Template
class SimplePlatformer {
  constructor() {
    this.GRAVITY = 800;
    this.JUMP_FORCE = -350;
    this.MOVE_SPEED = 200;
    
    this.init();
  }
  
  init() {
    // Create components
    Toxoid.API.createComponent("Player");
    Toxoid.API.createComponent("Platform");
    Toxoid.API.createComponent("Gravity");
    Toxoid.API.createComponent("Grounded");
    
    // Register systems
    this.createInputSystem();
    this.createGravitySystem();
    this.createPlatformCollisionSystem();
    
    // Create world
    this.createPlayer();
    this.createPlatforms();
    
    console.log("Simple Platformer initialized!");
  }
  
  createPlayer() {
    const player = Toxoid.API.createEntity("Player");
    player.add("Position");
    player.add("Velocity");
    player.add("Player");
    player.add("Gravity");
    player.add("Collider");
    
    const position = player.getComponent("Position");
    position.x = 100;
    position.y = 400;
    
    const collider = player.getComponent("Collider");
    collider.width = 32;
    collider.height = 48;
    
    // Visual
    player.visualId = Toxoid.API.filledRect(position.x - 16, position.y - 24, 32, 48,
      {r: 0.2, g: 0.6, b: 0.8, a: 1.0});
    
    return player;
  }
  
  createPlatforms() {
    const platformData = [
      {x: 200, y: 500, width: 200, height: 20},
      {x: 500, y: 400, width: 150, height: 20},
      {x: 50, y: 300, width: 100, height: 20},
      {x: 600, y: 250, width: 180, height: 20}
    ];
    
    platformData.forEach(data => {
      const platform = Toxoid.API.createEntity("Platform");
      platform.add("Position");
      platform.add("Platform");
      platform.add("Collider");
      
      const position = platform.getComponent("Position");
      position.x = data.x + data.width / 2;
      position.y = data.y + data.height / 2;
      
      const collider = platform.getComponent("Collider");
      collider.width = data.width;
      collider.height = data.height;
      
      // Visual
      platform.visualId = Toxoid.API.filledRect(data.x, data.y, data.width, data.height,
        {r: 0.4, g: 0.3, b: 0.2, a: 1.0});
    });
  }
  
  createInputSystem() {
    Toxoid.System.create("PlatformerInputSystem", "Position, Player", Toxoid.Phases.PRE_UPDATE,
      (iter) => {
        const keyboard = Toxoid.API.getSingleton("KeyboardInput");
        if (!keyboard) return;
        
        iter.entities().forEach(player => {
          let velocity = player.getComponent("Velocity");
          if (!velocity) {
            player.add("Velocity");
            velocity = player.getComponent("Velocity");
          }
          
          // Horizontal movement
          velocity.x = 0;
          if (keyboard.left) velocity.x = -this.MOVE_SPEED;
          if (keyboard.right) velocity.x = this.MOVE_SPEED;
          
          // Jumping (only if grounded)
          if (keyboard.space && player.has("Grounded")) {
            velocity.y = this.JUMP_FORCE;
            player.remove("Grounded");
          }
        });
      }
    );
  }
  
  createGravitySystem() {
    Toxoid.System.create("GravitySystem", "Velocity, Gravity", Toxoid.Phases.ON_UPDATE,
      (iter) => {
        iter.entities().forEach(entity => {
          const velocity = entity.getComponent("Velocity");
          if (velocity) {
            velocity.y += this.GRAVITY * iter.deltaTime;
            
            // Terminal velocity
            if (velocity.y > 600) velocity.y = 600;
          }
        });
      }
    );
  }
  
  createPlatformCollisionSystem() {
    Toxoid.System.create("PlatformCollisionSystem", "Position, Velocity, Player", Toxoid.Phases.POST_UPDATE,
      (iter) => {
        const platforms = Toxoid.Query.create("Position, Platform, Collider");
        
        iter.entities().forEach(player => {
          const playerPos = player.getComponent("Position");
          const playerVel = player.getComponent("Velocity");
          const playerCol = player.getComponent("Collider");
          
          if (!playerPos || !playerVel || !playerCol) return;
          
          let wasGrounded = player.has("Grounded");
          player.remove("Grounded");
          
          platforms.each(platform => {
            const platPos = platform.getComponent("Position");
            const platCol = platform.getComponent("Collider");
            
            if (this.checkAABB(playerPos, playerCol, platPos, platCol)) {
              // Simple collision resolution - landing on top
              if (playerVel.y > 0 && 
                  playerPos.y < platPos.y) {
                playerPos.y = platPos.y - platCol.height / 2 - playerCol.height / 2;
                playerVel.y = 0;
                player.add("Grounded");
              }
            }
          });
          
          // Update player visual
          if (player.visualId) {
            const visual = Toxoid.API.getEntity(player.visualId);
            if (visual) {
              const visualPos = visual.getComponent("Position");
              if (visualPos) {
                visualPos.x = playerPos.x - 16;
                visualPos.y = playerPos.y - 24;
              }
            }
          }
        });
      }
    );
  }
  
  checkAABB(posA, colA, posB, colB) {
    return Math.abs(posA.x - posB.x) < (colA.width + colB.width) / 2 &&
           Math.abs(posA.y - posB.y) < (colA.height + colB.height) / 2;
  }
}

// Initialize the platformer
const platformer = new SimplePlatformer();
`,
  },
];

// Behavior Templates
export const BEHAVIOR_TEMPLATES: ScriptTemplate[] = [
  {
    id: "follow-behavior",
    name: "Follow Behavior",
    description: "Makes an entity follow a target entity",
    category: "behavior",
    difficulty: "beginner",
    tags: ["ai", "movement", "follow"],
    dependencies: ["Position", "Velocity"],
    requiredComponents: ["Position", "Velocity"],
    documentation:
      "Behavior that makes an entity smoothly follow another entity",
    examples: [
      {
        name: "Pet Following Player",
        description: "A pet entity that follows the player around",
        code: "applyFollowBehavior(pet, player, 50, 150);",
      },
    ],
    code: `
function applyFollowBehavior(follower, target, followDistance, moveSpeed) {
  // Add required components if missing
  if (!follower.has("Velocity")) {
    follower.add("Velocity");
  }
  
  // Store behavior data on the entity
  follower.followTarget = target.id;
  follower.followDistance = followDistance || 50;
  follower.followSpeed = moveSpeed || 100;
  
  // Create or update the follow system
  if (!globalThis.followSystemCreated) {
    Toxoid.System.create("FollowBehaviorSystem", "Position, Velocity", Toxoid.Phases.ON_UPDATE,
      function(iter) {
        iter.entities().forEach(entity => {
          if (!entity.followTarget) return;
          
          const target = Toxoid.API.getEntity(entity.followTarget);
          if (!target) return;
          
          const position = entity.getComponent("Position");
          const velocity = entity.getComponent("Velocity");
          const targetPos = target.getComponent("Position");
          
          if (!position || !velocity || !targetPos) return;
          
          const dx = targetPos.x - position.x;
          const dy = targetPos.y - position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > entity.followDistance) {
            // Move towards target
            const normalizedX = dx / distance;
            const normalizedY = dy / distance;
            
            velocity.x = normalizedX * entity.followSpeed;
            velocity.y = normalizedY * entity.followSpeed;
          } else {
            // Close enough, stop moving
            velocity.x = 0;
            velocity.y = 0;
          }
        });
      }
    );
    globalThis.followSystemCreated = true;
  }
}`,
  },

  {
    id: "patrol-behavior",
    name: "Patrol Behavior",
    description: "Makes an entity patrol between waypoints",
    category: "behavior",
    difficulty: "intermediate",
    tags: ["ai", "movement", "patrol"],
    dependencies: ["Position", "Velocity"],
    requiredComponents: ["Position", "Velocity"],
    documentation:
      "Behavior that makes an entity patrol along a set of waypoints",
    examples: [
      {
        name: "Guard Patrolling",
        description: "A guard entity that patrols between multiple points",
        code: "applyPatrolBehavior(guard, [{x: 100, y: 200}, {x: 300, y: 200}, {x: 300, y: 400}], 80);",
      },
    ],
    code: `
function applyPatrolBehavior(entity, waypoints, moveSpeed) {
  if (!waypoints || waypoints.length < 2) {
    console.warn("Patrol behavior requires at least 2 waypoints");
    return;
  }
  
  // Add required components
  if (!entity.has("Velocity")) {
    entity.add("Velocity");
  }
  
  // Store patrol data
  entity.patrolWaypoints = [...waypoints];
  entity.patrolSpeed = moveSpeed || 80;
  entity.currentWaypointIndex = 0;
  entity.patrolThreshold = 10; // How close to get to waypoint
  
  // Create patrol system if it doesn't exist
  if (!globalThis.patrolSystemCreated) {
    Toxoid.System.create("PatrolBehaviorSystem", "Position, Velocity", Toxoid.Phases.ON_UPDATE,
      function(iter) {
        iter.entities().forEach(entity => {
          if (!entity.patrolWaypoints) return;
          
          const position = entity.getComponent("Position");
          const velocity = entity.getComponent("Velocity");
          
          if (!position || !velocity) return;
          
          const currentWaypoint = entity.patrolWaypoints[entity.currentWaypointIndex];
          const dx = currentWaypoint.x - position.x;
          const dy = currentWaypoint.y - position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance <= entity.patrolThreshold) {
            // Reached waypoint, move to next
            entity.currentWaypointIndex = (entity.currentWaypointIndex + 1) % entity.patrolWaypoints.length;
          } else {
            // Move towards current waypoint
            const normalizedX = dx / distance;
            const normalizedY = dy / distance;
            
            velocity.x = normalizedX * entity.patrolSpeed;
            velocity.y = normalizedY * entity.patrolSpeed;
          }
        });
      }
    );
    globalThis.patrolSystemCreated = true;
  }
}`,
  },
];

// Template retrieval functions
export function getTemplatesByCategory(
  category: ScriptTemplate["category"],
): ScriptTemplate[] {
  return [...COMPLETE_GAME_TEMPLATES, ...BEHAVIOR_TEMPLATES].filter(
    (template) => template.category === category,
  );
}

export function getTemplatesByTags(tags: string[]): ScriptTemplate[] {
  return [...COMPLETE_GAME_TEMPLATES, ...BEHAVIOR_TEMPLATES].filter(
    (template) => template.tags.some((tag) => tags.includes(tag)),
  );
}

export function getTemplateById(id: string): ScriptTemplate | null {
  return (
    [...COMPLETE_GAME_TEMPLATES, ...BEHAVIOR_TEMPLATES].find(
      (template) => template.id === id,
    ) || null
  );
}

export function getSystemTemplate(name: string): SystemTemplate | null {
  return SYSTEM_TEMPLATES.find((template) => template.name === name) || null;
}

export function getComponentTemplate(name: string): ComponentTemplate | null {
  return COMPONENT_TEMPLATES.find((template) => template.name === name) || null;
}

export function getAllTemplates(): ScriptTemplate[] {
  return [...COMPLETE_GAME_TEMPLATES, ...BEHAVIOR_TEMPLATES];
}

export function getAllSystemTemplates(): SystemTemplate[] {
  return [...SYSTEM_TEMPLATES];
}

export function getAllComponentTemplates(): ComponentTemplate[] {
  return [...COMPONENT_TEMPLATES];
}

// Template processing utilities
export function processTemplateParameters(
  template: string,
  parameters: Record<string, any>,
): string {
  let processed = template;

  for (const [key, value] of Object.entries(parameters)) {
    const placeholder = `{{${key}}}`;

    processed = processed.replace(new RegExp(placeholder, "g"), String(value));
  }

  return processed;
}

export function extractTemplateParameters(template: string): string[] {
  const matches = template.match(/\{\{([^}]+)\}\}/g);

  return matches ? matches.map((match) => match.slice(2, -2)) : [];
}

export default {
  COMPONENT_TEMPLATES,
  SYSTEM_TEMPLATES,
  COMPLETE_GAME_TEMPLATES,
  BEHAVIOR_TEMPLATES,
  getTemplatesByCategory,
  getTemplatesByTags,
  getTemplateById,
  getSystemTemplate,
  getComponentTemplate,
  getAllTemplates,
  getAllSystemTemplates,
  getAllComponentTemplates,
  processTemplateParameters,
  extractTemplateParameters,
};
