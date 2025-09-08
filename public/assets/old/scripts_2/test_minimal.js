// Minimal test script to debug segfault
console.log("[Test] Starting minimal test...");

try {
    console.log("[Test] Step 1: Creating a simple component...");
    const testId = Toxoid.API.createComponent("TestComponent");
    console.log("[Test] TestComponent ID:", testId);
    
    if (testId > 0) {
        console.log("[Test] Step 2: Creating a simple rect...");
        const entityId = Toxoid.API.filledRect(100, 100, 20, 20, { r: 1.0, g: 0.0, b: 0.0, a: 1.0 });
        console.log("[Test] Entity ID:", entityId);
        
        if (entityId > 0) {
            console.log("[Test] Step 3: Getting entity wrapper...");
            const entity = Toxoid.API.getEntity(entityId);
            console.log("[Test] Entity wrapper:", entity ? "OK" : "FAILED");
            
            if (entity) {
                console.log("[Test] Step 4: Adding component...");
                const result = entity.add("TestComponent");
                console.log("[Test] Add result:", result);
                console.log("[Test] ✓ Minimal test completed successfully!");
            }
        }
    }
} catch(e) {
    console.error("[Test] ✗ Error in minimal test:", e);
}
