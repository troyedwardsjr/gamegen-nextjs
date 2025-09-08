// Test script for UI functionality verification
console.log("=== UI Test Script Started ===");

try {
    // Test different API calls to verify they work without errors
    console.log("Testing Entity Creation...");
    const testEntity = Toxoid.API.createEntity("UITestEntity");
    console.log("Created test entity:", testEntity);
    
    // Test camera manipulation
    console.log("Testing Camera API...");
    const currentCam = Toxoid.API.getCamera();
    console.log("Current camera state:", currentCam);
    
    // Test drawing primitives
    console.log("Testing Drawing API...");
    const circle = Toxoid.API.filledRect(10, 10, 50, 50, 0.5, 0.8);
    console.log("Drew test rectangle:", circle);
    
    // Test if we can access component data
    console.log("Testing Component System...");
    const entityInfo = Toxoid.API.getEntity(testEntity);
    console.log("Entity information:", entityInfo);
    
    console.log("=== UI Test Script Completed Successfully ===");
    
} catch (error) {
    console.log("ERROR in UI test script:", error);
    console.log("Error type:", typeof error);
    console.log("Error string:", String(error));
}