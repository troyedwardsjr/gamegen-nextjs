// Component Setter Test - Diagnose property setter issues
// This script tests if component property setters work correctly

console.log("[ComponentTest] Starting component setter diagnostics...");

// Create a test entity
const testEntityId = Toxoid.API.filledRect(400, 300, 30, 30, { r: 0.0, g: 1.0, b: 1.0, a: 1.0 });
const testEntity = Toxoid.API.getEntity(testEntityId);

if (!testEntity) {
    console.error("[ComponentTest] Failed to create test entity");
    throw new Error("Cannot create test entity");
}

console.log("[ComponentTest] Test entity created with ID:", testEntityId);

// Test Position component
console.log("\n=== TESTING POSITION COMPONENT ===");

const positionComponent = testEntity.getComponent("Position");
if (!positionComponent) {
    console.error("[ComponentTest] Position component not found");
} else {
    console.log("[ComponentTest] Position component found");
    console.log("[ComponentTest] Initial position:", {x: positionComponent.x, y: positionComponent.y});
    
    // Test available methods/properties
    console.log("[ComponentTest] Position component properties:");
    for (let prop in positionComponent) {
        console.log(`  ${prop}: ${typeof positionComponent[prop]} = ${positionComponent[prop]}`);
    }
    
    // Test property assignment (should trigger setter)
    console.log("\n--- Testing direct property assignment ---");
    const oldX = positionComponent.x;
    const oldY = positionComponent.y;
    
    console.log(`[ComponentTest] Setting x from ${oldX} to ${oldX + 100}`);
    positionComponent.x = oldX + 100;
    
    console.log(`[ComponentTest] Setting y from ${oldY} to ${oldY + 50}`);
    positionComponent.y = oldY + 50;
    
    // Read back the values
    const newPos = testEntity.getComponent("Position");
    console.log("[ComponentTest] Values after assignment:", {x: newPos.x, y: newPos.y});
    console.log("[ComponentTest] Expected:", {x: oldX + 100, y: oldY + 50});
    
    const xMatches = Math.abs(newPos.x - (oldX + 100)) < 0.01;
    const yMatches = Math.abs(newPos.y - (oldY + 50)) < 0.01;
    
    if (xMatches && yMatches) {
        console.log("[ComponentTest] ✅ Direct property assignment WORKS!");
    } else {
        console.log("[ComponentTest] ❌ Direct property assignment FAILED!");
        console.log(`[ComponentTest] X match: ${xMatches}, Y match: ${yMatches}`);
    }
    
    // Test setter methods if they exist
    console.log("\n--- Testing setter methods ---");
    if (typeof positionComponent.set_x === 'function' && typeof positionComponent.set_y === 'function') {
        console.log("[ComponentTest] Setter methods found - testing them");
        
        positionComponent.set_x(500);
        positionComponent.set_y(400);
        
        const afterSetters = testEntity.getComponent("Position");
        console.log("[ComponentTest] After setter methods:", {x: afterSetters.x, y: afterSetters.y});
        
        if (Math.abs(afterSetters.x - 500) < 0.01 && Math.abs(afterSetters.y - 400) < 0.01) {
            console.log("[ComponentTest] ✅ Setter methods WORK!");
        } else {
            console.log("[ComponentTest] ❌ Setter methods FAILED!");
        }
    } else {
        console.log("[ComponentTest] No setter methods found (set_x, set_y)");
    }
}

// Test Velocity component
console.log("\n=== TESTING VELOCITY COMPONENT ===");

// Add velocity component
const velocityAdded = testEntity.add("Velocity");
console.log("[ComponentTest] Velocity component added:", velocityAdded);

if (velocityAdded) {
    const velocityComponent = testEntity.getComponent("Velocity");
    if (velocityComponent) {
        console.log("[ComponentTest] Velocity component found");
        console.log("[ComponentTest] Initial velocity:", {x: velocityComponent.x, y: velocityComponent.y});
        
        // Test property assignment
        velocityComponent.x = 3.5;
        velocityComponent.y = -2.1;
        
        const newVel = testEntity.getComponent("Velocity");
        console.log("[ComponentTest] After velocity assignment:", {x: newVel.x, y: newVel.y});
        
        if (Math.abs(newVel.x - 3.5) < 0.01 && Math.abs(newVel.y + 2.1) < 0.01) {
            console.log("[ComponentTest] ✅ Velocity property assignment WORKS!");
        } else {
            console.log("[ComponentTest] ❌ Velocity property assignment FAILED!");
        }
    } else {
        console.log("[ComponentTest] ❌ Could not retrieve Velocity component after adding");
    }
}

// Test concurrent updates - the real issue
console.log("\n=== TESTING CONCURRENT POSITION/VELOCITY UPDATES ===");

const pos = testEntity.getComponent("Position");
const vel = testEntity.getComponent("Velocity");

if (pos && vel) {
    console.log("[ComponentTest] Before concurrent test:");
    console.log(`  Position: (${pos.x}, ${pos.y})`);
    console.log(`  Velocity: (${vel.x}, ${vel.y})`);
    
    // Update position first
    pos.x = 100;
    pos.y = 200;
    
    // Check if velocity was corrupted
    const velAfterPosUpdate = testEntity.getComponent("Velocity");
    console.log("[ComponentTest] After position update:");
    console.log(`  Velocity: (${velAfterPosUpdate.x}, ${velAfterPosUpdate.y})`);
    
    if (Math.abs(velAfterPosUpdate.x - 3.5) > 0.01 || Math.abs(velAfterPosUpdate.y + 2.1) > 0.01) {
        console.log("[ComponentTest] ❌ VELOCITY CORRUPTED after position update!");
        console.log(`[ComponentTest] Expected vel: (3.5, -2.1), Got: (${velAfterPosUpdate.x}, ${velAfterPosUpdate.y})`);
    } else {
        console.log("[ComponentTest] ✅ Velocity preserved after position update");
    }
    
    // Now update velocity
    vel.x = 7.7;
    vel.y = -8.8;
    
    // Check if position was corrupted
    const posAfterVelUpdate = testEntity.getComponent("Position");
    console.log("[ComponentTest] After velocity update:");
    console.log(`  Position: (${posAfterVelUpdate.x}, ${posAfterVelUpdate.y})`);
    
    if (Math.abs(posAfterVelUpdate.x - 100) > 0.01 || Math.abs(posAfterVelUpdate.y - 200) > 0.01) {
        console.log("[ComponentTest] ❌ POSITION CORRUPTED after velocity update!");
        console.log(`[ComponentTest] Expected pos: (100, 200), Got: (${posAfterVelUpdate.x}, ${posAfterVelUpdate.y})`);
    } else {
        console.log("[ComponentTest] ✅ Position preserved after velocity update");
    }
}

console.log("\n[ComponentTest] Component setter diagnostics complete.");
console.log("[ComponentTest] Watch for corruption patterns in the output above.");