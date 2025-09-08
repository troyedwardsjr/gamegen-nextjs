// Sandbox Mode Test Script
// This script tests basic QuickJS runtime functionality in sandbox mode

console.log("========================================");
console.log("🧪 Sandbox Mode Test Script Starting");
console.log("========================================");

// Test 1: Basic console functionality
console.log("✓ Test 1: Console logging works");

// Test 2: Check if Toxoid API is available
if (typeof Toxoid !== 'undefined') {
    console.log("✓ Test 2: Toxoid API is available");
    
    // Test 3: Check Toxoid version/methods
    if (typeof Toxoid.version === 'function') {
        try {
            const version = Toxoid.version();
            console.log("✓ Test 3: Toxoid version:", version);
        } catch (e) {
            console.log("❌ Test 3: Failed to get Toxoid version:", e);
        }
    } else {
        console.log("⚠️  Test 3: Toxoid.version() method not available");
    }
    
    // Test 4: Entity creation
    try {
        const testEntity = new Toxoid.Entity("SandboxTestEntity");
        if (testEntity) {
            console.log("✓ Test 4: Entity creation successful. ID:", testEntity.getId());
            
            // Test 5: Component addition
            try {
                testEntity.add("Position");
                console.log("✓ Test 5: Component addition successful");
                
                // Test 6: Component access
                const position = testEntity.getComponent("Position");
                if (position) {
                    console.log("✓ Test 6: Component retrieval successful");
                } else {
                    console.log("❌ Test 6: Component retrieval failed");
                }
            } catch (e) {
                console.log("❌ Test 5/6: Component operations failed:", e);
            }
        } else {
            console.log("❌ Test 4: Entity creation failed");
        }
    } catch (e) {
        console.log("❌ Test 4: Entity creation failed:", e);
    }
    
} else {
    console.log("❌ Test 2: Toxoid API is NOT available");
    console.log("This could indicate QuickJS runtime initialization issues");
}

// Test 7: Basic JavaScript functionality
try {
    const testArray = [1, 2, 3];
    const doubled = testArray.map(x => x * 2);
    console.log("✓ Test 7: Basic JavaScript functionality works:", doubled);
} catch (e) {
    console.log("❌ Test 7: Basic JavaScript failed:", e);
}

// Test 8: Global scope test
globalThis.sandboxTestPassed = true;
console.log("✓ Test 8: Global scope access works");

console.log("========================================");
console.log("🧪 Sandbox Mode Test Script Complete");
console.log("========================================");