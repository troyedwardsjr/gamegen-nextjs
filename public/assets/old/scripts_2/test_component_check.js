// Test script to check what components an entity actually has

console.log("[COMPONENT_CHECK] Starting component check...");

// Create bullet
const bulletEntityId = Toxoid.API.filledRect(400, 300, 10, 10, { r: 1.0, g: 1.0, b: 0.0, a: 1.0 });
const bullet = Toxoid.API.getEntity(bulletEntityId);

if (bullet && bullet.add) {
    console.log("[COMPONENT_CHECK] Created bullet entity with ID:", bulletEntityId);
    
    // Check initial components
    console.log("[COMPONENT_CHECK] Initial Position component:", bullet.getComponent("Position") ? "EXISTS" : "MISSING");
    console.log("[COMPONENT_CHECK] Initial Velocity component:", bullet.getComponent("Velocity") ? "EXISTS" : "MISSING");
    console.log("[COMPONENT_CHECK] Initial Bullet component:", bullet.getComponent("Bullet") ? "EXISTS" : "MISSING");
    
    // Add Bullet component
    bullet.add("Bullet");
    console.log("[COMPONENT_CHECK] Added Bullet component");
    
    // Check after Bullet added
    console.log("[COMPONENT_CHECK] After Bullet - Position component:", bullet.getComponent("Position") ? "EXISTS" : "MISSING");
    console.log("[COMPONENT_CHECK] After Bullet - Velocity component:", bullet.getComponent("Velocity") ? "EXISTS" : "MISSING");
    console.log("[COMPONENT_CHECK] After Bullet - Bullet component:", bullet.getComponent("Bullet") ? "EXISTS" : "MISSING");
    
    // Add Velocity component
    bullet.add("Velocity");
    console.log("[COMPONENT_CHECK] Added Velocity component");
    
    // Check final state
    console.log("[COMPONENT_CHECK] Final Position component:", bullet.getComponent("Position") ? "EXISTS" : "MISSING");
    console.log("[COMPONENT_CHECK] Final Velocity component:", bullet.getComponent("Velocity") ? "EXISTS" : "MISSING");
    console.log("[COMPONENT_CHECK] Final Bullet component:", bullet.getComponent("Bullet") ? "EXISTS" : "MISSING");
    
    // Create systems to check what the queries find
    const diagSystem = Toxoid.System.create("DiagnosticSystem", "Position", 4, function(iter) {
        const entities = iter.entities();
        console.log("[DiagnosticSystem] Position query found", entities.length, "entities");
    });
    
    const diagSystem2 = Toxoid.System.create("DiagnosticSystem2", "Position, Velocity", 4, function(iter) {
        const entities = iter.entities();
        console.log("[DiagnosticSystem2] Position+Velocity query found", entities.length, "entities");
    });
    
    const diagSystem3 = Toxoid.System.create("DiagnosticSystem3", "Bullet, Position, Velocity", 4, function(iter) {
        const entities = iter.entities();
        console.log("[DiagnosticSystem3] Bullet+Position+Velocity query found", entities.length, "entities");
    });
    
} else {
    console.log("[COMPONENT_CHECK] Failed to create bullet entity");
}

console.log("[COMPONENT_CHECK] Test complete");

