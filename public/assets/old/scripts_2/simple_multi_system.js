// Simple Multi-System Test - Using Snake Game Pattern
// Tests multiple systems using the same pattern as the working snake game

console.log("[SimpleMulti] Starting simple multi-system test...");

// Game state - same pattern as snake game
let gameState = {
    testEntity: null,
    counter: 0
};

// Create a test entity
function initializeTestEntity() {
    console.log("[SimpleMulti] Creating test entity...");
    
    const entityId = Toxoid.API.filledRect(400, 300, 30, 30, { r: 0.0, g: 1.0, b: 0.0, a: 1.0 });
    const entity = Toxoid.API.getEntity(entityId);
    
    if (!entity) {
        console.error("[SimpleMulti] Failed to create test entity");
        return false;
    }
    
    entity.add("TestTag");
    entity.add("Velocity");
    
    const vel = entity.getComponent("Velocity");
    if (vel) {
        vel.x = 2;
        vel.y = 1;
    }
    
    gameState.testEntity = entity;
    console.log("[SimpleMulti] Test entity created successfully");
    return true;
}

// System 1: Movement (same pattern as snake)
function movementSystem(iter) {
    const entities = iter.entities();
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const pos = entity.getComponent("Position");
        const vel = entity.getComponent("Velocity");
        
        if (pos && vel) {
            pos.x += vel.x;
            pos.y += vel.y;
            
            // Bounce off edges
            if (pos.x > 780 || pos.x < 20) vel.x = -vel.x;
            if (pos.y > 580 || pos.y < 20) vel.y = -vel.y;
        }
    }
}

// System 2: Counter (separate logic)
function counterSystem(iter) {
    gameState.counter++;
    
    if (gameState.counter % 300 == 0) {
        console.log(`[SimpleMulti] Counter system tick: ${gameState.counter}`);
    }
}

// System 3: Color changer
function colorSystem(iter) {
    const entities = iter.entities();
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const color = entity.getComponent("Color");
        
        if (color) {
            const time = gameState.counter * 0.02;
            color.r = Math.sin(time) * 0.5 + 0.5;
            color.g = Math.cos(time) * 0.5 + 0.5;
            color.b = Math.sin(time + 1) * 0.5 + 0.5;
        }
    }
}

// Initialize test
function initializeTest() {
    console.log("[SimpleMulti] Initializing multi-system test...");
    
    // Create custom component (same as snake)
    Toxoid.API.createComponent("TestTag");
    console.log("[SimpleMulti] TestTag component created");
    
    try {
        // Register systems (same pattern as snake game)
        const system1 = Toxoid.System.create(
            "MovementTestSystem",
            "TestTag, Position, Velocity",
            Toxoid.Phases.ON_UPDATE,
            movementSystem
        );
        
        const system2 = Toxoid.System.create(
            "CounterTestSystem", 
            "TestTag",
            Toxoid.Phases.ON_UPDATE,
            counterSystem
        );
        
        const system3 = Toxoid.System.create(
            "ColorTestSystem",
            "TestTag, Color",
            Toxoid.Phases.ON_UPDATE,
            colorSystem
        );
        
        if (system1 && system2 && system3) {
            console.log("[SimpleMulti] ✅ All systems registered successfully");
            
            // Initialize test entity
            if (initializeTestEntity()) {
                console.log("[SimpleMulti] Test initialized! Watch the bouncing green square.");
            } else {
                console.error("[SimpleMulti] ❌ Failed to create test entity");
            }
        } else {
            console.error("[SimpleMulti] ❌ Failed to register systems:");
            console.error("  - MovementTestSystem:", !!system1);
            console.error("  - CounterTestSystem:", !!system2);
            console.error("  - ColorTestSystem:", !!system3);
        }
        
    } catch (error) {
        console.error("[SimpleMulti] ❌ Error initializing test:", error);
    }
}

// Auto-start the test
if (typeof Toxoid !== 'undefined') {
    initializeTest();
}