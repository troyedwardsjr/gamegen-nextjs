// Simple Bullet Hell Game - Fixed Component Access Version
// Minimal logging, maximum reliability

// Component registration with error checking
const enemyId = Toxoid.API.createComponent("Enemy");
const bulletId = Toxoid.API.createComponent("Bullet");
const bulletHellPlayerId = Toxoid.API.createComponent("BulletHellPlayer");

if (enemyId === 0 || bulletId === 0 || bulletHellPlayerId === 0) {
    console.error("[BulletHell] Component registration failed");
    throw new Error("Component registration failed");
}

// Player setup with validation
const playerId = Toxoid.API.filledRect(400, 300, 24, 24, { r: 0.2, g: 0.5, b: 1.0, a: 1.0 });
const player = Toxoid.API.getEntity(playerId);

if (!player || !player.add("BulletHellPlayer")) {
    console.error("[BulletHell] Player creation failed");
    throw new Error("Player creation failed");
}

// Global state
let bulletHellPlayer = player;
let currentEnemies = [];
let bulletTimer = 0;
let enemyTimer = 0;

// Helper function for consistent component access
function getComponentReliably(entity, componentName) {
    if (!entity) return null;
    
    let component = entity.getComponent(componentName);
    if (!component && componentName === "Velocity") {
        // Force velocity component addition
        entity.add("Velocity");
        component = entity.getComponent(componentName);
    }
    return component;
}

// System 1: Player Movement - Reliable input handling
const playerMoveSystem = Toxoid.System.create("PlayerMovement", "BulletHellPlayer, Position", 1, function(iter) {
    const kb = Toxoid.API.getSingleton("KeyboardInput");
    if (!kb) return;
    
    const entities = iter.entities();
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = entity.getComponent("Position");
        if (!pos) continue;
        
        let newX = pos.x;
        let newY = pos.y;
        
        const speed = 5;
        if (kb.up) newY -= speed;
        if (kb.down) newY += speed;
        if (kb.left) newX -= speed;
        if (kb.right) newX += speed;
        
        newX = Math.max(12, Math.min(788, newX));
        newY = Math.max(12, Math.min(588, newY));
        
        pos.x = newX;
        pos.y = newY;
        
        bulletHellPlayer = entity;
    }
});

// System 2: Enemy Chase - Consistent following behavior
const enemyChaseSystem = Toxoid.System.create("EnemyChase", "Enemy, Position", 2, function(iter) {
    if (!bulletHellPlayer) return;
    
    const playerPos = bulletHellPlayer.getComponent("Position");
    if (!playerPos) return;
    
    const entities = iter.entities();
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = entity.getComponent("Position");
        if (!pos || pos.x < -500) continue;
        
        const dx = playerPos.x - pos.x;
        const dy = playerPos.y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1) { // Avoid division by zero
            const speed = 2.0;
            const moveX = (dx / distance) * speed;
            const moveY = (dy / distance) * speed;
            
            pos.x += moveX;
            pos.y += moveY;
        }
    }
});

// System 3: Bullet Movement - Reliable velocity application
const bulletMoveSystem = Toxoid.System.create("BulletMovement", "Bullet, Position, Velocity", 3, function(iter) {
    const entities = iter.entities();
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = entity.getComponent("Position");
        const vel = entity.getComponent("Velocity");
        
        if (!pos || !vel || pos.x < -500) continue;
        
        pos.x += vel.x;
        pos.y += vel.y;
        
        // Mark off-screen bullets
        if (pos.x < -100 || pos.x > 900 || pos.y < -100 || pos.y > 700) {
            pos.x = -1000;
            pos.y = -1000;
        }
    }
});

// System 4: Enemy tracking for collision
const enemyTrackingSystem = Toxoid.System.create("EnemyTracking", "Enemy, Position, Health", 4, function(iter) {
    currentEnemies = [];
    const entities = iter.entities();
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = entity.getComponent("Position");
        if (!pos || pos.x < -500) continue;
        
        currentEnemies.push(entity);
    }
});

// System 5: Collision detection
const collisionSystem = Toxoid.System.create("CollisionSystem", "Bullet, Position, Velocity", 5, function(iter) {
    const bullets = iter.entities();
    
    for (let b = 0; b < bullets.length; b++) {
        const bullet = bullets[b];
        const bulletPos = bullet.getComponent("Position");
        
        if (!bulletPos || bulletPos.x < -500) continue;
        
        for (let e = 0; e < currentEnemies.length; e++) {
            const enemy = currentEnemies[e];
            const enemyPos = enemy.getComponent("Position");
            const enemyHealth = enemy.getComponent("Health");
            
            if (!enemyPos || !enemyHealth || enemyPos.x < -500) continue;
            
            const dx = Math.abs(bulletPos.x - enemyPos.x);
            const dy = Math.abs(bulletPos.y - enemyPos.y);
            
            if (dx < 15 && dy < 15) {
                enemyHealth.current_health -= 25;
                
                bulletPos.x = -1000;
                bulletPos.y = -1000;
                
                if (enemyHealth.current_health <= 0) {
                    enemyPos.x = -1000;
                    enemyPos.y = -1000;
                }
                break;
            }
        }
    }
});

// System 6: Game loop
const gameUpdateSystem = Toxoid.System.create("GameUpdate", "Position", 6, function(iter) {
    bulletTimer++;
    if (bulletTimer >= 30) { // Every 0.5 seconds
        spawnBullet();
        bulletTimer = 0;
    }
    
    enemyTimer++;
    if (enemyTimer >= 180) { // Every 3 seconds
        if (currentEnemies.length < 10) {
            spawnEnemy();
        }
        enemyTimer = 0;
    }
});

// Spawning functions with consistent component handling
function spawnBullet() {
    if (!bulletHellPlayer) return;
    
    const playerPos = bulletHellPlayer.getComponent("Position");
    if (!playerPos) return;
    
    // Simple 8-direction spread
    const directions = [
        { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 },
        { x: 0.707, y: -0.707 }, { x: -0.707, y: -0.707 }, 
        { x: 0.707, y: 0.707 }, { x: -0.707, y: 0.707 }
    ];
    
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const speed = 6;
    
    const bulletEntityId = Toxoid.API.filledRect(
        playerPos.x, playerPos.y, 6, 6, 
        { r: 1.0, g: 1.0, b: 0.0, a: 1.0 }
    );
    const bullet = Toxoid.API.getEntity(bulletEntityId);
    
    if (bullet) {
        bullet.add("Bullet");
        bullet.add("Velocity");
        
        const vel = getComponentReliably(bullet, "Velocity");
        if (vel) {
            vel.x = direction.x * speed;
            vel.y = direction.y * speed;
        }
    }
}

function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
        case 0: x = Math.random() * 800; y = 0; break;
        case 1: x = 800; y = Math.random() * 600; break;  
        case 2: x = Math.random() * 800; y = 600; break;
        case 3: x = 0; y = Math.random() * 600; break;
    }
    
    const enemyEntityId = Toxoid.API.filledRect(
        x, y, 20, 20, 
        { r: 1.0, g: 0.0, b: 0.0, a: 1.0 }
    );
    const enemy = Toxoid.API.getEntity(enemyEntityId);
    
    if (enemy) {
        enemy.add("Enemy");
        enemy.add("Health");
        
        const health = enemy.getComponent("Health");
        if (health) {
            health.current_health = 100;
            health.max_health = 100;
        }
    }
}

console.log("[BulletHell] Simple bullet hell game ready!");