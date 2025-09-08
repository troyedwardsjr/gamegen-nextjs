// Test script to check if Toxoid.Entity.fromId works
console.log("=== Testing Toxoid.Entity.fromId ===");

console.log("Toxoid exists?", typeof Toxoid);
console.log("Toxoid.Entity exists?", typeof Toxoid?.Entity);
console.log("Toxoid.Entity.fromId exists?", typeof Toxoid?.Entity?.fromId);
console.log("globalThis.__ToxoidEntity exists?", typeof globalThis.__ToxoidEntity);

if (typeof Toxoid?.Entity?.fromId === 'function') {
    console.log("Testing Toxoid.Entity.fromId(123)...");
    
    // Test step by step
    console.log("Step 1: Testing simple entity constructor");
    try {
        const entity = new globalThis.__ToxoidEntity("test_entity");
        console.log("  Constructor SUCCESS");
    } catch (e) {
        console.log("  Constructor FAILED:", e);
    }
    
    console.log("Step 2: Testing fromId method");
    try {
        const entity = Toxoid.Entity.fromId(123);
        console.log("SUCCESS - entity:", entity);
        console.log("entity type:", typeof entity);
        console.log("entity.id:", entity.id);
        console.log("entity.__entity_id:", entity.__entity_id);
    } catch (e) {
        console.log("FAILED - error:", e);
        console.log("Error type:", typeof e);
        console.log("Error message:", e?.message);
        console.log("Error stack:", e?.stack);
    }
} else {
    console.log("Toxoid.Entity.fromId is not available!");
}

console.log("=== Test Complete ===");
