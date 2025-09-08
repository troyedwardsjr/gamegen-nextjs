// Health Component Test Script
// Tests the fixed Health component usage

console.log("[HealthTest] Starting Health component test...");

function testHealthComponent() {
    console.log("[HealthTest] Testing Health component functionality");
    
    try {
        // Create a test entity
        console.log("[HealthTest] Creating test entity...");
        const testEntity = Toxoid.API.createEntity("HealthTestEntity");
        
        if (!testEntity) {
            console.error("[HealthTest] Failed to create test entity");
            return false;
        }
        
        console.log("[HealthTest] ✓ Test entity created:", testEntity.id || testEntity.__entity_id);
        
        // Add Health component to the entity (Health should already be registered in engine)
        console.log("[HealthTest] Adding Health component...");
        const added = testEntity.add("Health");
        if (!added) {
            console.error("[HealthTest] Failed to add Health component");
            return false;
        }
        
        console.log("[HealthTest] ✓ Health component added successfully");
        
        // Test setting Health component with correct field names
        console.log("[HealthTest] Setting Health component data...");
        const healthData = {
            current_health: 100,
            max_health: 150
        };
        
        const setResult = testEntity.setComponent("Health", healthData);
        if (!setResult) {
            console.error("[HealthTest] Failed to set Health component data");
            return false;
        }
        
        console.log("[HealthTest] ✓ Health component data set successfully");
        
        // Test getting Health component data
        console.log("[HealthTest] Getting Health component data...");
        const healthComponent = testEntity.getComponent("Health");
        
        if (!healthComponent) {
            console.error("[HealthTest] Failed to get Health component");
            return false;
        }
        
        console.log("[HealthTest] ✓ Health component retrieved:", healthComponent);
        
        // Clean up
        console.log("[HealthTest] Cleaning up test entity...");
        Toxoid.API.removeEntity(testEntity.id || testEntity.__entity_id);
        
        console.log("[HealthTest] ✅ All Health component tests passed!");
        return true;
        
    } catch (error) {
        console.error("[HealthTest] ❌ Health component test failed with error:", error);
        return false;
    }
}

// Auto-run the test
if (typeof Toxoid !== 'undefined') {
    setTimeout(() => {
        testHealthComponent();
    }, 1000); // Wait 1 second for engine to initialize
} else {
    console.error("[HealthTest] Toxoid API not available");
}

// Export for debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testHealthComponent };
}