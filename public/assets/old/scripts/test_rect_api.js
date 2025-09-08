// Test what rect functions are available
console.log("[Test] Testing Toxoid.API functions...");

if (typeof Toxoid !== 'undefined' && Toxoid.API) {
    console.log("[Test] Toxoid.API exists");
    console.log("[Test] Available functions:", Object.keys(Toxoid.API));
    
    // Try to call rect functions if they exist
    if (typeof Toxoid.API.filledRect === 'function') {
        console.log("[Test] filledRect function exists");
        
        try {
            // Test with color object
            const rectId = Toxoid.API.filledRect(100, 100, 50, 50, {r: 1.0, g: 0.0, b: 0.0, a: 1.0});
            console.log("[Test] filledRect with color object succeeded:", rectId);
        } catch (e) {
            console.log("[Test] filledRect with color object failed:", e.message);
        }
    } else {
        console.log("[Test] filledRect function does not exist");
    }
    
    if (typeof Toxoid.API.rect === 'function') {
        console.log("[Test] rect function exists");
    } else {
        console.log("[Test] rect function does not exist");
    }
    
    if (typeof Toxoid.API.filledRectRGBA === 'function') {
        console.log("[Test] filledRectRGBA function exists");
        
        try {
            // Test with individual parameters
            const rectId = Toxoid.API.filledRectRGBA(200, 200, 50, 50, {r: 0.0, g: 1.0, b: 0.0, a: 1.0});
            console.log("[Test] filledRectRGBA succeeded:", rectId);
        } catch (e) {
            console.log("[Test] filledRectRGBA failed:", e.message);
        }
    } else {
        console.log("[Test] filledRectRGBA function does not exist");
    }
} else {
    console.log("[Test] Toxoid.API not available");
}
