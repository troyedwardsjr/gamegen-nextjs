// Fixed Bullet Hell Game - Proper ECS Component Updates
// This version uses setter methods instead of direct property assignment

// ===== PHASE 1: COMPONENT REGISTRATION =====
const enemyId = Toxoid.API.createComponent("Enemy");
const bulletId = Toxoid.API.createComponent("Bullet");
const bulletHellPlayerId = Toxoid.API.createComponent("BulletHellPlayer");

if (enemyId === 0 || bulletId === 0 || bulletHellPlayerId === 0) {
    console.error("[BulletHell Fixed] Component registration failed");
    throw new Error("Failed to register required components");
}

console.log("[BulletHell Fixed] Components registered:", {enemyId, bulletId, bulletHellPlayerId});

// ===== PHASE 2: PLAYER SETUP =====
const playerId = Toxoid.API.filledRect(400, 300, 24, 24, { r: 0.2, g: 0.5, b: 1.0, a: 1.0 });
const player = Toxoid.API.getEntity(playerId);

if (!player || !player.add || !player.add("BulletHellPlayer")) {
    console.error("[BulletHell Fixed] Player creation failed");
    throw new Error("Failed to create player entity");
}

// Global state
let bulletHellPlayer = player;
let currentEnemies = [];
let bulletTimer = 0;
let enemyTimer = 0;
let gameScore = 0;

// ===== HELPER FUNCTIONS =====

// Safe component getter with retry logic
function getComponentSafe(entity, componentName, maxRetries = 3) {
    if (!entity) return null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const component = entity.getComponent(componentName);
        if (component) return component;
        
        if (attempt === 1) {
            entity.add(componentName);
        }
    }
    
    return null;
}

// Safe position setter - uses setter methods instead of direct assignment
function setPositionSafe(entity, newX, newY) {
    const pos = getComponentSafe(entity, "Position");
    if (!pos) return false;
    
    // Method 1: Try using setter methods if available
    if (typeof pos.set_x === 'function' && typeof pos.set_y === 'function') {
        pos.set_x(newX);
        pos.set_y(newY);
        console.log("[BulletHell Fixed] Used setter methods for position update");
        return true;
    }
    
    // Method 2: Try using setComponent
    const success = entity.setComponent("Position", { x: newX, y: newY });
    if (success) {
        console.log("[BulletHell Fixed] Used setComponent for position update");
        return true;
    }
    
    // Method 3: Last resort - direct property assignment (should trigger setters)
    console.log("[BulletHell Fixed] Falling back to direct property assignment");
    const oldX = pos.x;
    const oldY = pos.y;
    pos.x = newX;
    pos.y = newY;
    
    // Verify the change actually took effect
    const verifyPos = entity.getComponent("Position");
    if (verifyPos && (Math.abs(verifyPos.x - newX) < 0.01 && Math.abs(verifyPos.y - newY) < 0.01)) {
        console.log("[BulletHell Fixed] Direct assignment successful");
        return true;
    } else {
        console.error("[BulletHell Fixed] Position update failed! Expected:", {newX, newY}, "Got:", {x: verifyPos?.x, y: verifyPos?.y});
        return false;
    }
}

// Safe velocity setter
function setVelocitySafe(entity, newVelX, newVelY) {
    let vel = getComponentSafe(entity, "Velocity");
    if (!vel) {
        entity.add("Velocity");
        vel = getComponentSafe(entity, "Velocity");
        if (!vel) return false;
    }
    
    // Method 1: Setter methods
    if (typeof vel.set_x === 'function' && typeof vel.set_y === 'function') {
        vel.set_x(newVelX);
        vel.set_y(newVelY);
        return true;
    }
    
    // Method 2: setComponent
    const success = entity.setComponent("Velocity", { x: newVelX, y: newVelY });
    if (success) return true;
    
    // Method 3: Direct assignment
    vel.x = newVelX;
    vel.y = newVelY;
    
    // Verify
    const verifyVel = entity.getComponent("Velocity");
    return (verifyVel && Math.abs(verifyVel.x - newVelX) < 0.01 && Math.abs(verifyVel.y - newVelY) < 0.01);
}

// ===== PHASE 3: GAME SYSTEMS =====

// 1. Player Movement System
const playerMoveSystem = Toxoid.System.create("PlayerMovement", "BulletHellPlayer, Position", 1, function(iter) {
    const kb = Toxoid.API.getSingleton("KeyboardInput");
    if (!kb) return;
    
    const entities = iter.entities();
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = getComponentSafe(entity, "Position");
        if (!pos) continue;
        
        let newX = pos.x;
        let newY = pos.y;
        
        const speed = 5;
        if (kb.up) newY -= speed;
        if (kb.down) newY += speed;
        if (kb.left) newX -= speed;
        if (kb.right) newX += speed;
        
        // Clamp to screen bounds
        newX = Math.max(12, Math.min(788, newX));
        newY = Math.max(12, Math.min(588, newY));
        
        // Use safe position setter
        if (setPositionSafe(entity, newX, newY)) {
            bulletHellPlayer = entity; // Update global reference
        }
    }
});

// 2. Enemy Chase System - Fixed position updates
const enemyChaseSystem = Toxoid.System.create("EnemyChase", "Enemy, Position", 2, function(iter) {
    if (!bulletHellPlayer) return;
    
    const playerPos = getComponentSafe(bulletHellPlayer, "Position");
    if (!playerPos) return;
    
    const entities = iter.entities();
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = getComponentSafe(entity, "Position");
        if (!pos) continue;
        
        // Skip off-screen entities
        if (pos.x < -500 || pos.x > 1300 || pos.y < -500 || pos.y > 1100) {
            continue;
        }
        
        const dx = playerPos.x - pos.x;
        const dy = playerPos.y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1.0) {
            const speed = 2.0;
            const moveX = (dx / distance) * speed;
            const moveY = (dy / distance) * speed;
            
            const newX = pos.x + moveX;
            const newY = pos.y + moveY;
            
            // Use safe position setter
            setPositionSafe(entity, newX, newY);
        }
    }
});

// 3. Bullet Movement System - Fixed velocity application
const bulletMoveSystem = Toxoid.System.create("BulletMovement", "Bullet, Position, Velocity", 3, function(iter) {
    const entities = iter.entities();
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = getComponentSafe(entity, "Position");
        const vel = getComponentSafe(entity, "Velocity");
        
        if (!pos || !vel) continue;
        if (pos.x < -500) continue; // Skip deleted bullets
        
        const newX = pos.x + vel.x;
        const newY = pos.y + vel.y;
        
        // Update position using safe setter
        if (setPositionSafe(entity, newX, newY)) {
            // Mark off-screen bullets for deletion
            if (newX < -100 || newX > 900 || newY < -100 || newY > 700) {
                setPositionSafe(entity, -1000, -1000);
            }
        }
    }
});

// 4. Enemy Tracking System
const enemyTrackingSystem = Toxoid.System.create("EnemyTracking", "Enemy, Position, Health", 4, function(iter) {
    const entities = iter.entities();
    currentEnemies = [];
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = getComponentSafe(entity, "Position");
        if (!pos || pos.x < -500) continue;
        
        currentEnemies.push(entity);
    }
});

// 5. Collision System
const collisionSystem = Toxoid.System.create("CollisionSystem", "Bullet, Position, Velocity", 5, function(iter) {
    const bullets = iter.entities();
    
    for (let b = 0; b < bullets.length; b++) {
        const bullet = bullets[b];
        const bulletPos = getComponentSafe(bullet, "Position");
        
        if (!bulletPos || bulletPos.x < -500) continue;
        
        for (let e = 0; e < currentEnemies.length; e++) {
            const enemy = currentEnemies[e];
            const enemyPos = getComponentSafe(enemy, "Position");
            const enemyHealth = getComponentSafe(enemy, "Health");
            
            if (!enemyPos || !enemyHealth || enemyPos.x < -500) continue;
            
            const dx = Math.abs(bulletPos.x - enemyPos.x);
            const dy = Math.abs(bulletPos.y - enemyPos.y);
            
            if (dx < 15 && dy < 15) {
                // Hit! Damage enemy
                enemyHealth.current_health -= 25;
                
                // Mark bullet for deletion
                setPositionSafe(bullet, -1000, -1000);
                
                // Kill enemy if health depleted
                if (enemyHealth.current_health <= 0) {
                    setPositionSafe(enemy, -1000, -1000);
                    gameScore += 50;
                }
                break;
            }
        }
    }
});

// 6. Game Loop System
const gameUpdateSystem = Toxoid.System.create("GameUpdate", "Position", 6, function(iter) {
    bulletTimer++;
    if (bulletTimer >= 30) {
        spawnBullet();
        bulletTimer = 0;
    }
    
    enemyTimer++;
    if (enemyTimer >= 150) {
        if (currentEnemies.length < 8) {
            spawnEnemy();
        }
        enemyTimer = 0;
    }
});

// ===== SPAWNING FUNCTIONS =====

function spawnBullet() {
    if (!bulletHellPlayer) return;
    
    const playerPos = getComponentSafe(bulletHellPlayer, "Position");
    if (!playerPos) return;
    
    // Find nearest enemy for targeting
    let targetX = 1, targetY = 0;
    let nearestDistance = Infinity;
    
    for (let i = 0; i < currentEnemies.length; i++) {
        const enemy = currentEnemies[i];
        const enemyPos = getComponentSafe(enemy, "Position");
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
    
    // Add components
    const bulletSuccess = bullet.add("Bullet");
    const velocitySuccess = bullet.add("Velocity");
    
    if (bulletSuccess && velocitySuccess) {
        const speed = 8;
        if (!setVelocitySafe(bullet, targetX * speed, targetY * speed)) {
            console.error("[BulletHell Fixed] Failed to set bullet velocity");
        }
    }
}

function spawnEnemy() {
    // Random spawn position at screen edge
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
        case 0: x = Math.random() * 800; y = 0; break;
        case 1: x = 800; y = Math.random() * 600; break;
        case 2: x = Math.random() * 800; y = 600; break;
        case 3: x = 0; y = Math.random() * 600; break;
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
    
    // Set health values using safe methods
    const health = getComponentSafe(enemy, "Health");
    if (health) {
        health.current_health = 100;
        health.max_health = 100;
    }
}

// ===== INITIALIZATION COMPLETE =====
console.log("[BulletHell Fixed] Fixed bullet hell game loaded!");
console.log("[BulletHell Fixed] Controls: Arrow keys to move");
console.log("[BulletHell Fixed] Features: Proper ECS updates, auto-targeting bullets, collision detection");