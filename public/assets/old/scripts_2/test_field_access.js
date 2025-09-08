// Test script to check field access

console.log("[FIELD_ACCESS] Starting field access test...");

// Create bullet
const bulletEntityId = Toxoid.API.filledRect(400, 300, 10, 10, { r: 1.0, g: 1.0, b: 0.0, a: 1.0 });
const bullet = Toxoid.API.getEntity(bulletEntityId);

if (bullet && bullet.add) {
    console.log("[FIELD_ACCESS] Created bullet entity with ID:", bulletEntityId);
    
    // Add components
    bullet.add("Bullet");
    bullet.add("Velocity");
    console.log("[FIELD_ACCESS] Added Bullet and Velocity components");
    
    // Test Velocity component access
    const vel = bullet.getComponent("Velocity");
    if (vel) {
        console.log("[FIELD_ACCESS] Got Velocity component, attempting to read fields...");
        console.log("[FIELD_ACCESS] vel.x before set:", vel.x);
        console.log("[FIELD_ACCESS] vel.y before set:", vel.y);
        
        // Try setting velocity
        console.log("[FIELD_ACCESS] Setting vel.x = 5.0...");
        vel.x = 5.0;
        console.log("[FIELD_ACCESS] Setting vel.y = 3.0...");
        vel.y = 3.0;
        
        console.log("[FIELD_ACCESS] vel.x after set:", vel.x);
        console.log("[FIELD_ACCESS] vel.y after set:", vel.y);
    } else {
        console.log("[FIELD_ACCESS] ERROR: Could not get Velocity component");
    }
    
    // Create a simple system to verify the values persist
    const verifySystem = Toxoid.System.create("VerifyFieldAccess", "Bullet, Velocity", 4, function(iter) {
        const entities = iter.entities();
        if (entities.length > 0) {
            console.log("[VerifyFieldAccess] Found", entities.length, "bullet entities");
            entities.forEach(entity => {
                const vel = entity.getComponent("Velocity");
                if (vel) {
                    console.log("[VerifyFieldAccess] Entity", entity.id, "velocity: (", vel.x, ",", vel.y, ")");
                }
            });
        }
    });
    console.log("[FIELD_ACCESS] Registered verification system");
    
} else {
    console.log("[FIELD_ACCESS] ERROR: Failed to create bullet entity");
}

console.log("[FIELD_ACCESS] Test complete");
