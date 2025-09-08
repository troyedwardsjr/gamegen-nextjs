// Debug script to understand position update issues

console.log("[DEBUG] Starting position update debugging...");

// Test 1: Direct position updates
console.log("=== TEST 1: Direct Position Updates ===");

function testDirectPositionUpdate() {
    console.log("[TEST1] Creating test entity with direct API...");
    
    // Create a simple red rectangle
    const entityId = Toxoid.API.filledRect(100, 100, 30, 30, { r: 1.0, g: 0.0, b: 0.0, a: 1.0 });
    const entity = Toxoid.API.getEntity(entityId);
    
    if (!entity) {
        console.error("[TEST1] Failed to create test entity");
        return;
    }
    
    console.log(`[TEST1] Created entity ${entityId}`);
    
    // Get initial position
    const initialPos = entity.getComponent("Position");
    console.log(`[TEST1] Initial position: (${initialPos ? initialPos.x : "null"}, ${initialPos ? initialPos.y : "null"})`);
    
    let moveCounter = 0;
    
    // Create a simple system that moves this entity every frame
    const testSystem = Toxoid.System.create("DirectPositionTest", "Position", 4, function(iter) {
        const entities = iter.entities();
        
        for (let i = 0; i < entities.length; i++) {
            const ent = entities[i];
            
            // Only move our test entity
            if (ent.getId() !== entityId) continue;
            
            const pos = ent.getComponent("Position");
            if (!pos) continue;
            
            moveCounter++;
            
            // Move in a circle
            const angle = moveCounter * 0.05;
            const newX = 400 + Math.cos(angle) * 100;
            const newY = 300 + Math.sin(angle) * 100;
            
            console.log(`[TEST1] Frame ${moveCounter}: Moving entity ${entityId} to (${newX}, ${newY})`);
            
            const success = ent.setComponent("Position", { x: newX, y: newY });
            
            if (success) {
                console.log(`[TEST1] ✓ Update successful`);
                
                // Verify immediately
                const verifyPos = ent.getComponent("Position");
                console.log(`[TEST1] Verification: position is now (${verifyPos.x}, ${verifyPos.y})`);
                
                // Check using direct host ECS query
                if (typeof Toxoid.__queryHostECS === 'function') {
                    const hostEntities = Toxoid.__queryHostECS("Position");
                    if (hostEntities && hostEntities.includes(entityId)) {
                        console.log(`[TEST1] Entity ${entityId} found in host ECS with Position`);
                    } else {
                        console.warn(`[TEST1] Entity ${entityId} NOT found in host ECS Position query`);
                    }
                }
                
            } else {
                console.error(`[TEST1] ✗ Update failed`);
            }
            
            // Stop after 100 moves to avoid spam
            if (moveCounter >= 100) {
                console.log("[TEST1] Test complete - disabling system");
                Toxoid.System.disable(testSystem);
            }
            
            break; // Only process our one entity
        }
    });
    
    console.log(`[TEST1] Created movement system: ${Toxoid.System.getId(testSystem)}`);
}

// Test 2: Component update verification
console.log("=== TEST 2: Component Update Verification ===");

function testComponentUpdatePath() {
    console.log("[TEST2] Testing component update path...");
    
    // Create entity using the same method as bullet_hell.js
    const entityId = Toxoid.API.filledRect(200, 200, 20, 20, { r: 0.0, g: 0.0, b: 1.0, a: 1.0 });
    const entity = Toxoid.API.getEntity(entityId);
    
    if (!entity) {
        console.error("[TEST2] Failed to create test entity");
        return;
    }
    
    console.log(`[TEST2] Created entity ${entityId}`);
    
    // Test manual position update using the lower-level API
    console.log("[TEST2] Testing manual position update...");
    
    const initialPos = entity.getComponent("Position");
    console.log(`[TEST2] Initial position: (${initialPos.x}, ${initialPos.y})`);
    
    // Try updating using the lower-level updateComponent function
    console.log("[TEST2] Updating X coordinate using updateComponent...");
    const xUpdateSuccess = Toxoid.updateComponent(entityId, "Position", "x", 250);
    console.log(`[TEST2] X update result: ${xUpdateSuccess}`);
    
    console.log("[TEST2] Updating Y coordinate using updateComponent...");
    const yUpdateSuccess = Toxoid.updateComponent(entityId, "Position", "y", 150);
    console.log(`[TEST2] Y update result: ${yUpdateSuccess}`);
    
    // Verify the update
    const updatedPos = entity.getComponent("Position");
    console.log(`[TEST2] Updated position: (${updatedPos.x}, ${updatedPos.y})`);
    
    if (updatedPos.x === 250 && updatedPos.y === 150) {
        console.log("[TEST2] ✓ Manual update successful");
    } else {
        console.error("[TEST2] ✗ Manual update failed");
    }
}

// Test 3: Rendering system investigation
console.log("=== TEST 3: Rendering System Investigation ===");

function investigateRenderingPipeline() {
    console.log("[TEST3] Investigating rendering pipeline...");
    
    // Query all entities with Position and log their details
    if (typeof Toxoid.__queryHostECS === 'function') {
        console.log("[TEST3] Querying all Position entities from host ECS...");
        const positionEntities = Toxoid.__queryHostECS("Position");
        console.log(`[TEST3] Found ${positionEntities ? positionEntities.length : 0} entities with Position`);
        
        if (positionEntities && positionEntities.length > 0) {
            console.log("[TEST3] Position entity IDs:", positionEntities);
            
            // Check the first few entities
            for (let i = 0; i < Math.min(5, positionEntities.length); i++) {
                const entityId = positionEntities[i];
                const entity = Toxoid.API.getEntity(entityId);
                
                if (entity) {
                    const pos = entity.getComponent("Position");
                    console.log(`[TEST3] Entity ${entityId} position: (${pos ? pos.x : "null"}, ${pos ? pos.y : "null"})`);
                } else {
                    console.warn(`[TEST3] Could not get entity wrapper for ID ${entityId}`);
                }
            }
        }
        
        // Check for Renderable components
        const renderableEntities = Toxoid.__queryHostECS("Renderable");
        console.log(`[TEST3] Found ${renderableEntities ? renderableEntities.length : 0} entities with Renderable`);
        
        // Check for Sprite components
        const spriteEntities = Toxoid.__queryHostECS("Sprite");
        console.log(`[TEST3] Found ${spriteEntities ? spriteEntities.length : 0} entities with Sprite`);
        
        // Check for FilledRect components (if they exist)
        const rectEntities = Toxoid.__queryHostECS("FilledRect");
        console.log(`[TEST3] Found ${rectEntities ? rectEntities.length : 0} entities with FilledRect`);
    } else {
        console.error("[TEST3] __queryHostECS not available");
    }
}

// Run all tests
console.log("[DEBUG] Running all tests...");

testDirectPositionUpdate();
testComponentUpdatePath();
investigateRenderingPipeline();

console.log("[DEBUG] All tests started. Check console for results over the next few seconds.");