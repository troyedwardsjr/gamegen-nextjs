/**
 * Bullet Hell Game Script
 * A complete arcade-style bullet hell game implemented in JavaScript
 * Uses native ECS components for game state management
 */

console.log("[Bullet Hell] Starting initialization...");

// ===== COMPONENT REGISTRATION =====
// Register all the components and singletons we need for the bullet hell game

console.log("[Bullet Hell] Registering components...");

// Game state singleton components with simplified schemas
const BulletHellGameState = Toxoid.API.registerSingleton("BulletHellGameState", [
    { name: "score", type: "number" },
    { name: "frame_count", type: "number" }
]);

const BulletHellTimers = Toxoid.API.registerSingleton("BulletHellTimers", [
    { name: "enemy_spawn", type: "number" },
    { name: "player_shoot", type: "number" }
]);

const BulletHellAssetState = Toxoid.API.registerSingleton("BulletHellAssetState", [
    { name: "font_loaded", type: "boolean" },
    { name: "sprite_loaded", type: "boolean" }
]);

const BulletHellPlayerRef = Toxoid.API.registerSingleton("BulletHellPlayerRef", [
    { name: "player_entity_id", type: "entity" }
]);

const BulletHellScoreText = Toxoid.API.registerSingleton("BulletHellScoreText", [
    { name: "score_text_entity_id", type: "entity" }
]);

const BulletHellAudio = Toxoid.API.registerSingleton("BulletHellAudio", [
    { name: "music_entity_id", type: "entity" },
    { name: "volume", type: "f32" }
]);

// Relationship components (not singletons, just register) with simplified schemas
// Automatic alignment ensures proper 8-byte alignment for entity fields
Toxoid.registerComponent("HealthBarOwner", [
    { name: "owner_entity_id", type: "entity" },
    { name: "bg_entity_id", type: "entity" },
    { name: "fill_entity_id", type: "entity" }
]);

Toxoid.registerComponent("HealthTextOwner", [
    { name: "owner_entity_id", type: "entity" },
    { name: "text_entity_id", type: "entity" }
]);

// Bullet type tags (not singletons, just register) - these are tag components (no data)
Toxoid.registerComponent("PlayerBullet");
Toxoid.registerComponent("EnemyBullet");

console.log("[Bullet Hell] Components registered successfully!");

// ===== COLORS =====
const COLORS = {
    PLAYER: { r: 0.2, g: 0.5, b: 1.0, a: 1.0 },
    ENEMY: { r: 1.0, g: 0.2, b: 0.2, a: 1.0 },
    BULLET: { r: 1.0, g: 1.0, b: 0.0, a: 1.0 },
    HEALTH_BAR_BG: { r: 0.2, g: 0.2, b: 0.2, a: 0.8 },
    HEALTH_BAR_GREEN: { r: 0.2, g: 0.8, b: 0.2, a: 1.0 },
    HEALTH_BAR_YELLOW: { r: 0.8, g: 0.8, b: 0.2, a: 1.0 },
    HEALTH_BAR_RED: { r: 0.8, g: 0.2, b: 0.2, a: 1.0 }
}

// ===== GAME CONFIG =====
const CONFIG = {
    ENEMY_SPAWN_INTERVAL: 300,    // frames (5 seconds at 60fps) - increased for performance
    PLAYER_BULLET_SPAWN_INTERVAL: 60,  // frames (1 second at 60fps) - reduced from 0.5 seconds
    ENEMY_SPEED: 3.0,  // Increased from 1.5 to avoid f32->i32 precision loss in Velocity->Position system
    BULLET_SPEED: 6,
    ENEMY_DETECTION_RANGE: 9999, // Remove range limit - enemies always follow
    MAX_ENEMIES: 5,               // reduced from 8 for performance
    ENEMY_MAX_HEALTH: 100,
    HEALTH_BAR_WIDTH: 30,
    HEALTH_BAR_HEIGHT: 4,
    BULLET_DAMAGE: 50,            // increased from 25 - enemies die in 2 hits instead of 4
    COLLISION_DISTANCE: 15,       // collision detection distance
    // Animation offsets (matching Rust constants)
    ANIMATION_OFFSET_X: 46.0,     // matches ANIMATION_OFFSET_X in animations.rs
    ANIMATION_OFFSET_Y: 22.0      // matches ANIMATION_OFFSET_Y in animations.rs
}

// ===== HEALTH UI TRACKING =====
// Simple Maps to track health UI entities instead of complex component relationships
const healthTextMap = new Map(); // enemyId -> textEntityId
const healthBarBackgroundMap = new Map(); // enemyId -> backgroundEntityId  
const healthBarFillMap = new Map(); // enemyId -> fillEntityId

// Helper functions for health UI management
function setHealthText(enemyId, textEntityId) {
    healthTextMap.set(enemyId, textEntityId);
}

function getHealthText(enemyId) {
    return healthTextMap.get(enemyId);
}

function removeHealthText(enemyId) {
    const textId = healthTextMap.get(enemyId);
    if (textId) {
        Toxoid.API.removeEntity(textId);
        healthTextMap.delete(enemyId);
    }
}

function setHealthBar(enemyId, backgroundId, fillId) {
    healthBarBackgroundMap.set(enemyId, backgroundId);
    healthBarFillMap.set(enemyId, fillId);
}

function getHealthBarBackground(enemyId) {
    return healthBarBackgroundMap.get(enemyId);
}

function getHealthBarFill(enemyId) {
    return healthBarFillMap.get(enemyId);
}

function removeHealthBar(enemyId) {
    const backgroundId = healthBarBackgroundMap.get(enemyId);
    const fillId = healthBarFillMap.get(enemyId);
    
    if (backgroundId) {
        Toxoid.API.removeEntity(backgroundId);
        healthBarBackgroundMap.delete(enemyId);
    }
    
    if (fillId) {
        Toxoid.API.removeEntity(fillId);
        healthBarFillMap.delete(enemyId);
    }
}

function cleanupAllHealthUI(enemyId) {
    removeHealthText(enemyId);
    removeHealthBar(enemyId);
}

// ===== ECS SINGLETON ACCESSORS =====
// Helper functions to access ECS singleton components instead of gameState
function getGameState() {
    return BulletHellGameState;
}

function getTimers() {
    return BulletHellTimers;
}

function getAssetState() {
    return BulletHellAssetState;
}

function getPlayerRef() {
    return BulletHellPlayerRef;
}

function getScoreTextRef() {
    return BulletHellScoreText;
}

function getAudioRefs() {
    return BulletHellAudio;
}

// Initialize ECS singletons with default values
function initializeGameState() {
    const gameState = getGameState();
    if (gameState) {
        gameState.score = 0;
        gameState.frame_count = 0;
    }
    
    const timers = getTimers();
    if (timers) {
        timers.enemy_spawn = 0;
        timers.player_shoot = 0;
    }
    
    const assetState = getAssetState();
    if (assetState) {
        assetState.spine_loaded = false;
        assetState.audio_loaded = false;
        assetState.font_loaded = false;
    }
    
    const playerRef = getPlayerRef();
    if (playerRef) {
        playerRef.player_entity_id = 0;
    }
    
    const scoreTextRef = getScoreTextRef();
    if (scoreTextRef) {
        scoreTextRef.score_text_entity_id = 0;
    }
    
    const audioRefs = getAudioRefs();
    if (audioRefs) {
        audioRefs.axe_throw_sound_id = 0;
        audioRefs.background_music_id = 0;
    }
    
    console.log("[BulletHell] ECS singletons initialized");
}

// ===== HEALTH BAR HELPERS =====
function createHealthBar(x, y) {
    // Calculate healthbar position relative to character sprite center using animation offsets
    const healthBarX = x + CONFIG.ANIMATION_OFFSET_X + CONFIG.HEALTH_BAR_WIDTH / 2;
    const healthBarY = y + CONFIG.ANIMATION_OFFSET_Y + CONFIG.HEALTH_BAR_HEIGHT - 5; // 5px above the character
    
    // Create background bar (gray)
    const bgId = Toxoid.API.filledRect(healthBarX, healthBarY, CONFIG.HEALTH_BAR_WIDTH, CONFIG.HEALTH_BAR_HEIGHT, COLORS.HEALTH_BAR_BG);
    const bg = Toxoid.API.getEntity(bgId);
    
    // Create health fill bar (starts green)
    const fillId = Toxoid.API.filledRect(healthBarX, healthBarY, CONFIG.HEALTH_BAR_WIDTH, CONFIG.HEALTH_BAR_HEIGHT, COLORS.HEALTH_BAR_GREEN);
    const fill = Toxoid.API.getEntity(fillId);
    
    // Add Size component to both for proper resizing
    if (bg && fill) {
        bg.add("Size");
        fill.add("Size");
        
        const bgSize = bg.getComponent("Size");
        const fillSize = fill.getComponent("Size");
        
        if (bgSize && fillSize) {
            bgSize.width = CONFIG.HEALTH_BAR_WIDTH;
            bgSize.height = CONFIG.HEALTH_BAR_HEIGHT;
            fillSize.width = CONFIG.HEALTH_BAR_WIDTH;
            fillSize.height = CONFIG.HEALTH_BAR_HEIGHT;
        }
    }
    
    return { bg: bgId, fill: fillId };
}

// ===== HEALTH TEXT HELPERS =====
function createHealthText(x, y, currentHealth, maxHealth) {
    const assetState = getAssetState();
    if (!assetState || !assetState.font_loaded) return null;
    
    // Calculate text position above the character (above health bar)
    // Position for top-left corner of text to appear centered above enemy
    const textX = x + CONFIG.ANIMATION_OFFSET_X - 15; // Offset left to center text roughly
    const textY = y + CONFIG.ANIMATION_OFFSET_Y - 30; // 30px above character for better visibility
    
    const healthString = `${currentHealth}/${maxHealth}`;
    const textEntity = Toxoid.API.createFontText("assets/Montserrat-Regular.ttf", healthString);
    
    if (textEntity) {
        // Set position
        const pos = textEntity.getComponent("Position");
        if (pos) {
            pos.x = textX;
            pos.y = textY;
        }
        
        // Set ZDepth to render above player and enemies but still in world-space
        const zDepth = textEntity.getComponent("ZDepth");
        if (zDepth) {
            // Set to AbovePlayer layer (4) for world-space rendering above game elements
            zDepth.layer_depth = 4; // AbovePlayer layer - renders above sprites but transforms with camera
            zDepth.row_depth = 1;   // Standard row depth
            zDepth.depth = 1;       // Standard depth
        }
        
        // Keep default alignment (left-top) for precise positioning
        // Health text will be positioned exactly above enemies
        
        // Make sure it's renderable (don't add UIFont - we want world space)
        textEntity.add("Renderable");
        
        // console.log(`[BulletHell] Health text created: ${textEntity.id} with text "${healthString}" at ${textX}, ${textY}`);
    }
    
    return textEntity ? textEntity.id : null;
}

function updateHealthText(textId, enemyPos, currentHealth, maxHealth) {
    if (!textId || !enemyPos) {
        return;
    }
    
    const textEntity = Toxoid.API.getEntity(textId);
    if (!textEntity) {
        return;
    }
    
    // Update position above enemy - position text directly above the character
    const pos = textEntity.getComponent("Position");
    if (pos) {
        // Position text above the character sprite (top-left corner of text)
        const newX = enemyPos.x + CONFIG.ANIMATION_OFFSET_X - 15; // Offset left to center text roughly
        const newY = enemyPos.y + CONFIG.ANIMATION_OFFSET_Y - 30; // 30px above character for better visibility
        
        pos.x = newX;
        pos.y = newY;
    }
    
    // Update text content - direct modification approach (no entity recreation)
    const healthString = `${currentHealth}/${maxHealth}`;
    const fontText = textEntity.getComponent("FontText");
    if (fontText) {
        // Direct modification - this should work and avoids expensive entity recreation
        fontText.text = healthString;
        // Note: No need to verify - trust the component system to handle the update
    }
}

// PERFORMANCE FIX: Use direct text modification instead of entity recreation
function updateHealthTextContent(enemyId, enemyPos, currentHealth, maxHealth) {
    const textId = getHealthText(enemyId);
    if (textId) {
        // Use direct modification instead of recreating the entity
        updateHealthText(textId, enemyPos, currentHealth, maxHealth);
    } else {
        // Only create new text if it doesn't exist
        const newTextId = createHealthText(enemyPos.x, enemyPos.y, currentHealth, maxHealth);
        if (newTextId) {
            setHealthText(enemyId, newTextId);
        }
    }
}

function cleanupHealthText(enemyId) {
    try {
        // Simple cleanup using the Map
        removeHealthText(enemyId);
    } catch (e) {
        console.error("[BulletHell] Error in cleanupHealthText:", e);
    }
}

// ===== SCORE HELPERS =====
function createScoreText() {
    const assetState = getAssetState();
    if (!assetState || !assetState.font_loaded) return null;
    
    const scoreEntity = Toxoid.API.createFontText("assets/Montserrat-Regular.ttf", "Score: 0");
    
    if (scoreEntity) {
        // Position in top right corner
        const pos = scoreEntity.getComponent("Position");
        if (pos) {
            pos.x = 650; // Right side of screen
            pos.y = 30;  // Top of screen
        }
        
        // Set text alignment for top-right positioning
        const fontText = scoreEntity.getComponent("FontText");
        if (fontText) {
            fontText.halign = 2; // Right horizontal alignment
            fontText.valign = 0; // Top vertical alignment
        }
        
        // Make sure it's renderable and mark as UI text (screen space)
        scoreEntity.add("Renderable");
        scoreEntity.add("UIFont");
        
        // console.log("[BulletHell] Score text created:", scoreEntity.id);
    }
    
    return scoreEntity;
}

function updateScoreText() {
    const gameState = getGameState();
    const scoreTextRef = getScoreTextRef();
    if (!gameState || !scoreTextRef) return;
    
    // PERFORMANCE FIX: Try to update existing score text instead of recreating
    if (scoreTextRef.score_text_entity_id) {
        const scoreEntity = Toxoid.API.getEntity(scoreTextRef.score_text_entity_id);
        if (scoreEntity) {
            const fontText = scoreEntity.getComponent("FontText");
            if (fontText) {
                // Direct modification - no entity recreation needed
                fontText.text = `Score: ${gameState.score}`;
                return; // Successfully updated existing text
            }
        }
    }
    
    // Only recreate if the existing entity is missing or invalid
    const newScoreText = createScoreTextWithScore(gameState.score);
    if (newScoreText) {
        scoreTextRef.score_text_entity_id = newScoreText.id;
    }
}

function createScoreTextWithScore(score) {
    const assetState = getAssetState();
    if (!assetState || !assetState.font_loaded) return null;
    
    const scoreEntity = Toxoid.API.createFontText("assets/Montserrat-Regular.ttf", `Score: ${score}`);
    
    if (scoreEntity) {
        // Position in top right corner
        const pos = scoreEntity.getComponent("Position");
        if (pos) {
            pos.x = 650; // Right side of screen
            pos.y = 30;  // Top of screen
        }
        
        // Set text alignment for top-right positioning
        const fontText = scoreEntity.getComponent("FontText");
        if (fontText) {
            fontText.halign = 2; // Right horizontal alignment
            fontText.valign = 0; // Top vertical alignment
        }
        
        // Make sure it's renderable and mark as UI text (screen space)
        scoreEntity.add("Renderable");
        scoreEntity.add("UIFont");
        
        // console.log("[BulletHell] Score text created with value:", `Score: ${score}`);
    }
    
    return scoreEntity;
}

function updateHealthBar(enemyId, enemyPos, currentHealth, maxHealth) {
    try {
        if (!enemyPos) return;
        
        const backgroundId = getHealthBarBackground(enemyId);
        const fillId = getHealthBarFill(enemyId);
        
        if (!backgroundId || !fillId) return;
        
        const bg = Toxoid.API.getEntity(backgroundId);
        const fill = Toxoid.API.getEntity(fillId);
        
        if (!bg || !fill) return;
        
        // Update positions (health bar floats above enemy) using animation offsets
        const bgPos = bg.getComponent("Position");
        const fillPos = fill.getComponent("Position");
        
        if (bgPos && fillPos) {
            // Calculate healthbar position relative to character sprite center using animation offsets
            const healthBarX = enemyPos.x + CONFIG.ANIMATION_OFFSET_X - CONFIG.HEALTH_BAR_WIDTH / 2;
            const healthBarY = enemyPos.y + CONFIG.ANIMATION_OFFSET_Y - CONFIG.HEALTH_BAR_HEIGHT - 5; // 5px above the character
            
            bgPos.x = healthBarX;
            bgPos.y = healthBarY;
            fillPos.x = healthBarX;
            fillPos.y = healthBarY;
            
            // // Debug log every 60 frames
            // if (Math.random() < 0.01) {
            //     console.log(`[BulletHell] Health bar ${enemyId} position updated to (${healthBarX.toFixed(1)}, ${healthBarY.toFixed(1)}) for enemy at (${enemyPos.x.toFixed(1)}, ${enemyPos.y.toFixed(1)})`);
            // }
        }
        
        // Update health bar width based on health percentage
        const healthPercent = Math.max(0, Math.min(1, currentHealth / maxHealth));
        const fillWidth = Math.floor(CONFIG.HEALTH_BAR_WIDTH * healthPercent);
        
        const fillSize = fill.getComponent("Size");
        if (fillSize) {
            fillSize.width = fillWidth;
        }
        
        // Update color based on health percentage
        const fillColor = fill.getComponent("Color");
        if (fillColor) {
            if (healthPercent > 0.6) {
                // Green
                fillColor.r = COLORS.HEALTH_BAR_GREEN.r;
                fillColor.g = COLORS.HEALTH_BAR_GREEN.g;
                fillColor.b = COLORS.HEALTH_BAR_GREEN.b;
            } else if (healthPercent > 0.3) {
                // Yellow
                fillColor.r = COLORS.HEALTH_BAR_YELLOW.r;
                fillColor.g = COLORS.HEALTH_BAR_YELLOW.g;
                fillColor.b = COLORS.HEALTH_BAR_YELLOW.b;
            } else {
                // Red
                fillColor.r = COLORS.HEALTH_BAR_RED.r;
                fillColor.g = COLORS.HEALTH_BAR_RED.g;
                fillColor.b = COLORS.HEALTH_BAR_RED.b;
            }
        }
    } catch (e) {
        console.error("[BulletHell] Error in updateHealthBar:", e);
    }
}

function cleanupHealthBar(enemyId) {
    try {
        // Simple cleanup using Maps
        cleanupAllHealthUI(enemyId);
    } catch (e) {
        console.error("[BulletHell] Error in cleanupHealthBar:", e);
    }
}

// ===== SPINE CHARACTER HELPERS =====
function createPlayerCharacter(x, y) {
    // console.log("[BulletHell] Creating Spine player character...");
    
    // Create the character from prefab
    const character = Toxoid.API.createSpineAnimation(
        "assets/animations/fighter/character.atlas",
        "assets/animations/character/character.json",
        "fighter"
    );
    
    if (!character) {
        console.error("[BulletHell] Failed to create player character");
        return null;
    }
    
    // console.log("[BulletHell] ✓ Player character created:", character.id);
    
    // Add bullet hell player tag
    character.add('BulletHellPlayer');
    character.add("Direction");
    character.add("MovementState");
    character.add("AnimationState");
    character.add("AttackState");
    character.add("CombatAnimationState");
    
    // Set position
    const pos = character.getComponent("Position");
    if (pos) {
        pos.x = x;
        pos.y = y;
    }
    
    // Set initial animation state using proper component field access
    const animState = character.getComponent("AnimationState");
    if (animState) {
        animState.current_animation = "idle_down";
        animState.last_valid_direction = 2; // Down
    }
    
    const direction = character.getComponent("Direction");
    if (direction) {
        direction.direction = 2; // Down
    }
    
    const movementState = character.getComponent("MovementState");
    if (movementState) {
        movementState.is_moving = false;
    }
    
    const attackState = character.getComponent("AttackState");
    if (attackState) {
        attackState.is_attacking = false;
        attackState.attack_start_time = 0;
    }
    
    const combatAnimState = character.getComponent("CombatAnimationState");
    if (combatAnimState) {
        combatAnimState.is_hurt = false;
        combatAnimState.is_dying = false;
        combatAnimState.hurt_direction = 2;
        combatAnimState.hurt_start_time = 0;
    }
    
    return character;
}

function createEnemyCharacter(x, y) {
    // console.log("[BulletHell] Creating Spine enemy character...");
    
    // Create the character from prefab (using character animation but will tint it red for enemies)
    const character = Toxoid.API.createSpineAnimation(
        "assets/animations/priestess/character.atlas",
        "assets/animations/character/character.json",
        "priestess"
    );
    
    if (!character) {
        console.error("[BulletHell] Failed to create enemy character");
        return null;
    }
    
    // console.log("[BulletHell] ✓ Enemy character created:", character.id);
    
    // Add enemy tag
    character.add('Enemy');
    character.add('Velocity');
    character.add('Health');
    character.add('BulletHellEnemy');
    character.add("Direction");
    character.add("MovementState");
    character.add("AnimationState");
    character.add("AttackState");
    character.add("CombatAnimationState");
    
    // Set position
    const pos = character.getComponent("Position");
    if (pos) {
        pos.x = x;
        pos.y = y;
    }
    
    // Set initial health
    const health = character.getComponent("Health");
    if (health) {
        health.current_health = CONFIG.ENEMY_MAX_HEALTH;
        health.max_health = CONFIG.ENEMY_MAX_HEALTH;
    }
    
    // Set initial animation state using proper component field access
    const animState = character.getComponent("AnimationState");
    if (animState) {
        animState.current_animation = "idle_down";
        animState.last_valid_direction = 2; // Down
    }
    
    const direction = character.getComponent("Direction");
    if (direction) {
        direction.direction = 2; // Down
    }
    
    const movementState = character.getComponent("MovementState");
    if (movementState) {
        movementState.is_moving = false;
    }
    
    // const attackState = character.getComponent("AttackState");
    // if (attackState) {
    //     attackState.is_attacking = false;
    //     attackState.attack_start_time = 0;
    // }
    
    const combatAnimState = character.getComponent("CombatAnimationState");
    if (combatAnimState) {
        combatAnimState.is_hurt = false;
        combatAnimState.is_dying = false;
        combatAnimState.hurt_direction = 2;
        combatAnimState.hurt_start_time = 0;
    }
    
    return character;
}

// ===== PLAYER SYSTEM =====
function playerSystem(iter) {
    try {
    const kb = Toxoid.API.getSingleton("KeyboardInput");
    if (!kb) return;
    
    iter.entities().forEach((entity) => {
        const pos = entity.getComponent("Position");
        if (!pos) return;
        
        // Store reference to player character in ECS singleton
        const playerRef = getPlayerRef();
        if (playerRef && !playerRef.player_entity_id) {
            playerRef.player_entity_id = entity.id;
        }
        
        let newX = pos.x;
        let newY = pos.y;
        let moved = false;
        let direction = 2; // Down (default) - DirectionEnum::Down = 2
        
        if (kb.up) { 
            newY -= 4; 
            moved = true;
            direction = 1; // Up - DirectionEnum::Up = 1
        } else if (kb.down) { 
            newY += 4; 
            moved = true;
            direction = 2; // Down - DirectionEnum::Down = 2
        } else if (kb.left) { 
            newX -= 4; 
            moved = true;
            direction = 3; // Left - DirectionEnum::Left = 3
        } else if (kb.right) { 
            newX += 4; 
            moved = true;
            direction = 4; // Right - DirectionEnum::Right = 4
        }
        
        // Keep player within bounds
        pos.x = Math.max(12, Math.min(788, newX));
        pos.y = Math.max(12, Math.min(588, newY));
        
        // Update animation components if entity has them
        try {
            if (entity.has("MovementState")) {
                const movementState = entity.getComponent("MovementState");
                if (movementState) {
                    movementState.is_moving = moved;
                }
            }
            
            if (entity.has("Direction") && moved) {
                const directionComp = entity.getComponent("Direction");
                if (directionComp) {
                    directionComp.direction = direction;
                }
            }
            
            // Update animation state for proper idle/walk animations
            if (entity.has("AnimationState")) {
                const animState = entity.getComponent("AnimationState");
                if (animState) {
                    let anim = "idle_down";
                    
                    if (moved) {
                        switch(direction) {
                            case 1: anim = "walk_up"; break;    // DirectionEnum::Up = 1
                            case 2: anim = "walk_down"; break;  // DirectionEnum::Down = 2
                            case 3: anim = "walk_left"; break;  // DirectionEnum::Left = 3
                            case 4: anim = "walk_right"; break; // DirectionEnum::Right = 4
                        }
                    } else {
                        // Use idle animation for last direction
                        const lastDir = animState.last_valid_direction || 2;
                        switch(lastDir) {
                            case 1: anim = "idle_up"; break;    // DirectionEnum::Up = 1
                            case 2: anim = "idle_down"; break;  // DirectionEnum::Down = 2
                            case 3: anim = "idle_left"; break;  // DirectionEnum::Left = 3
                            case 4: anim = "idle_right"; break; // DirectionEnum::Right = 4
                        }
                    }
                    
                    // Only update if animation changed
                    if (animState.current_animation !== anim) {
                        animState.current_animation = anim;
                        animState.last_valid_direction = moved ? direction : (animState.last_valid_direction || 2);
                    }
                }
            }
        } catch (e) {
            // Skip animation updates if components aren't available
        }
    });
    } catch (error) {
        console.error("[BulletHell] Error in playerSystem:", error);
    }
}

// ===== PLAYER AUTO-ATTACK SYSTEM =====
function playerAutoAttackSystem(iter) {
    try {
        // Don't run if Spine isn't loaded yet
        const assetState = getAssetState();
        const playerRef = getPlayerRef();
        
        if (!assetState || !assetState.spine_loaded || !playerRef || !playerRef.player_entity_id) {
            return;
        }
        
        const timers = getTimers();
        if (!timers) return;
        
        timers.player_shoot++;
        
        if (timers.player_shoot >= CONFIG.PLAYER_BULLET_SPAWN_INTERVAL) {
        // Find player position
        const playerQuery = iter.world().query("BulletHellPlayer, Position");
        let playerPos = null;
        
        playerQuery.entities().forEach((player) => {
            playerPos = player.getComponent("Position");
        });
        
        if (!playerPos) return;
        
        // Find nearest enemy to shoot at
        const enemyQuery = iter.world().query("BulletHellEnemy, Position");
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        
        enemyQuery.entities().forEach((enemy) => {
                const enemyPos = enemy.getComponent("Position");
            if (!enemyPos) return;
            
            const dx = enemyPos.x - playerPos.x;
            const dy = enemyPos.y - playerPos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = { pos: enemyPos, distance: distance };
            }
        });
        
        // Shoot bullet at nearest enemy if one exists
        if (nearestEnemy) {
            // // Trigger attack animation on player
            // playerQuery.entities().forEach((player) => {
            //     if (player.has("AttackState")) {
            //         const attackState = player.getComponent("AttackState");
            //         if (attackState) {
            //             console.log("[BulletHell] Player attack animation triggered");
            //             attackState.is_attacking = true;
            //             attackState.attack_start_time = Date.now();
            //             console.log("[BulletHell] Player attack animation triggered");
            //         }
                    
            //         // Set attack direction based on target (using DirectionEnum values)
            //         if (player.has("Direction")) {
            //             const dx = nearestEnemy.pos.x - playerPos.x;
            //             const dy = nearestEnemy.pos.y - playerPos.y;
            //             let attackDirection = 2; // Down default (DirectionEnum::Down = 2)
                        
            //             if (Math.abs(dx) > Math.abs(dy)) {
            //                 attackDirection = dx > 0 ? 4 : 3; // Right (4) or Left (3)
            //             } else {
            //                 attackDirection = dy > 0 ? 2 : 1; // Down (2) or Up (1)
            //             }
                        
            //             const directionComp = player.getComponent("Direction");
            //             if (directionComp) {
            //                 directionComp.direction = attackDirection;
            //             }
            //         }
            //     }
            // });
            
            const bullet = Toxoid.API.createSprite("assets/sprites/axe.png");
            
            // Play axe throw sound effect
            const assetState = getAssetState();
            if (assetState && assetState.audio_loaded) {
                try {
                    // console.log("[BulletHell] Attempting to play axe throw sound...");
                    const soundInstance = Toxoid.API.createSound("assets/audio/axe_throw.ogg");
                    if (soundInstance) {
                        // console.log("[BulletHell] ♪ Axe throw sound instance created:", soundInstance.id);
                        
                        // Sound instances are now automatically activated in the host ECS
                        // console.log("[BulletHell] ♪ Axe throw sound effect played (auto-activated)");
                    } else {
                        console.warn("[BulletHell] Failed to create axe throw sound instance");
                    }
                } catch (error) {
                    console.error("[BulletHell] Error playing axe throw sound:", error);
                }
            } else {
                console.log("[BulletHell] Audio not loaded yet, skipping sound effect");
            }
            
            if (bullet) {
                // Explicitly add Position component to ensure it's modifiable
                bullet.add("Position");
                
                // Set bullet position
                const bulletPos = bullet.getComponent("Position");
                if (bulletPos) {
                    bulletPos.x = playerPos.x;
                    bulletPos.y = playerPos.y;
                } else {
                    console.error("[BulletHell] Failed to get bullet Position component");
                }
                
                bullet.add("Bullet");  // Use standard Bullet component
                bullet.add("Velocity");
                
                // Set bullet velocity toward nearest enemy
                const velocity = bullet.getComponent("Velocity");
                if (velocity && nearestEnemy.distance > 1) {
                    const dx = nearestEnemy.pos.x - playerPos.x;
                    const dy = nearestEnemy.pos.y - playerPos.y;
                    const normalizedX = dx / nearestEnemy.distance;
                    const normalizedY = dy / nearestEnemy.distance;
                    velocity.x = normalizedX * CONFIG.BULLET_SPEED;
                    velocity.y = normalizedY * CONFIG.BULLET_SPEED;
                }
            }
        }
        
        timers.player_shoot = 0;
        }
    } catch (error) {
        console.error("[BulletHell] Error in playerAutoAttackSystem:", error);
    }
}

// ===== ATTACK STATE MANAGEMENT SYSTEM =====
function attackStateSystem(iter) {
    const currentTime = Date.now();
    iter.entities().forEach((entity) => {
        if (entity.has("AttackState")) {
            const attackState = entity.getComponent("AttackState");
            if (attackState && attackState.is_attacking) {
                // Reset attack state after 300ms
                if (currentTime - attackState.attack_start_time >= 300) {
                    attackState.is_attacking = false;
                    attackState.attack_start_time = 0;
                }
            }
        }
    });
}

// ===== ENEMY SPAWNING SYSTEM =====
function enemySpawnSystem(iter) {
    const timers = getTimers();
    if (!timers) return;
    
    timers.enemy_spawn++;
    
    // Count current enemies
    let enemyCount = 0;
    iter.entities().forEach(() => enemyCount++);
    
    if (timers.enemy_spawn >= CONFIG.ENEMY_SPAWN_INTERVAL && enemyCount < CONFIG.MAX_ENEMIES) {
        spawnEnemy();
        timers.enemy_spawn = 0;
    }
}

function spawnEnemy() {
    // Spawn on random edge
    const side = Math.floor(Math.random() * 4);
    let x = 400, y = 300;
    
    switch(side) {
        case 0: x = Math.random() * 800; y = -20; break;      // top
        case 1: x = 820; y = Math.random() * 600; break;      // right
        case 2: x = Math.random() * 800; y = 620; break;      // bottom
        case 3: x = -20; y = Math.random() * 600; break;      // left
    }
    
    // Create Spine enemy character
    const enemy = createEnemyCharacter(x, y);
    
    if (enemy) {
        const enemyId = enemy.id;
        
        // Create health bar for this enemy and link with relationship component
        // Create health bar using simple Map tracking
        const healthBar = createHealthBar(x, y);
        if (healthBar) {
            setHealthBar(enemyId, healthBar.bg, healthBar.fill);
        }
        
        // Create health text using simple Map tracking
        const healthTextId = createHealthText(x, y, CONFIG.ENEMY_MAX_HEALTH, CONFIG.ENEMY_MAX_HEALTH);
        if (healthTextId) {
            setHealthText(enemyId, healthTextId);
        }
        
        // console.log("[BulletHell] ✓ Enemy spawned with Spine animation and health bar:", enemyId);
    }
}

// ===== ENEMY AI SYSTEM =====
function enemyAISystem(iter) {
    try {
        // Find player using proper world query
        const playerQuery = iter.world().query("BulletHellPlayer, Position");
        let playerPos = null;
        
        playerQuery.entities().forEach((player) => {
            playerPos = player.getComponent("Position");
        });
        
        if (!playerPos) return;
        
        // Set velocity for enemies to move toward player (host handles Position updates)
        iter.entities().forEach((enemy) => {
            // FIX: Check if entity is valid before accessing components to prevent null errors
            if (!enemy || !enemy.id) return;
            
            const enemyPos = enemy.getComponent("Position");
            const velocity = enemy.getComponent("Velocity");
            const health = enemy.getComponent("Health");
            
            // FIX: Ensure all required components exist and are valid
            if (!enemyPos || !velocity) return;
            
            // FIX: Check if health component exists and has valid data to prevent null f64 conversion
            if (!health || typeof health.current_health !== 'number' || health.current_health <= 0) {
                // Enemy is dead or has invalid health, skip processing
                return;
            }
        
        // Calculate distance to player
        const dx = playerPos.x - enemyPos.x;
        const dy = playerPos.y - enemyPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Always follow player (removed range check), but not too close
        const isMoving = distance > 5;
        if (isMoving) {
            // Normalize direction and apply speed
            const normalizedX = dx / distance;
            const normalizedY = dy / distance;
            
            // Set velocity - host physics system will handle position updates
            velocity.x = normalizedX * CONFIG.ENEMY_SPEED;
            velocity.y = normalizedY * CONFIG.ENEMY_SPEED;
            
            // // Debug log velocity updates every 60 frames
            // if (Math.random() < 0.01) {
            //     console.log(`[BulletHell] Enemy ${enemy.id} velocity set: (${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)}) toward player at (${playerPos.x.toFixed(1)}, ${playerPos.y.toFixed(1)})`);
            //     console.log(`[BulletHell] Enemy ${enemy.id} current position: (${enemyPos.x.toFixed(1)}, ${enemyPos.y.toFixed(1)})`);
            // }
            
            // Set movement direction for animation (using DirectionEnum values)
            if (enemy.has("Direction")) {
                let moveDirection = 2; // Down default (DirectionEnum::Down = 2)
                
                if (Math.abs(dx) > Math.abs(dy)) {
                    moveDirection = dx > 0 ? 4 : 3; // Right (4) or Left (3)
                } else {
                    moveDirection = dy > 0 ? 2 : 1; // Down (2) or Up (1)
                }
                
                const directionComp = enemy.getComponent("Direction");
                if (directionComp) {
                    directionComp.direction = moveDirection;
                }
            }
        } else {
            // Stop moving when too close to player
            velocity.x = 0;
            velocity.y = 0;
        }
        
        // Update movement state for animations
        try {
            if (enemy.has("MovementState")) {
                const movementState = enemy.getComponent("MovementState");
                if (movementState) {
                    movementState.is_moving = isMoving;
                }
            }
            
            // Update animation based on movement
            if (enemy.has("AnimationState")) {
                const animState = enemy.getComponent("AnimationState");
                if (animState) {
                    let anim = "idle_down";
                    
                    if (isMoving) {
                        const directionComp = enemy.getComponent("Direction");
                        const direction = directionComp ? directionComp.direction : 1;
                        switch(direction) {
                            case 1: anim = "walk_up"; break;    // DirectionEnum::Up = 1
                            case 2: anim = "walk_down"; break;  // DirectionEnum::Down = 2
                            case 3: anim = "walk_left"; break;  // DirectionEnum::Left = 3
                            case 4: anim = "walk_right"; break; // DirectionEnum::Right = 4
                        }
                    } else {
                        // Use idle animation for last direction
                        const lastDir = animState.last_valid_direction || 2;
                        switch(lastDir) {
                            case 1: anim = "idle_up"; break;    // DirectionEnum::Up = 1
                            case 2: anim = "idle_down"; break;  // DirectionEnum::Down = 2
                            case 3: anim = "idle_left"; break;  // DirectionEnum::Left = 3
                            case 4: anim = "idle_right"; break; // DirectionEnum::Right = 4
                        }
                    }
                    
                    // Only update if animation changed
                    if (animState.current_animation !== anim) {
                        animState.current_animation = anim;
                        const directionComp = enemy.getComponent("Direction");
                        animState.last_valid_direction = isMoving ? (directionComp ? directionComp.direction : 2) : (animState.last_valid_direction || 2);
                    }
                }
            }
        } catch (e) {
            // Skip animation updates if components aren't available
        }
        
        // Update health bar position and appearance using ECS relationship components
        if (health) {
            const enemyId = enemy.id;
            updateHealthBar(enemyId, enemyPos, health.current_health, health.max_health);
            
            // PERFORMANCE FIX: Update health text position and content using direct modification
            const textId = getHealthText(enemyId);
            if (textId) {
                try {
                    updateHealthText(textId, enemyPos, health.current_health, health.max_health);
                } catch (e) {
                    console.error("[BulletHell] Error updating health text:", e);
                    // Remove the problematic text entity to prevent further errors
                    removeHealthText(enemyId);
                }
            }
        }
    });
    } catch (error) {
        console.error("[BulletHell] Error in enemyAISystem:", error);
    }
}

// ===== BULLET COLLISION SYSTEM =====
function bulletCollisionSystem(iter) {
    // Check collisions between bullets and enemies
    const bulletQuery = iter.world().query("Bullet, Position");
    const enemyQuery = iter.world().query("BulletHellEnemy, Position, Health");
    
    // PERFORMANCE FIX: Cache enemy list to avoid repeated queries
    const enemies = Array.from(enemyQuery.entities());
    const bulletsToRemove = [];
    
    bulletQuery.entities().forEach((bullet) => {
        const bulletPos = bullet.getComponent("Position");
        if (!bulletPos) return;
        
        const bulletId = bullet.id;
        let bulletHit = false;
        
        // PERFORMANCE FIX: Use for loop with early termination instead of forEach
        for (let i = 0; i < enemies.length && !bulletHit; i++) {
            const enemy = enemies[i];
            const enemyPos = enemy.getComponent("Position");
            const enemyHealth = enemy.getComponent("Health");
            if (!enemyPos || !enemyHealth) continue;
            
            // Calculate distance between bullet and enemy
            const dx = bulletPos.x - enemyPos.x;
            const dy = bulletPos.y - enemyPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check collision
            if (distance < CONFIG.COLLISION_DISTANCE) {
                // Damage enemy
                enemyHealth.current_health -= CONFIG.BULLET_DAMAGE;
                if (enemyHealth.current_health < 0) {
                    enemyHealth.current_health = 0;
                }
                
                // PERFORMANCE FIX: Use direct text modification instead of recreation
                const enemyId = enemy.id;
                updateHealthTextContent(enemyId, enemyPos, enemyHealth.current_health, enemyHealth.max_health);
                
                // Update health bar immediately when enemy takes damage using ECS relationship components
                updateHealthBar(enemyId, enemyPos, enemyHealth.current_health, enemyHealth.max_health);
                
                // Trigger hurt animation
                try {
                    if (enemy.has("CombatAnimationState")) {
                        // Determine hit direction based on bullet trajectory
                        const bulletVel = bullet.getComponent("Velocity");
                        let hurtDirection = 2; // Down default
                        
                        if (bulletVel) {
                            if (Math.abs(bulletVel.x) > Math.abs(bulletVel.y)) {
                                hurtDirection = bulletVel.x > 0 ? 4 : 3; // Right or Left
                            } else {
                                hurtDirection = bulletVel.y > 0 ? 2 : 1; // Down or Up
                            }
                        }
                        
                        const combatAnimState = enemy.getComponent("CombatAnimationState");
                        if (combatAnimState) {
                            combatAnimState.is_hurt = true;
                            combatAnimState.is_dying = enemyHealth.current_health <= 0;
                            combatAnimState.hurt_direction = hurtDirection;
                            combatAnimState.hurt_start_time = Date.now();
                        }
                    }
                } catch (e) {
                    // Skip hurt animation if components aren't available
                }
                
                // Mark bullet for removal and stop checking other enemies
                bulletsToRemove.push(bulletId);
                bulletHit = true; // PERFORMANCE FIX: Early termination - one bullet can only hit one enemy
            }
        }
    });
    
    // Remove bullets that hit enemies
    bulletsToRemove.forEach(bulletId => {
        Toxoid.API.removeEntity(bulletId);
    });
}



// ===== BULLET CLEANUP SYSTEM =====
function bulletCleanupSystem(iter) {
    // Only handle cleanup - host physics system handles movement via Velocity->Position
    iter.entities().forEach((bullet) => {
        const pos = bullet.getComponent("Position");
        if (!pos) return;
        
        // Remove if off-screen (host handles position updates automatically)
        if (pos.x < -50 || pos.x > 850 || pos.y < -50 || pos.y > 650) {
            Toxoid.API.removeEntity(bullet.id);
        }
    });
}

// ===== ENEMY HEALTH SYSTEM =====
function enemyHealthSystem(iter) {
    try {
        const enemiesToRemove = [];
        
        iter.entities().forEach((enemy) => {
            // FIX: Check if entity is valid before accessing components
            if (!enemy || !enemy.id) return;
            
            const health = enemy.getComponent("Health");
            
            // FIX: Ensure health component exists and has valid data to prevent null f64 conversion
            if (!health || typeof health.current_health !== 'number') return;
        
        // Check if enemy is dead
        if (health.current_health <= 0) {
            const enemyId = enemy.id;
            enemiesToRemove.push(enemyId);
            
            // Increment score using ECS singleton
            const gameState = getGameState();
            if (gameState) {
                gameState.score++;
                updateScoreText();
            }
            
            // Cleanup health bar and text using ECS relationship components
            cleanupHealthBar(enemyId);
            
            // Remove enemy entity
            Toxoid.API.removeEntity(enemyId);
        }
    });
    
        // Log enemy deaths for feedback
        if (enemiesToRemove.length > 0) {
            const gameState = getGameState();
            const score = gameState ? gameState.score : 0;
            // console.log(`[BulletHell] ${enemiesToRemove.length} enemies destroyed! Score: ${score}`);
        }
    } catch (error) {
        console.error("[BulletHell] Error in enemyHealthSystem:", error);
    }
}

const init = () => {
    // console.log("[BulletHell] Initializing Bullet Hell game...");
    
    // Initialize ECS singletons with default values
    initializeGameState();
    
    // Note: All components (BulletHellPlayer, BulletHellEnemy, Bullet, Velocity) are already registered on the host
    // No need to create them here - they exist with proper schemas
    
    // Load audio assets first
    // console.log("[BulletHell] Loading audio assets...");
    
    // Load sound effects using loadSound for proper prefab creation
    try {
        // console.log("[BulletHell] Loading axe throw sound effect...");
        // Load axe throw sound effect (not looping, not active by default, volume 0.3)
        Toxoid.API.loadSound("assets/audio/axe_throw.ogg", false, false, 0.3, function(audioEntity) {
            console.log("[BulletHell] ✓ Axe throw sound loaded successfully:", audioEntity ? audioEntity.id : "null");
            
            // Store audio reference in ECS singleton
            const audioRefs = getAudioRefs();
            if (audioRefs && audioEntity) {
                audioRefs.axe_throw_sound_id = audioEntity.id;
            }

            // Now load visual assets
            loadVisualAssets();
            
            // Mark audio as loaded in ECS singleton
            const assetState = getAssetState();
            if (assetState) {
                assetState.audio_loaded = true;
            }
            
            // Disable music because it's annoying during testing
            // console.log("[BulletHell] Loading background music...");
            // // Load background music (looping, active immediately, volume 0.3) - using sample.ogg temporarily since music.ogg has format issues
            // Toxoid.API.loadSound("assets/audio/music_short.ogg", true, true, 0.3, function(musicEntity) {
            //     console.log("[BulletHell] ✓ Background music loaded and playing:", musicEntity ? musicEntity.id : "null");
            //     gameState.backgroundMusic = musicEntity;
            //     // gameState.audioLoaded = true;
                
            //     console.log("[BulletHell] Audio loading complete, proceeding to visual assets...");
            //     // Now load visual assets
            //     loadVisualAssets();
            // });
        });
    } catch (audioError) {
        console.error("[BulletHell] Error loading audio assets:", audioError);
        // Continue without audio, mark as loaded in ECS singleton
        const assetState = getAssetState();
        if (assetState) {
            assetState.audio_loaded = true;
        }
        loadVisualAssets();
    }
};

function loadVisualAssets() {
    // Load font first for text displays
    // console.log("[BulletHell] Loading font for text displays...");
    Toxoid.API.loadFontText("assets/Montserrat-Regular.ttf", 16.0, function(fontEntity) {
        // console.log("[BulletHell] ✓ Font loaded successfully");
        
        // Mark font as loaded in ECS singleton
        const assetState = getAssetState();
        if (assetState) {
            assetState.font_loaded = true;
        }
        
        // Create score text and store reference in ECS singleton
        const scoreText = createScoreTextWithScore(0);
        const scoreTextRef = getScoreTextRef();
        if (scoreText && scoreTextRef) {
            scoreTextRef.score_text_entity_id = scoreText.id;
        }
        
        // Load axe sprite for bullets
        // console.log("[BulletHell] Loading axe sprite for bullets...");
        Toxoid.API.loadSprite("assets/sprites/axe.png", function(spriteEntity) {
            // console.log("[BulletHell] ✓ Axe sprite loaded successfully");
            
            // Load Spine prefabs after sprite is loaded
            // console.log("[BulletHell] Loading Spine animation prefabs...");
            
            // Load enemy character prefab
            Toxoid.API.loadSpineAnimation(
                "assets/animations/fighter/character.atlas",
                "assets/animations/character/character.json", 
                "fighter",
                false,  // Don't render the prefab
                function(prefab) {
                    // Load player character prefab
                    Toxoid.API.loadSpineAnimation(
                        "assets/animations/priestess/character.atlas",
                        "assets/animations/character/character.json", 
                        "priestess",
                        false,  // Don't render the prefab
                        function(prefab) {
                            // console.log("[BulletHell] ✓ Character prefab loaded successfully");
                            // Now create the player character (enemies will use the same prefab)
                            const player = createPlayerCharacter(400, 300);
                            if (player) {
                                // Store player reference in ECS singleton
                                const playerRef = getPlayerRef();
                                if (playerRef) {
                                    playerRef.player_entity_id = player.id;
                                }
                                
                                // Mark Spine as loaded in ECS singleton
                                const assetState = getAssetState();
                                if (assetState) {
                                    assetState.spine_loaded = true;
                                }
                                
                                // console.log("[BulletHell] ✓ Player character created and ready");
                                
                                // Initialize the game systems now that all assets are loaded
                                initGameSystems();
                            } else {
                                console.error("[BulletHell] Failed to create player character");
                            }
                        });
                }
            );
        });
    });
}

function initGameSystems() {
    // console.log("[BulletHell] Initializing game systems...");
    
    // Register all game systems
    try {
        // Player movement system
        const playerSys = Toxoid.System.create(
            'PlayerSystem',
            'BulletHellPlayer, Position',
            Toxoid.Phases.ON_UPDATE,
            function(iter) {
                try {
                    playerSystem(iter);
                } catch (error) {
                    console.error("[BulletHell] Error in playerSystem:", error);
                }
            }
        );
        
        // Player auto-attack system
        const autoAttackSys = Toxoid.System.create(
            'PlayerAutoAttackSystem',
            'BulletHellPlayer',  // Query for player to maintain timer
            Toxoid.Phases.ON_UPDATE,
            function(iter) {
                try {
                    playerAutoAttackSystem(iter);
                } catch (error) {
                    console.error("[BulletHell] Error in playerAutoAttackSystem:", error);
                }
            }
        );
        
        // Enemy spawning system (runs on any entity to maintain timer)
        const spawnSys = Toxoid.System.create(
            'EnemySpawnSystem',
            'Enemy',  // Query enemies to count them
            Toxoid.Phases.ON_UPDATE,
            function(iter) {
                try {
                    enemySpawnSystem(iter);
                } catch (error) {
                    console.error("[BulletHell] Error in enemySpawnSystem:", error);
                }
            }
        );
        
        // Enemy AI system (persistent following like Vampire Survivors)
        const aiSys = Toxoid.System.create(
            'EnemyAISystem',
            'BulletHellEnemy, Position',
            Toxoid.Phases.ON_UPDATE,
            function(iter) {
                try {
                    enemyAISystem(iter);
                } catch (error) {
                    console.error("[BulletHell] Error in enemyAISystem:", error);
                }
            }
        );
        
        // Bullet collision system - wrap in try-catch for better error handling
        const collisionSys = Toxoid.System.create(
            'BulletCollisionSystem',
            'Bullet, Position',
            Toxoid.Phases.ON_UPDATE,
            function(iter) {
                try {
                    bulletCollisionSystem(iter);
                } catch (error) {
                    console.error("[BulletHell] Error in bulletCollisionSystem:", error);
                }
            }
        );
        
        // Bullet cleanup system (movement handled by host physics)
        const bulletSys = Toxoid.System.create(
            'BulletCleanupSystem',
            'Bullet, Position',
            Toxoid.Phases.ON_UPDATE,
            function(iter) {
                try {
                    bulletCleanupSystem(iter);
                } catch (error) {
                    console.error("[BulletHell] Error in bulletCleanupSystem:", error);
                }
            }
        );
        
        // Enemy health management system
        const healthSys = Toxoid.System.create(
            'EnemyHealthSystem',
            'BulletHellEnemy, Health',
            Toxoid.Phases.ON_UPDATE,
            function(iter) {
                try {
                    enemyHealthSystem(iter);
                } catch (error) {
                    console.error("[BulletHell] Error in enemyHealthSystem:", error);
                }
            }
        );
        
        if (playerSys && autoAttackSys && spawnSys && aiSys && collisionSys && bulletSys && healthSys) {
            //  console.log("[BulletHell] All systems registered successfully!");
            // console.log("[BulletHell] Controls: Arrow keys to move");
            // console.log("[BulletHell] Player automatically shoots at nearest enemy with attack animations!");
            // console.log("[BulletHell] Enemies are animated fighters that follow you!"); 
            // console.log("[BulletHell] Enemy health is displayed as bars above enemies!");
            // console.log("[BulletHell] Score counter in top-right shows enemies killed!");
            // console.log("[BulletHell] Bullets damage enemies and update their health display!");
            // console.log("[BulletHell] Destroy enemies by reducing their health to zero!");
            // console.log("[BulletHell] Watch the Spine animations in action!");
        } else {
            console.error("[BulletHell] Failed to register some systems");
        }
        
    } catch (error) {
        console.error("[BulletHell] Error initializing game:", error);
    }
}

// Auto-start the game
if (typeof Toxoid !== 'undefined') {
    init();
}