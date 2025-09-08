// Complete Bullet Hell Game - Fixed for System Isolation  
// This version should now work correctly with the system execution isolation fix

// ===== PHASE 1: COMPONENT REGISTRATION =====
const enemyId = Toxoid.API.createComponent("Enemy");
const bulletId = Toxoid.API.createComponent("Bullet");
const bulletHellPlayerId = Toxoid.API.createComponent("BulletHellPlayer");
const healthBarId = Toxoid.API.createComponent("HealthBar");
const followingId = Toxoid.API.createComponent("Following");

if (enemyId === 0 || bulletId === 0 || bulletHellPlayerId === 0 || healthBarId === 0 || followingId === 0) {
    console.error("[BulletHell] Component registration failed");
    throw new Error("Failed to register required components");
}

console.log("[BulletHell] All components registered successfully");

// ===== PHASE 2: PLAYER SETUP =====
const playerId = Toxoid.API.filledRect(400, 300, 24, 24, { r: 0.2, g: 0.5, b: 1.0, a: 1.0 });
const player = Toxoid.API.getEntity(playerId);

if (!player || !player.add || !player.add("BulletHellPlayer")) {
    console.error("[BulletHell] Player creation failed");
    throw new Error("Failed to create player entity");
}

// Global state - consistent reference tracking
let bulletHellPlayer = player;
let currentEnemies = [];
let bulletTimer = 0;
let enemyTimer = 0;
let gameScore = 0;
let systemCallCounts = {
    player: 0,
    enemy: 0,
    bullet: 0,
    collision: 0,
    tracking: 0,
    game: 0
};

console.log("[BulletHell] Player and global state initialized");

// ===== HELPER FUNCTIONS =====

// Safe component access with fallback
function getComponentSafe(entity, componentName, maxRetries = 2) {
    if (!entity) return null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const component = entity.getComponent(componentName);
        if (component) return component;
        
        // Re-add component on second attempt if needed
        if (attempt === 1) {
            entity.add(componentName);
        }
    }
    
    return null;
}

// Safe position access with validation
function getPositionSafe(entity) {
    const pos = getComponentSafe(entity, "Position");
    if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
        return null;
    }
    return pos;
}

// Safe velocity access with fallback setup
function getVelocitySafe(entity) {
    let vel = getComponentSafe(entity, "Velocity");
    if (!vel) {
        entity.add("Velocity");
        vel = getComponentSafe(entity, "Velocity", 3);
    }
    return vel;
}

console.log("[BulletHell] Helper functions defined");

// ===== PHASE 3: GAME SYSTEMS (Isolated) =====

// 1. Player Movement System - Highest Priority
const playerMoveSystem = Toxoid.System.create("PlayerMovement", "BulletHellPlayer, Position", Toxoid.Phases.ON_UPDATE, function(iter) {
    systemCallCounts.player++;
    const kb = Toxoid.API.getSingleton("KeyboardInput");
    if (!kb) return;
    
    const entities = iter.entities();
    
    if (systemCallCounts.player % 120 === 0) { // Log every 2 seconds
        console.log(`[PlayerMovement] Update ${systemCallCounts.player}: Processing ${entities.length} players`);
    }
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = getPositionSafe(entity);
        if (!pos) continue;
        
        let newX = pos.x;
        let newY = pos.y;
        
        const speed = 4;
        if (kb.up) newY -= speed;
        if (kb.down) newY += speed;
        if (kb.left) newX -= speed;
        if (kb.right) newX += speed;
        
        // Clamp to screen bounds
        newX = Math.max(12, Math.min(788, newX));
        newY = Math.max(12, Math.min(588, newY));
        
        pos.x = newX;
        pos.y = newY;
        
        // Update global reference consistently
        bulletHellPlayer = entity;
    }
});

// 2. Enemy Chase System - Reliable following behavior
const enemyChaseSystem = Toxoid.System.create("EnemyChase", "Enemy, Position, Following", Toxoid.Phases.ON_UPDATE, function(iter) {
    systemCallCounts.enemy++;
    if (!bulletHellPlayer) return;
    
    const playerPos = getPositionSafe(bulletHellPlayer);
    if (!playerPos) return;
    
    const entities = iter.entities();
    
    if (systemCallCounts.enemy % 60 === 0) { // Log every second
        console.log(`[EnemyChase] Update ${systemCallCounts.enemy}: Processing ${entities.length} enemies`);
    }
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = getPositionSafe(entity);
        if (!pos) continue;
        
        // Skip off-screen entities
        if (pos.x < -500 || pos.x > 1300 || pos.y < -500 || pos.y > 1100) {
            continue;
        }
        
        const dx = playerPos.x - pos.x;
        const dy = playerPos.y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1.0) { // Avoid division by zero
            const speed = 2.0;
            const moveX = (dx / distance) * speed;
            const moveY = (dy / distance) * speed;
            
            pos.x += moveX;
            pos.y += moveY;
        }
    }
});

// 3. Bullet Movement System - Consistent velocity application
const bulletMoveSystem = Toxoid.System.create("BulletMovement", "Bullet, Position, Velocity", Toxoid.Phases.ON_UPDATE, function(iter) {
    systemCallCounts.bullet++;
    const entities = iter.entities();
    
    if (systemCallCounts.bullet % 60 === 0) { // Log every second
        console.log(`[BulletMovement] Update ${systemCallCounts.bullet}: Processing ${entities.length} bullets`);
    }
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = getPositionSafe(entity);
        const vel = getComponentSafe(entity, "Velocity");
        
        if (!pos || !vel) continue;
        
        // Skip bullets that are marked for deletion
        if (pos.x < -500) continue;
        
        pos.x += vel.x;
        pos.y += vel.y;
        
        // Mark off-screen bullets for deletion
        if (pos.x < -100 || pos.x > 900 || pos.y < -100 || pos.y > 700) {
            pos.x = -1000;
            pos.y = -1000;
        }
    }
});

// 4. Enemy Tracking System - Populate enemy list
const enemyTrackingSystem = Toxoid.System.create("EnemyTracking", "Enemy, Position, Health", Toxoid.Phases.ON_UPDATE, function(iter) {
    systemCallCounts.tracking++;
    // Update global enemy list for collision detection
    const entities = iter.entities();
    currentEnemies = [];
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = getPositionSafe(entity);
        if (!pos || pos.x < -500) continue; // Skip off-screen enemies
        
        currentEnemies.push(entity);
    }
    
    if (systemCallCounts.tracking % 60 === 0) { // Log every second
        console.log(`[EnemyTracking] Update ${systemCallCounts.tracking}: Tracking ${currentEnemies.length} active enemies`);
    }
});

// 5. Collision System - Reliable bullet-enemy collision
const collisionSystem = Toxoid.System.create("CollisionSystem", "Bullet, Position, Velocity", Toxoid.Phases.ON_UPDATE, function(iter) {
    systemCallCounts.collision++;
    const bullets = iter.entities();
    
    let hitCount = 0;
    for (let b = 0; b < bullets.length; b++) {
        const bullet = bullets[b];
        const bulletPos = getPositionSafe(bullet);
        
        if (!bulletPos || bulletPos.x < -500) continue;
        
        // Check against all enemies
        for (let e = 0; e < currentEnemies.length; e++) {
            const enemy = currentEnemies[e];
            const enemyPos = getPositionSafe(enemy);
            const enemyHealth = getComponentSafe(enemy, "Health");
            
            if (!enemyPos || !enemyHealth || enemyPos.x < -500) continue;
            
            const dx = Math.abs(bulletPos.x - enemyPos.x);
            const dy = Math.abs(bulletPos.y - enemyPos.y);
            
            if (dx < 15 && dy < 15) {
                // Hit! Damage enemy
                enemyHealth.current_health -= 25;
                hitCount++;
                
                // Mark bullet for deletion
                bulletPos.x = -1000;
                bulletPos.y = -1000;
                
                // Kill enemy if health depleted
                if (enemyHealth.current_health <= 0) {
                    enemyPos.x = -1000;
                    enemyPos.y = -1000;
                    gameScore += 50;
                }
                break;
            }
        }
    }
    
    if (systemCallCounts.collision % 60 === 0) { // Log every second
        console.log(`[CollisionSystem] Update ${systemCallCounts.collision}: Processed ${bullets.length} bullets, ${hitCount} hits this update`);
    }
});

// 6. Game Loop System - Spawning and game state
const gameUpdateSystem = Toxoid.System.create("GameUpdate", "Position", Toxoid.Phases.ON_UPDATE, function(iter) {
    systemCallCounts.game++;
    
    // Bullet spawning every 0.5 seconds
    bulletTimer++;
    if (bulletTimer >= 30) {
        spawnBullet();
        bulletTimer = 0;
    }
    
    // Enemy spawning every 2.5 seconds
    enemyTimer++;
    if (enemyTimer >= 150) {
        if (currentEnemies.length < 8) {
            spawnEnemy();
        }
        enemyTimer = 0;
    }
    
    if (systemCallCounts.game % 300 === 0) { // Log every 5 seconds
        console.log(`[GameUpdate] Update ${systemCallCounts.game}: Score=${gameScore}, Enemies=${currentEnemies.length}, BulletTimer=${bulletTimer}, EnemyTimer=${enemyTimer}`);
    }
});

console.log("[BulletHell] All systems defined");

// ===== SPAWNING FUNCTIONS =====

function spawnBullet() {
    if (!bulletHellPlayer) return;
    
    const playerPos = getPositionSafe(bulletHellPlayer);
    if (!playerPos) return;
    
    // Find nearest enemy for targeting (Vampire Survivors style)
    let targetX = 1, targetY = 0; // Default direction
    let nearestDistance = Infinity;
    
    for (let i = 0; i < currentEnemies.length; i++) {
        const enemy = currentEnemies[i];
        const enemyPos = getPositionSafe(enemy);
        if (!enemyPos) continue;
        
        const dx = enemyPos.x - playerPos.x;
        const dy = enemyPos.y - playerPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < nearestDistance && distance > 1) {
            nearestDistance = distance;
            targetX = dx / distance;
            targetY = dy / distance;
        }
    }
    
    // Create bullet
    const bulletEntityId = Toxoid.API.filledRect(
        playerPos.x, playerPos.y, 6, 6, 
        { r: 1.0, g: 1.0, b: 0.0, a: 1.0 }
    );
    const bullet = Toxoid.API.getEntity(bulletEntityId);
    
    if (!bullet) return;
    
    // Add components with verification
    const bulletSuccess = bullet.add("Bullet");
    const velocitySuccess = bullet.add("Velocity");
    
    if (bulletSuccess && velocitySuccess) {
        const vel = getVelocitySafe(bullet);
        if (vel) {
            const speed = 6;
            vel.x = targetX * speed;
            vel.y = targetY * speed;
        }
    }
}

function spawnEnemy() {
    // Random spawn position at screen edge
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
        case 0: x = Math.random() * 800; y = 0; break;    // Top
        case 1: x = 800; y = Math.random() * 600; break;  // Right
        case 2: x = Math.random() * 800; y = 600; break;  // Bottom
        case 3: x = 0; y = Math.random() * 600; break;    // Left
    }
    
    // Create enemy
    const enemyEntityId = Toxoid.API.filledRect(
        x, y, 20, 20, 
        { r: 1.0, g: 0.0, b: 0.0, a: 1.0 }
    );
    const enemy = Toxoid.API.getEntity(enemyEntityId);
    
    if (!enemy) return;
    
    // Add components
    enemy.add("Enemy");
    enemy.add("Health");
    enemy.add("Following");
    
    // Set health values
    const health = getComponentSafe(enemy, "Health");
    if (health) {
        health.current_health = 100;
        health.max_health = 100;
    }
    
    console.log(`[BulletHell] Spawned enemy at (${x.toFixed(0)}, ${y.toFixed(0)})`);
}

console.log("[BulletHell] Spawning functions defined");

// ===== SYSTEM VERIFICATION =====
const allSystems = [playerMoveSystem, enemyChaseSystem, bulletMoveSystem, enemyTrackingSystem, collisionSystem, gameUpdateSystem];
const systemNames = ["PlayerMovement", "EnemyChase", "BulletMovement", "EnemyTracking", "CollisionSystem", "GameUpdate"];

let successCount = 0;
for (let i = 0; i < allSystems.length; i++) {
    if (allSystems[i]) {
        successCount++;
        console.log(`[BulletHell] ✅ ${systemNames[i]} system created successfully`);
    } else {
        console.error(`[BulletHell] ❌ ${systemNames[i]} system creation failed`);
    }
}

if (successCount === allSystems.length) {
    console.log("[BulletHell] ✅ ALL SYSTEMS CREATED SUCCESSFULLY!");
    console.log("[BulletHell] Complete bullet hell game loaded!");
    console.log("[BulletHell] Controls: Arrow keys to move");
    console.log("[BulletHell] Features: Auto-targeting bullets, enemy AI, collision detection");
    console.log("[BulletHell] The system isolation fix should now allow all systems to work together");
    console.log("[BulletHell] Watch for regular system update logs to confirm everything is working");
} else {
    console.error(`[BulletHell] ❌ Only ${successCount}/${allSystems.length} systems created successfully`);
    console.error("[BulletHell] Game may not function correctly");
}

console.log("[BulletHell] ===== INITIALIZATION COMPLETE =====");