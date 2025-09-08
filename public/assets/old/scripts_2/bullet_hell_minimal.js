// Minimal Bullet Hell - Using working patterns from snake_game.js
// Stripped down to essentials that should actually work

// ===== GAME STATE =====
let gameState = {
    player: null,
    enemies: [],
    bullets: [],
    enemySpawnTimer: 0,
    bulletSpawnTimer: 0,
    systemUpdateCount: 0
};

// ===== COLORS =====
const COLORS = {
    PLAYER: { r: 0.2, g: 0.5, b: 1.0, a: 1.0 },
    ENEMY: { r: 1.0, g: 0.2, b: 0.2, a: 1.0 },
    BULLET: { r: 1.0, g: 1.0, b: 0.0, a: 1.0 }
};

// ===== INITIALIZATION =====
function initializeBulletHell() {
    console.log("[BulletHell] Starting minimal bullet hell game...");
    
    // Register components
    Toxoid.API.createComponent("BulletHellPlayer");
    Toxoid.API.createComponent("Enemy");
    Toxoid.API.createComponent("Bullet");
    
    // Create player
    const playerId = Toxoid.API.filledRect(400, 300, 24, 24, COLORS.PLAYER);
    gameState.player = Toxoid.API.getEntity(playerId);
    gameState.player.add("BulletHellPlayer");
    
    console.log("[BulletHell] Player created");
    
    // Register main game system
    const mainSystem = Toxoid.System.create(
        "BulletHellMain",
        "BulletHellPlayer",  // Query for player to ensure system runs
        Toxoid.Phases.ON_UPDATE,
        bulletHellUpdate
    );
    
    if (mainSystem) {
        console.log("[BulletHell] System registered successfully");
    } else {
        console.error("[BulletHell] Failed to register system");
    }
}

// ===== MAIN UPDATE =====
function bulletHellUpdate(iter) {
    gameState.systemUpdateCount++;
    
    // Player movement
    const kb = Toxoid.API.getSingleton("KeyboardInput");
    if (kb && gameState.player) {
        const pos = gameState.player.getComponent("Position");
        if (pos) {
            let newX = pos.x;
            let newY = pos.y;
            
            if (kb.up) newY -= 4;
            if (kb.down) newY += 4;
            if (kb.left) newX -= 4;
            if (kb.right) newX += 4;
            
            // Update position directly on component
            pos.x = Math.max(12, Math.min(788, newX));
            pos.y = Math.max(12, Math.min(588, newY));
        }
    }
    
    // Spawn enemies periodically
    gameState.enemySpawnTimer++;
    if (gameState.enemySpawnTimer >= 120) { // Every 2 seconds
        spawnEnemy();
        gameState.enemySpawnTimer = 0;
    }
    
    // Spawn bullets periodically
    gameState.bulletSpawnTimer++;
    if (gameState.bulletSpawnTimer >= 30) { // Every 0.5 seconds
        spawnBullet();
        gameState.bulletSpawnTimer = 0;
    }
    
    // Move enemies toward player
    moveEnemies();
    
    // Move bullets
    moveBullets();
    
    // Clean up off-screen entities
    cleanupEntities();
    
    // Log every 2 seconds
    if (gameState.systemUpdateCount % 120 === 0) {
        console.log(`[BulletHell] Update ${gameState.systemUpdateCount}: Enemies=${gameState.enemies.length}, Bullets=${gameState.bullets.length}`);
    }
}

// ===== ENEMY SPAWNING =====
function spawnEnemy() {
    if (gameState.enemies.length >= 10) return; // Limit enemies
    
    // Random edge spawn
    const side = Math.floor(Math.random() * 4);
    let x = 400, y = 300;
    
    switch(side) {
        case 0: x = Math.random() * 800; y = 0; break;
        case 1: x = 800; y = Math.random() * 600; break;
        case 2: x = Math.random() * 800; y = 600; break;
        case 3: x = 0; y = Math.random() * 600; break;
    }
    
    const enemyId = Toxoid.API.filledRect(x, y, 20, 20, COLORS.ENEMY);
    const enemy = Toxoid.API.getEntity(enemyId);
    
    if (enemy) {
        enemy.add("Enemy");
        gameState.enemies.push({
            entity: enemy,
            id: enemyId
        });
    }
}

// ===== BULLET SPAWNING =====
function spawnBullet() {
    if (!gameState.player) return;
    
    const playerPos = gameState.player.getComponent("Position");
    if (!playerPos) return;
    
    // Find nearest enemy for targeting
    let targetVx = 1, targetVy = 0;
    let nearestDist = Infinity;
    
    for (let i = 0; i < gameState.enemies.length; i++) {
        const enemy = gameState.enemies[i];
        if (!enemy || !enemy.entity) continue;
        
        const enemyPos = enemy.entity.getComponent("Position");
        if (!enemyPos) continue;
        
        const dx = enemyPos.x - playerPos.x;
        const dy = enemyPos.y - playerPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < nearestDist && dist > 1) {
            nearestDist = dist;
            targetVx = dx / dist;
            targetVy = dy / dist;
        }
    }
    
    const bulletId = Toxoid.API.filledRect(playerPos.x, playerPos.y, 6, 6, COLORS.BULLET);
    const bullet = Toxoid.API.getEntity(bulletId);
    
    if (bullet) {
        bullet.add("Bullet");
        gameState.bullets.push({
            entity: bullet,
            id: bulletId,
            vx: targetVx * 6,
            vy: targetVy * 6
        });
    }
}

// ===== ENEMY MOVEMENT =====
function moveEnemies() {
    if (!gameState.player) return;
    
    const playerPos = gameState.player.getComponent("Position");
    if (!playerPos) return;
    
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        if (!enemy || !enemy.entity) {
            gameState.enemies.splice(i, 1);
            continue;
        }
        
        const enemyPos = enemy.entity.getComponent("Position");
        if (!enemyPos) continue;
        
        // Move toward player
        const dx = playerPos.x - enemyPos.x;
        const dy = playerPos.y - enemyPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 1) {
            const speed = 2;
            enemyPos.x += (dx / dist) * speed;
            enemyPos.y += (dy / dist) * speed;
        }
    }
}

// ===== BULLET MOVEMENT =====
function moveBullets() {
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        if (!bullet || !bullet.entity) {
            gameState.bullets.splice(i, 1);
            continue;
        }
        
        const bulletPos = bullet.entity.getComponent("Position");
        if (!bulletPos) continue;
        
        // Apply velocity
        bulletPos.x += bullet.vx;
        bulletPos.y += bullet.vy;
        
        // Check collision with enemies
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            const enemy = gameState.enemies[j];
            if (!enemy || !enemy.entity) continue;
            
            const enemyPos = enemy.entity.getComponent("Position");
            if (!enemyPos) continue;
            
            const dx = Math.abs(bulletPos.x - enemyPos.x);
            const dy = Math.abs(bulletPos.y - enemyPos.y);
            
            if (dx < 15 && dy < 15) {
                // Hit! Remove both bullet and enemy
                Toxoid.API.removeEntity(bullet.id);
                Toxoid.API.removeEntity(enemy.id);
                gameState.bullets.splice(i, 1);
                gameState.enemies.splice(j, 1);
                console.log("[BulletHell] Hit! Enemy destroyed");
                break;
            }
        }
    }
}

// ===== CLEANUP =====
function cleanupEntities() {
    // Remove off-screen bullets
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        if (!bullet || !bullet.entity) {
            gameState.bullets.splice(i, 1);
            continue;
        }
        
        const pos = bullet.entity.getComponent("Position");
        if (!pos) continue;
        
        if (pos.x < -50 || pos.x > 850 || pos.y < -50 || pos.y > 650) {
            Toxoid.API.removeEntity(bullet.id);
            gameState.bullets.splice(i, 1);
        }
    }
}

// ===== AUTO-START =====
if (typeof Toxoid !== 'undefined') {
    initializeBulletHell();
    console.log("[BulletHell] Minimal bullet hell game started!");
    console.log("[BulletHell] Controls: Arrow keys to move");
}