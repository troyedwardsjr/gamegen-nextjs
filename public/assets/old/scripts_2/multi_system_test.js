// Minimal Multi-System Test Script
// Tests whether multiple systems can coexist without interfering with each other

console.log("[MultiSystemTest] Starting multi-system test...");

// Create a simple test entity
const testEntityId = Toxoid.API.filledRect(100, 100, 20, 20, { r: 1.0, g: 0.0, b: 1.0, a: 1.0 });
const testEntity = Toxoid.API.getEntity(testEntityId);

// Add velocity component for testing
testEntity.add("Velocity");
const vel = testEntity.getComponent("Velocity");
if (vel) {
    vel.x = 1;
    vel.y = 0;
}

// System 1: Simple position movement
const system1 = Toxoid.System.create("TestSystem1", "Position, Velocity", Toxoid.Phases.ON_UPDATE, function(iter) {
    const entities = iter.entities();
    console.log(`[TestSystem1] Processing ${entities.length} entities`);
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = entity.getComponent("Position");
        const vel = entity.getComponent("Velocity");
        
        if (pos && vel) {
            pos.x += vel.x;
            pos.y += vel.y;
            console.log(`[TestSystem1] Entity ${entity.__entity_id} moved to (${pos.x}, ${pos.y})`);
        }
    }
});

// System 2: Boundary checking
const system2 = Toxoid.System.create("TestSystem2", "Position", Toxoid.Phases.ON_UPDATE, function(iter) {
    const entities = iter.entities();
    console.log(`[TestSystem2] Checking bounds for ${entities.length} entities`);
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = entity.getComponent("Position");
        
        if (pos) {
            if (pos.x > 800) {
                pos.x = 0;
                console.log(`[TestSystem2] Entity ${entity.__entity_id} wrapped X to 0`);
            }
            if (pos.y > 600) {
                pos.y = 0;
                console.log(`[TestSystem2] Entity ${entity.__entity_id} wrapped Y to 0`);
            }
        }
    }
});

// System 3: Color change based on position
const system3 = Toxoid.System.create("TestSystem3", "Position, Color", Toxoid.Phases.ON_UPDATE, function(iter) {
    const entities = iter.entities();
    console.log(`[TestSystem3] Processing color for ${entities.length} entities`);
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = entity.getComponent("Position");
        const color = entity.getComponent("Color");
        
        if (pos && color) {
            // Change color based on X position
            const redness = Math.sin(pos.x * 0.01) * 0.5 + 0.5;
            color.r = redness;
            color.g = 1.0 - redness;
            console.log(`[TestSystem3] Entity ${entity.__entity_id} color changed to (${color.r.toFixed(2)}, ${color.g.toFixed(2)}, ${color.b.toFixed(2)})`);
        }
    }
});

console.log("[MultiSystemTest] Created 3 test systems:");
console.log("  - TestSystem1: Movement");
console.log("  - TestSystem2: Boundary checking");
console.log("  - TestSystem3: Color changes");

// Check if systems were created successfully
if (system1 && system2 && system3) {
    console.log("[MultiSystemTest] ✅ All systems created successfully");
} else {
    console.error("[MultiSystemTest] ❌ Some systems failed to create:");
    console.error("  - System1:", !!system1);
    console.error("  - System2:", !!system2);
    console.error("  - System3:", !!system3);
}