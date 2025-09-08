// Test Component Registration
console.log("[TestComp] Starting component registration test...");

try {
    console.log("[TestComp] Testing Toxoid.registerComponent function...");
    
    // Test basic component registration
    const testId = Toxoid.registerComponent("TestComponent");
    console.log("[TestComp] TestComponent registered with ID:", testId);
    
    if (testId === 0) {
        console.error("[TestComp] ❌ FAILED: TestComponent registration returned 0");
        throw new Error("Component registration failed");
    }
    
    // Test duplicate registration (should return same ID)
    const testId2 = Toxoid.registerComponent("TestComponent");
    console.log("[TestComp] TestComponent re-registered with ID:", testId2);
    
    if (testId !== testId2) {
        console.error("[TestComp] ❌ FAILED: Duplicate registration returned different ID");
        throw new Error("Duplicate registration mismatch");
    }
    
    // Test another component
    const secondId = Toxoid.registerComponent("AnotherTestComponent");
    console.log("[TestComp] AnotherTestComponent registered with ID:", secondId);
    
    if (secondId === 0) {
        console.error("[TestComp] ❌ FAILED: AnotherTestComponent registration returned 0");
        throw new Error("Second component registration failed");
    }
    
    console.log("[TestComp] ✅ SUCCESS: Component registration test passed!");
    
    // Now test system creation with the registered components
    console.log("[TestComp] Testing system creation with registered components...");
    
    try {
        Toxoid.System.create("TestSystem", "TestComponent, Position", 4, function(iter) {
            console.log("[TestComp] TestSystem running!");
        });
        console.log("[TestComp] ✅ SUCCESS: TestSystem created successfully!");
    } catch (e) {
        console.error("[TestComp] ❌ FAILED: TestSystem creation failed:", e);
        throw e;
    }
    
} catch (e) {
    console.error("[TestComp] ❌ CRITICAL ERROR:", e);
}

console.log("[TestComp] Component registration test complete.");