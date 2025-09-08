// Simple test script to verify bullet movement and proxy field access

console.log("[TEST] Starting bullet movement test...");

// Create components
const bulletId = Toxoid.API.createComponent("Bullet");
console.log("[TEST] Bullet component ID:", bulletId);

// Create a single bullet entity for testing
console.log("[TEST] Creating test bullet...");
const bulletEntityId = Toxoid.API.filledRect(400, 300, 10, 10, { r: 1.0, g: 1.0, b: 0.0, a: 1.0 });
const bullet = Toxoid.API.getEntity(bulletEntityId);

if (bullet && bullet.add) {
    // Add required components
    bullet.add("Bullet");
    bullet.add("Velocity");
    
    console.log("[TEST] Components added to bullet", bulletEntityId);
    
    // Test velocity setting and reading
    const vel = bullet.getComponent("Velocity");
    if (vel) {
        console.log("[TEST] Got velocity component, setting values...");
        vel.x = 3.0;
        vel.y = 2.0;
        
        // Read back immediately
        console.log("[TEST] Velocity set, reading back: x =", vel.x, "y =", vel.y);
        
        // Create bullet movement system
        Toxoid.System.create("TestBulletMove", "Bullet, Position, Velocity", 4, function(iter) {
            const entities = iter.entities();
            console.log("[TestBulletMove] Processing", entities.length, "bullet entities");
            
            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i];
                const position = entity.getComponent("Position");
                const velocity = entity.getComponent("Velocity");
                
                if (position && velocity) {
                    console.log("[TestBulletMove] Bullet", entity.getId(), "at position (", position.x, ",", position.y, ") with velocity (", velocity.x, ",", velocity.y, ")");
                    
                    // Move bullet
                    position.x += velocity.x;
                    position.y += velocity.y;
                    
                    console.log("[TestBulletMove] Bullet moved to (", position.x, ",", position.y, ")");
                } else {
                    console.log("[TestBulletMove] Bullet", entity.getId(), "missing components - pos:", !!position, "vel:", !!velocity);
                }
            }
        });
        
        console.log("[TEST] Bullet movement system created");
        
    } else {
        console.error("[TEST] Failed to get Velocity component");
    }
} else {
    console.error("[TEST] Failed to create bullet entity or add() not available");
}

console.log("[TEST] Test setup complete");
