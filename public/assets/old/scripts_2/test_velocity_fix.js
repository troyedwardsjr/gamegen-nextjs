// Test script to fix velocity setting timing issue

console.log("[VELOCITY_TEST] Starting velocity test...");

// Create components
const bulletId = Toxoid.API.createComponent("Bullet");

// Create bullet
const bulletEntityId = Toxoid.API.filledRect(400, 300, 10, 10, { r: 1.0, g: 1.0, b: 0.0, a: 1.0 });
const bullet = Toxoid.API.getEntity(bulletEntityId);

if (bullet && bullet.add) {
    // Add Bullet component first
    bullet.add("Bullet");
    console.log("[VELOCITY_TEST] Added Bullet component");
    
    // Add Velocity component
    bullet.add("Velocity");
    console.log("[VELOCITY_TEST] Added Velocity component");
    
    // Instead of setting fields immediately, let's create a system that sets velocity
    // This ensures the component is fully initialized before we try to set fields
    
    // Register the velocity initialization system to run once
    const velocityInitSystem = Toxoid.System.create("VelocityInit", "Bullet, Position, Velocity", 4, function(iter) {
        const entities = iter.entities();
        console.log("[VelocityInit] Processing", entities.length, "bullet entities for velocity initialization");
        entities.forEach(entity => {
            const vel = entity.getComponent("Velocity");
            if (vel) {
                console.log("[VelocityInit] Setting velocity for entity", entity.id);
                vel.x = 5.0;  // Set bullet velocity
                vel.y = 3.0;
                console.log("[VelocityInit] Velocity set to:", vel.x, vel.y);
            } else {
                console.log("[VelocityInit] No velocity component found for entity", entity.id);
            }
        });
    });
    
    // Create movement system
    const bulletMoveSystem = Toxoid.System.create("BulletMove", "Bullet, Position, Velocity", 4, function(iter) {
        const entities = iter.entities();
        if (entities.length > 0) {
            console.log("[BulletMove] Processing", entities.length, "bullet entities");
            entities.forEach(entity => {
                const pos = entity.getComponent("Position");
                const vel = entity.getComponent("Velocity");
                
                if (pos && vel) {
                    console.log("[BulletMove] Entity", entity.id, "before move: pos=(", pos.x, ",", pos.y, ") vel=(", vel.x, ",", vel.y, ")");
                    
                    // Move bullet
                    pos.x += vel.x;
                    pos.y += vel.y;
                    
                    console.log("[BulletMove] Entity", entity.id, "after move: pos=(", pos.x, ",", pos.y, ")");
                }
            });
        }
    });
    
    console.log("[VELOCITY_TEST] Systems registered, bullet should start moving soon...");
    
} else {
    console.log("[VELOCITY_TEST] Failed to create bullet entity");
}

console.log("[VELOCITY_TEST] Test script complete");

