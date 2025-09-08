// Test Multiple Systems Fix
// This script tests if the system isolation fix resolves the bullet hell issues

console.log("[MultiSystemFix] Testing multiple system isolation fix...");

// Create test entities first
const testEntity1Id = Toxoid.API.filledRect(100, 100, 20, 20, { r: 1.0, g: 0.0, b: 0.0, a: 1.0 });
const testEntity1 = Toxoid.API.getEntity(testEntity1Id);

const testEntity2Id = Toxoid.API.filledRect(200, 200, 20, 20, { r: 0.0, g: 1.0, b: 0.0, a: 1.0 });
const testEntity2 = Toxoid.API.getEntity(testEntity2Id);

// Add components
testEntity1.add("Velocity");
testEntity2.add("Velocity");

// Set initial velocities
const vel1 = testEntity1.getComponent("Velocity");
if (vel1) {
    vel1.x = 1;
    vel1.y = 1;
}

const vel2 = testEntity2.getComponent("Velocity");
if (vel2) {
    vel2.x = -1;
    vel2.y = 2;
}

console.log("[MultiSystemFix] Created test entities with velocity components");

// System 1: Movement system
let moveSystemCallCount = 0;
const moveSystem = Toxoid.System.create("TestMovementSystem", "Position, Velocity", Toxoid.Phases.ON_UPDATE, function(iter) {
    moveSystemCallCount++;
    const entities = iter.entities();
    
    if (moveSystemCallCount % 60 === 0) { // Log every 60 calls (once per second)
        console.log(`[TestMovementSystem] Update ${moveSystemCallCount}: Processing ${entities.length} entities`);
    }
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = entity.getComponent("Position");
        const vel = entity.getComponent("Velocity");
        
        if (pos && vel) {
            // Move entity
            pos.x += vel.x;
            pos.y += vel.y;
            
            // Bounce off edges
            if (pos.x > 800 || pos.x < 0) vel.x = -vel.x;
            if (pos.y > 600 || pos.y < 0) vel.y = -vel.y;
        }
    }
});

// System 2: Color changing system  
let colorSystemCallCount = 0;
const colorSystem = Toxoid.System.create("TestColorSystem", "Position, Color", Toxoid.Phases.ON_UPDATE, function(iter) {
    colorSystemCallCount++;
    const entities = iter.entities();
    
    if (colorSystemCallCount % 60 === 0) { // Log every 60 calls
        console.log(`[TestColorSystem] Update ${colorSystemCallCount}: Processing ${entities.length} entities`);
    }
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = entity.getComponent("Position");
        const color = entity.getComponent("Color");
        
        if (pos && color) {
            // Change color based on position
            const time = Date.now() * 0.001;
            color.r = Math.sin(time + pos.x * 0.01) * 0.5 + 0.5;
            color.g = Math.cos(time + pos.y * 0.01) * 0.5 + 0.5;
            color.b = Math.sin(time * 2) * 0.5 + 0.5;
        }
    }
});

// System 3: Logging system (only on Position to test different queries)
let logSystemCallCount = 0;
const logSystem = Toxoid.System.create("TestLogSystem", "Position", Toxoid.Phases.ON_UPDATE, function(iter) {
    logSystemCallCount++;
    
    if (logSystemCallCount % 300 === 0) { // Log every 300 calls (every 5 seconds)
        const entities = iter.entities();
        console.log(`[TestLogSystem] Update ${logSystemCallCount}: Found ${entities.length} entities with Position component`);
        
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const pos = entity.getComponent("Position");
            if (pos) {
                console.log(`  Entity ${entity.__entity_id}: pos(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`);
            }
        }
    }
});

// Check if all systems were created
if (moveSystem && colorSystem && logSystem) {
    console.log("[MultiSystemFix] ✅ All 3 test systems created successfully!");
    console.log("[MultiSystemFix] Systems will be running every frame:");
    console.log("  - TestMovementSystem: Moves entities and handles bouncing");
    console.log("  - TestColorSystem: Changes entity colors based on position");
    console.log("  - TestLogSystem: Logs entity positions every 5 seconds");
    console.log("[MultiSystemFix] If you see regular log messages, the fix is working!");
} else {
    console.error("[MultiSystemFix] ❌ Failed to create systems:");
    console.error(`  - TestMovementSystem: ${!!moveSystem}`);
    console.error(`  - TestColorSystem: ${!!colorSystem}`);
    console.error(`  - TestLogSystem: ${!!logSystem}`);
}

console.log("[MultiSystemFix] Multiple systems test initialized!");
console.log("[MultiSystemFix] Watch the console for system update logs to confirm they're all running");