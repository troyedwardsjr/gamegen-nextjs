// Test script to verify entity names are working correctly
// This script tests the fix for entity names showing as "host_entity_930" instead of "Player"

console.log("[EntityNameTest] Starting entity name test...");

// Wait a moment for the game to initialize
setTimeout(() => {
    console.log("[EntityNameTest] Testing entity name functionality...");
    
    try {
        // Test 1: Create a new entity with a name
        console.log("[EntityNameTest] Test 1: Creating new entity with name...");
        const testEntity = new Toxoid.Entity("TestEntity");
        const testName = testEntity.getName();
        console.log(`[EntityNameTest] Test entity ID: ${testEntity.getId()}`);
        console.log(`[EntityNameTest] Test entity name: "${testName}"`);
        
        if (testName === "TestEntity") {
            console.log("[EntityNameTest] ✅ SUCCESS: New entity has correct name");
        } else {
            console.log(`[EntityNameTest] ❌ FAILURE: New entity has wrong name '${testName}'`);
        }
        
        // Test 2: Try querying for LocalPlayer entities (if they exist in any game state)
        console.log("[EntityNameTest] Test 2: Querying for LocalPlayer entities...");
        try {
            const localPlayerEntities = Toxoid.query("LocalPlayer");
            console.log(`[EntityNameTest] Found ${localPlayerEntities.length} LocalPlayer entities`);
            
            if (localPlayerEntities.length > 0) {
                const player = localPlayerEntities[0];
                const playerName = player.getName();
                const playerId = player.getId();
                
                console.log(`[EntityNameTest] Player entity ID: ${playerId}`);
                console.log(`[EntityNameTest] Player entity name: "${playerName}"`);
                
                if (playerName === "Player") {
                    console.log("[EntityNameTest] ✅ SUCCESS: Player entity has correct name 'Player'");
                } else if (playerName.startsWith("host_entity_")) {
                    console.log(`[EntityNameTest] ❌ FAILURE: Player entity still has fallback name '${playerName}'`);
                } else {
                    console.log(`[EntityNameTest] ⚠️  UNEXPECTED: Player entity has unexpected name '${playerName}'`);
                }
            } else {
                console.log("[EntityNameTest] ℹ️  INFO: No LocalPlayer entities found (may not be in Playing game state)");
            }
        } catch (queryError) {
            console.log("[EntityNameTest] ℹ️  INFO: LocalPlayer query failed:", queryError.toString());
        }
        
        // Test 3: Try querying for any entities and check their names
        console.log("[EntityNameTest] Test 3: Querying for Position entities...");
        try {
            const positionEntities = Toxoid.query("Position");
            console.log(`[EntityNameTest] Found ${positionEntities.length} Position entities`);
            
            if (positionEntities.length > 0) {
                // Check the first few entities
                const entitiesToCheck = Math.min(3, positionEntities.length);
                for (let i = 0; i < entitiesToCheck; i++) {
                    const entity = positionEntities[i];
                    const entityName = entity.getName();
                    const entityId = entity.getId();
                    console.log(`[EntityNameTest] Entity ${i + 1}: ID ${entityId}, Name: "${entityName}"`);
                    
                    if (entityName && !entityName.startsWith("host_entity_")) {
                        console.log(`[EntityNameTest] ✅ Found entity with proper name: "${entityName}"`);
                    }
                }
            }
        } catch (queryError) {
            console.log("[EntityNameTest] ℹ️  INFO: Position query failed:", queryError.toString());
        }
        
        console.log("[EntityNameTest] Test completed!");
        
    } catch (error) {
        console.error("[EntityNameTest] ❌ ERROR:", error);
    }
    
}, 2000); // Wait 2 seconds for game initialization

console.log("[EntityNameTest] Test script loaded successfully");