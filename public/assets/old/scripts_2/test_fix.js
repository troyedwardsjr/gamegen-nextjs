// Quick test to validate the Position update fix
console.log("[TEST] Testing Position component updates...");

// Create a test entity
const testEntityId = Toxoid.API.filledRect(100, 100, 20, 20, { r: 1.0, g: 0.0, b: 1.0, a: 1.0 });
const testEntity = Toxoid.API.getEntity(testEntityId);

if (testEntity) {
    console.log("[TEST] Created test entity:", testEntityId);
    
    // Get initial position
    const initialPos = testEntity.getComponent("Position");
    console.log("[TEST] Initial position:", initialPos.x, initialPos.y);
    
    // Update position
    const updateResult = testEntity.setComponent("Position", { x: 200, y: 250 });
    console.log("[TEST] Update result:", updateResult);
    
    // Check if it actually moved
    const newPos = testEntity.getComponent("Position");
    console.log("[TEST] New position:", newPos.x, newPos.y);
    
    if (newPos.x === 200 && newPos.y === 250) {
        console.log("[TEST] ✅ SUCCESS! Position updates are working!");
    } else {
        console.log("[TEST] ❌ FAILED! Position didn't update correctly.");
    }
} else {
    console.log("[TEST] ❌ Failed to create test entity");
}