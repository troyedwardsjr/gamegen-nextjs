// Test script to verify API fixes
console.log("[TEST] Starting fix validation...");

// Test 1: Register components (should work)
console.log("[TEST] 1. Testing component registration...");
try {
    const bulletHellPlayerId = Toxoid.registerComponent("BulletHellPlayer");
    console.log("[TEST] ✓ BulletHellPlayer registered with ID:", bulletHellPlayerId);
} catch (e) {
    console.error("[TEST] ✗ Component registration failed:", e);
}

// Test 2: Create entity with Position (built-in component)
console.log("[TEST] 2. Testing entity creation with built-in Position component...");
try {
    const entityId = Toxoid.API.filledRect(100, 100, 50, 50, { r: 1.0, g: 0.0, b: 0.0, a: 1.0 });
    console.log("[TEST] ✓ Entity created with ID:", entityId);
    
    // Test 3: Get the entity and check if getComponent works with Position
    const entity = Toxoid.API.getEntity(entityId);
    if (entity) {
        console.log("[TEST] 3. Testing getComponent on built-in Position...");
        const pos = entity.getComponent("Position");
        console.log("[TEST] Position component data:", pos);
        if (pos && pos.x !== undefined && pos.y !== undefined) {
            console.log("[TEST] ✓ getComponent works! Position:", pos.x, pos.y);
        } else {
            console.error("[TEST] ✗ getComponent returned null or invalid data");
        }
        
        // Test 4: Test setComponent (should work now)
        console.log("[TEST] 4. Testing setComponent...");
        try {
            const result = entity.setComponent("Position", { x: 200, y: 200 });
            console.log("[TEST] setComponent result:", result);
            
            // Verify the change
            const newPos = entity.getComponent("Position");
            console.log("[TEST] Position after setComponent:", newPos);
            if (newPos && newPos.x === 200 && newPos.y === 200) {
                console.log("[TEST] ✓ setComponent works! New position:", newPos.x, newPos.y);
            } else {
                console.error("[TEST] ✗ setComponent failed or didn't update properly");
            }
        } catch (e) {
            console.error("[TEST] ✗ setComponent failed:", e);
        }
    } else {
        console.error("[TEST] ✗ Could not get entity");
    }
    
    // Test 5: Query for entities with custom component and built-in Position
    console.log("[TEST] 5. Testing query with mixed components...");
    entity.add("BulletHellPlayer");
    
    // Query using the host ECS function
    if (typeof Toxoid.__queryHostECS === 'function') {
        const results = Toxoid.__queryHostECS("BulletHellPlayer, Position");
        console.log("[TEST] Query 'BulletHellPlayer, Position' found:", results.length, "entities");
        if (results.length > 0) {
            console.log("[TEST] ✓ Query with mixed components works!");
            console.log("[TEST] Found entity IDs:", results);
        } else {
            console.error("[TEST] ✗ Query found 0 entities");
        }
    } else {
        console.error("[TEST] ✗ __queryHostECS function not available");
    }
    
} catch (e) {
    console.error("[TEST] ✗ Entity creation failed:", e);
}

console.log("[TEST] Fix validation completed!");