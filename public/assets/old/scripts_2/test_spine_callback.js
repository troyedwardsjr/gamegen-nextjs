// Test script to verify spine animation callbacks are working
console.log("[TestCallback] Starting callback test...");

// Track if callback was invoked
let callbackInvoked = false;
let characterCreated = false;

// Load the spine animation with a callback
console.log("[TestCallback] Loading spine animation with callback...");

Toxoid.API.loadSpineAnimation(
    "assets/animations/character/character.atlas",
    "assets/animations/character/character.json",
    "character",
    false,  // Don't render the prefab
    function(prefab) {
        // This callback should be invoked when the prefab is loaded
        callbackInvoked = true;
        console.log("[TestCallback] ✅ CALLBACK INVOKED! Prefab entity:", prefab.id);
        
        // Now create an instance from the prefab
        const character = Toxoid.API.createSpineAnimation(
            "assets/animations/character/character.atlas",
            "assets/animations/character/character.json",
            "character"
        );
        
        if (character && character.id) {
            characterCreated = true;
            console.log("[TestCallback] ✅ Character created successfully, ID:", character.id);
            
            // Setup the character
            character.add("Player");
            character.add("LocalPlayer");
            
            // Set position
            const pos = character.getComponent("Position");
            if (pos) {
                pos.x = 400;
                pos.y = 300;
                console.log("[TestCallback] Position set to:", pos.x, pos.y);
            }
            
            // Set animation
            const spine = character.getComponent("SpineInstance");
            if (spine) {
                spine.current_animation = "idle_down";
                console.log("[TestCallback] Animation set to idle_down");
            }
            
            console.log("[TestCallback] ✅ Character fully initialized!");
        } else {
            console.error("[TestCallback] ❌ Failed to create character instance");
        }
    }
);

// Check status after a short delay
Toxoid.System.create("CallbackStatusChecker", "Position", 4, function() {
    // This will run every frame, but we only need to check once
    if (!this.checked) {
        this.checked = true;
        
        console.log("[TestCallback] === Callback Status ===");
        console.log("  Callback invoked:", callbackInvoked ? "✅ YES" : "❌ NO");
        console.log("  Character created:", characterCreated ? "✅ YES" : "❌ NO");
        
        if (!callbackInvoked) {
            console.error("[TestCallback] ❌ CALLBACK WAS NOT INVOKED!");
        }
        
        if (callbackInvoked && characterCreated) {
            console.log("[TestCallback] ✅ ALL TESTS PASSED!");
        }
    }
});

console.log("[TestCallback] Test script loaded. Waiting for callbacks...");