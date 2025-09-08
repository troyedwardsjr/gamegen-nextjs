/**
 * Simple API Test Script
 * Tests the simplified component schema API
 */

console.log("[API Test] Starting simplified API test...");

// Test 1: Simple singleton registration with TypeScript-like types
console.log("[API Test] Test 1: Registering singleton with simplified API...");
const TestGameState = Toxoid.API.registerSingleton("TestGameState", [
    { name: "score", type: "number" },
    { name: "lives", type: "number" },
    { name: "game_over", type: "boolean" },
    { name: "player_name", type: "string" }
]);

console.log("[API Test] ✓ TestGameState singleton registered:", TestGameState ? "SUCCESS" : "FAILED");

// Test 2: Regular component registration with simplified API
console.log("[API Test] Test 2: Registering component with simplified API...");
Toxoid.registerComponent("TestPlayer", [
    { name: "health", type: "number" },
    { name: "mana", type: "number" },
    { name: "level", type: "number" },
    { name: "is_alive", type: "boolean" },
    { name: "entity_id", type: "entity" }
]);

console.log("[API Test] ✓ TestPlayer component registered");

// Test 3: Advanced types (u32, f32, etc.)
console.log("[API Test] Test 3: Testing advanced types...");
Toxoid.registerComponent("TestAdvanced", [
    { name: "counter", type: "u32" },
    { name: "precise_value", type: "f32" },
    { name: "big_number", type: "u64" }
]);

console.log("[API Test] ✓ TestAdvanced component with specific types registered");

// Test 4: Tag component (no data)
console.log("[API Test] Test 4: Testing tag component...");
Toxoid.registerComponent("TestTag");

console.log("[API Test] ✓ TestTag component registered");

// Test 5: Initialize and test singleton access
console.log("[API Test] Test 5: Testing singleton access...");
if (TestGameState) {
    try {
        TestGameState.score = 100;
        TestGameState.lives = 3;
        TestGameState.game_over = false;
        TestGameState.player_name = "TestPlayer";
        
        console.log("[API Test] ✓ Singleton values set successfully");
        console.log("[API Test]   - Score:", TestGameState.score);
        console.log("[API Test]   - Lives:", TestGameState.lives);
        console.log("[API Test]   - Game Over:", TestGameState.game_over);
        console.log("[API Test]   - Player Name:", TestGameState.player_name);
    } catch (error) {
        console.error("[API Test] ✗ Error accessing singleton:", error);
    }
} else {
    console.error("[API Test] ✗ TestGameState singleton is null/undefined");
}

console.log("[API Test] ✅ Simplified API test completed!");