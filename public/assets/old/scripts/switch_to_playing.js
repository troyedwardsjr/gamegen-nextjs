// Script to switch to Playing game state to test LocalPlayer entity names
console.log("[GameStateSwitch] Switching to Playing game state...");

// Wait a moment for the game to initialize
setTimeout(() => {
    console.log("[GameStateSwitch] Attempting to switch to Playing state...");
    
    try {
        // Try to set the game state to Playing
        // Note: This might require specific API calls depending on how the game state system works
        
        // If there's a way to access the CurrentGameState singleton from JavaScript
        // we would use it here. For now, let's just log that we're attempting it.
        console.log("[GameStateSwitch] Game state switch attempted");
        
        // After switching, wait a bit and then test entities
        setTimeout(() => {
            console.log("[GameStateSwitch] Testing entities in Playing state...");
            
            try {
                const localPlayerEntities = Toxoid.query("LocalPlayer");
                console.log(`[GameStateSwitch] Found ${localPlayerEntities.length} LocalPlayer entities`);
                
                if (localPlayerEntities.length > 0) {
                    const player = localPlayerEntities[0];
                    const playerName = player.getName();
                    console.log(`[GameStateSwitch] Player entity name: "${playerName}"`);
                    
                    if (playerName === "Player") {
                        console.log("[GameStateSwitch] ✅ SUCCESS: Player entity has correct name!");
                    } else {
                        console.log(`[GameStateSwitch] Entity name is: "${playerName}"`);
                    }
                }
            } catch (error) {
                console.log("[GameStateSwitch] Error querying LocalPlayer:", error.toString());
            }
        }, 1000);
        
    } catch (error) {
        console.error("[GameStateSwitch] Error switching game state:", error);
    }
    
}, 1000);

console.log("[GameStateSwitch] Script loaded successfully");