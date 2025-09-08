// Bullet Hell Test - Fixed Version
// Tests the specific bullet hell issues with the system isolation fix

console.log("[BulletHellTest] Testing bullet hell with system isolation fix...");

// ===== COMPONENT REGISTRATION =====
const enemyId = Toxoid.API.createComponent("Enemy");
const bulletId = Toxoid.API.createComponent("Bullet");
const bulletHellPlayerId = Toxoid.API.createComponent("BulletHellPlayer");

if (enemyId === 0 || bulletId === 0 || bulletHellPlayerId === 0) {
    console.error("[BulletHellTest] Component registration failed");
    throw new Error("Failed to register required components");
}

console.log("[BulletHellTest] Components registered successfully:", {enemyId, bulletId, bulletHellPlayerId});

// ===== PLAYER SETUP =====
const playerId = Toxoid.API.filledRect(400, 300, 24, 24, { r: 0.2, g: 0.5, b: 1.0, a: 1.0 });
const player = Toxoid.API.getEntity(playerId);

if (!player || !player.add || !player.add("BulletHellPlayer")) {
    console.error("[BulletHellTest] Player creation failed");
    throw new Error("Failed to create player entity");
}

console.log("[BulletHellTest] Player created successfully");

// Global state
let bulletHellPlayer = player;
let currentEnemies = [];
let bulletTimer = 0;
let enemyTimer = 0;
let gameScore = 0;

// ===== SYSTEMS =====

// System 1: Player Movement
let playerMoveCallCount = 0;
const playerMoveSystem = Toxoid.System.create("PlayerMovement", "BulletHellPlayer, Position", Toxoid.Phases.ON_UPDATE, function(iter) {
    playerMoveCallCount++;
    const kb = Toxoid.API.getSingleton("KeyboardInput");
    if (!kb) return;
    
    const entities = iter.entities();
    if (playerMoveCallCount % 120 === 0) { // Log every 2 seconds
        console.log(`[PlayerMovement] Update ${playerMoveCallCount}: Processing ${entities.length} player entities`);
    }
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = entity.getComponent("Position");
        if (!pos) continue;
        
        let newX = pos.x;
        let newY = pos.y;
        
        const speed = 3;
        if (kb.up) newY -= speed;
        if (kb.down) newY += speed;
        if (kb.left) newX -= speed;
        if (kb.right) newX += speed;
        
        // Clamp to screen bounds
        newX = Math.max(12, Math.min(788, newX));
        newY = Math.max(12, Math.min(588, newY));
        
        pos.x = newX;
        pos.y = newY;
        
        // Update global reference
        bulletHellPlayer = entity;
    }
});

// System 2: Bullet Movement  
let bulletMoveCallCount = 0;
const bulletMoveSystem = Toxoid.System.create("BulletMovement", "Bullet, Position, Velocity", Toxoid.Phases.ON_UPDATE, function(iter) {
    bulletMoveCallCount++;
    const entities = iter.entities();
    
    if (bulletMoveCallCount % 60 === 0) { // Log every second
        console.log(`[BulletMovement] Update ${bulletMoveCallCount}: Processing ${entities.length} bullets`);
    }
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = entity.getComponent("Position");
        const vel = entity.getComponent("Velocity");
        
        if (!pos || !vel) continue;
        
        // Skip bullets marked for deletion
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

// System 3: Enemy Chase
let enemyChaseCallCount = 0;
const enemyChaseSystem = Toxoid.System.create("EnemyChase", "Enemy, Position", Toxoid.Phases.ON_UPDATE, function(iter) {
    enemyChaseCallCount++;
    if (!bulletHellPlayer) return;
    
    const playerPos = bulletHellPlayer.getComponent("Position");
    if (!playerPos) return;
    
    const entities = iter.entities();
    if (enemyChaseCallCount % 60 === 0) { // Log every second
        console.log(`[EnemyChase] Update ${enemyChaseCallCount}: Processing ${entities.length} enemies`);
    }
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = entity.getComponent("Position");
        if (!pos) continue;
        
        // Skip off-screen enemies
        if (pos.x < -500 || pos.x > 1300 || pos.y < -500 || pos.y > 1100) {
            continue;
        }
        
        const dx = playerPos.x - pos.x;
        const dy = playerPos.y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1.0) {
            const speed = 1.5;
            const moveX = (dx / distance) * speed;
            const moveY = (dy / distance) * speed;
            
            pos.x += moveX;
            pos.y += moveY;
        }
    }
});

// System 4: Game Update (spawning)
let gameUpdateCallCount = 0;
const gameUpdateSystem = Toxoid.System.create("GameUpdate", "Position", Toxoid.Phases.ON_UPDATE, function(iter) {
    gameUpdateCallCount++;
    
    // Bullet spawning every 0.5 seconds
    bulletTimer++;
    if (bulletTimer >= 30) {
        spawnBullet();
        bulletTimer = 0;
    }
    
    // Enemy spawning every 3 seconds
    enemyTimer++;
    if (enemyTimer >= 180) {
        if (currentEnemies.length < 5) {
            spawnEnemy();
        }
        enemyTimer = 0;
    }
    
    if (gameUpdateCallCount % 180 === 0) { // Log every 3 seconds
        console.log(`[GameUpdate] Update ${gameUpdateCallCount}: Game state - Bullets: ${bulletTimer}, Enemies: ${currentEnemies.length}, Score: ${gameScore}`);
    }
});

// ===== SPAWNING FUNCTIONS =====

function spawnBullet() {
    if (!bulletHellPlayer) return;
    
    const playerPos = bulletHellPlayer.getComponent("Position");
    if (!playerPos) return;
    
    // Simple bullet - shoot to the right
    const bulletEntityId = Toxoid.API.filledRect(
        playerPos.x, playerPos.y, 6, 6, 
        { r: 1.0, g: 1.0, b: 0.0, a: 1.0 }
    );
    const bullet = Toxoid.API.getEntity(bulletEntityId);
    
    if (!bullet) return;
    
    bullet.add("Bullet");
    bullet.add("Velocity");
    
    const vel = bullet.getComponent("Velocity");
    if (vel) {
        vel.x = 5; // Move right
        vel.y = 0;
    }
    
    console.log("[BulletHellTest] Spawned bullet at", playerPos.x, playerPos.y);
}

function spawnEnemy() {
    // Spawn on right edge
    const x = 800;
    const y = Math.random() * 600;
    
    const enemyEntityId = Toxoid.API.filledRect(
        x, y, 20, 20, 
        { r: 1.0, g: 0.0, b: 0.0, a: 1.0 }
    );
    const enemy = Toxoid.API.getEntity(enemyEntityId);
    
    if (!enemy) return;
    
    enemy.add("Enemy");
    currentEnemies.push(enemy);
    
    console.log("[BulletHellTest] Spawned enemy at", x, y, "- Total enemies:", currentEnemies.length);
}

// ===== VERIFICATION =====

if (playerMoveSystem && bulletMoveSystem && enemyChaseSystem && gameUpdateSystem) {
    console.log("[BulletHellTest] ✅ All 4 bullet hell systems created successfully!");
    console.log("[BulletHellTest] Systems registered:");
    console.log("  - PlayerMovement: Handles player movement with arrow keys");
    console.log("  - BulletMovement: Moves bullets and handles off-screen cleanup");
    console.log("  - EnemyChase: Makes enemies follow the player");
    console.log("  - GameUpdate: Handles bullet/enemy spawning and game state");
    console.log("[BulletHellTest] Use arrow keys to move, bullets and enemies will spawn automatically");
    console.log("[BulletHellTest] Watch console for system update logs every few seconds");
} else {
    console.error("[BulletHellTest] ❌ Failed to create some systems:");
    console.error(`  - PlayerMovement: ${!!playerMoveSystem}`);
    console.error(`  - BulletMovement: ${!!bulletMoveSystem}`);
    console.error(`  - EnemyChase: ${!!enemyChaseSystem}`);
    console.error(`  - GameUpdate: ${!!gameUpdateSystem}`);
}

console.log("[BulletHellTest] Bullet hell test with system isolation fix initialized!");
console.log("[BulletHellTest] If all systems log updates regularly, the fix is working correctly");