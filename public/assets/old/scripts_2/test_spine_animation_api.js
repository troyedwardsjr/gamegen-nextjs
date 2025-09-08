// Test script for Spine Animation API functions
// 
// API Notes:
// - loadSpineAnimation(atlasPath, skeletonPath, textureName, renderedOnLoad, [callback])
//   Creates a spine animation prefab entity
//   Optional callback is invoked when the resource is loaded
// - createSpineAnimation(atlasPath, skeletonPath, textureName)  
//   Creates an instance from an existing prefab
//
// Callback Support:
// - Load functions now support optional callbacks for async loading
// - Callbacks are stored in a global registry to bypass Rust lifetime constraints
// - If no callback provided, functions work synchronously
//
console.log("[Test] Testing Spine Animation API...");

// Wait for Toxoid to be available
function waitForToxoid() {
    if (typeof Toxoid !== 'undefined' && Toxoid.API) {
        runSpineAnimationTests();
    } else {
        console.log("[Test] Waiting for Toxoid to be available...");
        setTimeout(waitForToxoid, 100);
    }
}

function runSpineAnimationTests() {
    try {
        // Test 1: Check if the API functions exist
        if (typeof Toxoid !== 'undefined' && Toxoid.API) {
        console.log("[Test] ✓ Toxoid.API exists");
        
        // Check for spine animation functions
        if (typeof Toxoid.API.loadSpineAnimation === 'function') {
            console.log("[Test] ✓ loadSpineAnimation function available");
        } else {
            console.log("[Test] ✗ loadSpineAnimation function missing");
        }
        
        if (typeof Toxoid.API.createSpineAnimation === 'function') {
            console.log("[Test] ✓ createSpineAnimation function available");
        } else {
            console.log("[Test] ✗ createSpineAnimation function missing");
        }
        
    } else {
        console.log("[Test] ✗ Toxoid.API not found");
        console.log("[Test] Waiting for Toxoid to be available...");
        // Don't return, just continue and let the script handle the case gracefully
    }
    
    // Test 2: Test loading a spine animation prefab
    console.log("[Test] Testing loadSpineAnimation...");
    
    // Use actual existing spine animation files
    const atlasPath = "assets/animations/character/character.atlas";
    const skeletonPath = "assets/animations/character/character.json";
    const textureName = "character";  // This matches the texture name in the atlas file
    
    // NOTE: The load functions now support optional callbacks for async loading
    // The callback will be invoked when the resource is loaded
    // If no callback is provided, the function works synchronously
    
    try {
        // Test with callback (async pattern)
        console.log("[Test] Testing loadSpineAnimation with callback...");
        Toxoid.API.loadSpineAnimation(atlasPath, skeletonPath, textureName, true, function(loadedEntity) {
            console.log("[Test] ✓ Callback invoked! Loaded entity ID:", loadedEntity.id);
            console.log("[Test] Callback entity name:", loadedEntity.name);
        });
        
        // Also test synchronous usage (no callback)
        console.log("[Test] Testing loadSpineAnimation without callback (synchronous)...");
        const prefabEntity = Toxoid.API.loadSpineAnimation(atlasPath, skeletonPath, textureName, true);
        
        if (prefabEntity && prefabEntity.id) {
            console.log("[Test] ✓ loadSpineAnimation succeeded, prefab entity ID:", prefabEntity.id);
            console.log("[Test] Prefab entity name:", prefabEntity.name);
            
            // Test 3: Test creating an instance from the prefab
            console.log("[Test] Testing createSpineAnimation...");
            
            try {
                const instanceEntity = Toxoid.API.createSpineAnimation(atlasPath, skeletonPath, textureName);
                
                if (instanceEntity && instanceEntity.id) {
                    console.log("[Test] ✓ createSpineAnimation succeeded, instance entity ID:", instanceEntity.id);
                    console.log("[Test] Instance entity name:", instanceEntity.name);
                    
                    // Test 4: Check if the instance has the expected components
                    const hasSpineInstance = instanceEntity.has("SpineInstance");
                    const hasSpineAnimationPrefab = instanceEntity.has("SpineAnimationPrefab");
                    const hasDrawable = instanceEntity.has("Drawable");
                    const hasPosition = instanceEntity.has("Position");
                    
                    console.log("[Test] Instance component check:");
                    console.log("  - SpineInstance:", hasSpineInstance);
                    console.log("  - SpineAnimationPrefab:", hasSpineAnimationPrefab);
                    console.log("  - Drawable:", hasDrawable);
                    console.log("  - Position:", hasPosition);
                    
                    // Test 5: Try to modify the instance
                    if (hasPosition) {
                        const position = instanceEntity.getComponent("Position");
                        if (position) {
                            console.log("[Test] Modifying instance position...");
                            position.x = 100;
                            position.y = 200;
                            console.log("[Test] ✓ Position modified to:", position.x, position.y);
                        }
                    }
                    
                } else {
                    console.log("[Test] ✗ createSpineAnimation failed or returned null entity");
                }
                
            } catch (createError) {
                console.log("[Test] ✗ createSpineAnimation error:", createError.message);
                console.log("[Test] This is expected if the prefab wasn't loaded successfully");
            }
            
        } else {
            console.log("[Test] ✗ loadSpineAnimation failed or returned null entity");
            console.log("[Test] This is expected if the spine files don't exist");
        }
        
    } catch (loadError) {
        console.log("[Test] ✗ loadSpineAnimation error:", loadError.message);
        console.log("[Test] This is expected if the spine files don't exist");
    }
    
    // Test 6: Test loading other character animations
    console.log("[Test] Testing other character animations...");
    
    // Try loading fighter animation (atlas exists but may not have corresponding skeleton)
    try {
        const fighterEntity = Toxoid.API.loadSpineAnimation(
            "assets/animations/fighter/character.atlas",
            "assets/animations/character/character.json",  // Using the shared skeleton
            "character",  // Texture name from the atlas
            false
        );
        if (fighterEntity && fighterEntity.id) {
            console.log("[Test] ✓ Fighter animation loaded, entity ID:", fighterEntity.id);
        }
    } catch (error) {
        console.log("[Test] Fighter animation failed (expected if skeleton doesn't match):", error.message);
    }
    
    // Test 7: Test error handling with invalid paths
    console.log("[Test] Testing error handling with invalid paths...");
    
    try {
        const invalidEntity = Toxoid.API.loadSpineAnimation("invalid/atlas.atlas", "invalid/skeleton.json", "invalid_texture", false);
        if (!invalidEntity || !invalidEntity.id) {
            console.log("[Test] ✓ Error handling works correctly for invalid paths");
        } else {
            console.log("[Test] ✗ Error handling failed - invalid paths returned entity");
        }
    } catch (error) {
        console.log("[Test] ✓ Error handling works correctly (threw exception):", error.message);
    }
    
    } catch (error) {
        console.error("[Test] Error testing Spine Animation API:", error.message);
        console.error("[Test] Stack:", error.stack);
    }
}

// Start the test
waitForToxoid();
