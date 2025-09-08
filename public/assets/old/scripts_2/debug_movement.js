// Ultra-simple debug script to test if setComponent actually updates positions
console.log("[DEBUG] Movement Test Starting...");

try {
    // Create a single red rectangle
    console.log("[DEBUG] Creating rectangle...");
    const rectId = Toxoid.API.filledRect(100, 100, 50, 50, { r: 1.0, g: 0.0, b: 0.0, a: 1.0 });
    console.log("[DEBUG] Created rectangle with ID:", rectId);
    
    if (!rectId) {
        throw new Error("Failed to create rectangle");
    }
    
    const entity = Toxoid.API.getEntity(rectId);
    if (!entity) {
        throw new Error("Failed to get entity from rectangle ID");
    }
    
    console.log("[DEBUG] Got entity:", entity.getId());
    
    // Check its initial position
    const initialPos = entity.getComponent("Position");
    console.log("[DEBUG] Initial position:", initialPos);
    
    if (!initialPos) {
        throw new Error("Entity has no Position component!");
    }
    
    // Create a system that moves this one rectangle
    Toxoid.System.create("SimpleMove", "Position", 4, function(iter) {
        console.log("[DEBUG] SimpleMove system running");
        
        const entities = iter.entities();
        console.log("[DEBUG] Found", entities.length, "entities with Position component");
        
        for (let i = 0; i < entities.length; i++) {
            const ent = entities[i];
            const id = ent.getId();
            console.log("[DEBUG] Processing entity ID:", id);
            
            if (id === rectId) {
                console.log("[DEBUG] Found our rectangle! Moving it...");
                
                const pos = ent.getComponent("Position");
                if (pos) {
                    const newX = pos.x + 1;
                    const newY = pos.y + 1;
                    
                    console.log("[DEBUG] Current position:", pos.x, pos.y);
                    console.log("[DEBUG] New position:", newX, newY);
                    
                    const success = ent.setComponent("Position", { x: newX, y: newY });
                    console.log("[DEBUG] setComponent success:", success);
                    
                    // Verify the change
                    const verifyPos = ent.getComponent("Position");
                    if (verifyPos) {
                        console.log("[DEBUG] Verified position:", verifyPos.x, verifyPos.y);
                        if (verifyPos.x === newX && verifyPos.y === newY) {
                            console.log("[DEBUG] ✅ Position update successful!");
                        } else {
                            console.log("[DEBUG] ❌ Position update failed!");
                        }
                    } else {
                        console.log("[DEBUG] ❌ Could not verify position!");
                    }
                } else {
                    console.log("[DEBUG] ❌ Entity has no Position component in system!");
                }
            }
        }
    });
    
    console.log("[DEBUG] Movement system created. Watch the rectangle - it should move down and right slowly.");
    
} catch (error) {
    console.error("[DEBUG] Error:", error);
}

console.log("[DEBUG] Movement Test Setup Complete");