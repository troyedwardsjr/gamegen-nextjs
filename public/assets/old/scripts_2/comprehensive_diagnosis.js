// Comprehensive diagnosis script to understand the position update issue

console.log("[DIAGNOSIS] Starting comprehensive position update diagnosis...");

// Global test entity for tracking
let diagnosticEntity = null;

// Test 1: Create entity and verify basic functionality
console.log("=== TEST 1: Entity Creation and Basic Position Access ===");

function createDiagnosticEntity() {
    console.log("[DIAG1] Creating diagnostic entity...");
    
    const entityId = Toxoid.API.filledRect(300, 200, 40, 40, { r: 0.0, g: 1.0, b: 0.0, a: 1.0 });
    diagnosticEntity = Toxoid.API.getEntity(entityId);
    
    if (!diagnosticEntity) {
        console.error("[DIAG1] Failed to create diagnostic entity");
        return false;
    }
    
    console.log(`[DIAG1] ✓ Created entity ${diagnosticEntity.getId()}`);
    
    // Test immediate position access
    const pos = diagnosticEntity.getComponent("Position");
    console.log(`[DIAG1] Initial position: (${pos ? pos.x : "null"}, ${pos ? pos.y : "null"})`);
    
    // Test if entity has Renderable component
    console.log(`[DIAG1] Testing component presence...`);
    console.log(`[DIAG1] Has Position: ${diagnosticEntity.hasComponent ? diagnosticEntity.hasComponent("Position") : "hasComponent method not available"}`);
    console.log(`[DIAG1] Has Renderable: ${diagnosticEntity.hasComponent ? diagnosticEntity.hasComponent("Renderable") : "hasComponent method not available"}`);
    
    return true;
}

// Test 2: Direct position updates
console.log("=== TEST 2: Direct Position Updates ===");

function testDirectPositionUpdates() {
    if (!diagnosticEntity) {
        console.error("[DIAG2] No diagnostic entity available");
        return;
    }
    
    console.log("[DIAG2] Testing direct position updates...");
    
    const originalPos = diagnosticEntity.getComponent("Position");
    console.log(`[DIAG2] Original position: (${originalPos.x}, ${originalPos.y})`);
    
    // Test direct field updates using updateComponent
    console.log("[DIAG2] Updating X using Toxoid.updateComponent...");
    const xResult = Toxoid.updateComponent(diagnosticEntity.getId(), "Position", "x", 450);
    console.log(`[DIAG2] X update result: ${xResult}`);
    
    console.log("[DIAG2] Updating Y using Toxoid.updateComponent...");
    const yResult = Toxoid.updateComponent(diagnosticEntity.getId(), "Position", "y", 150);
    console.log(`[DIAG2] Y update result: ${yResult}`);
    
    // Verify the update
    const updatedPos = diagnosticEntity.getComponent("Position");
    console.log(`[DIAG2] Updated position: (${updatedPos.x}, ${updatedPos.y})`);
    
    if (updatedPos.x === 450 && updatedPos.y === 150) {
        console.log("[DIAG2] ✓ Direct position updates working correctly");
    } else {
        console.error("[DIAG2] ✗ Direct position updates failed");
    }
    
    // Test setComponent method
    console.log("[DIAG2] Testing setComponent method...");
    const setResult = diagnosticEntity.setComponent("Position", { x: 500, y: 100 });
    console.log(`[DIAG2] setComponent result: ${setResult}`);
    
    const setVerifyPos = diagnosticEntity.getComponent("Position");
    console.log(`[DIAG2] After setComponent: (${setVerifyPos.x}, ${setVerifyPos.y})`);
}

// Test 3: ECS Query verification
console.log("=== TEST 3: ECS Query Verification ===");

function testECSQueries() {
    console.log("[DIAG3] Testing ECS queries...");
    
    if (typeof Toxoid.__queryHostECS === 'function') {
        console.log("[DIAG3] __queryHostECS is available");
        
        // Query all Position entities
        const positionEntities = Toxoid.__queryHostECS("Position");
        console.log(`[DIAG3] Found ${positionEntities ? positionEntities.length : 0} entities with Position`);
        
        // Query all Renderable entities
        const renderableEntities = Toxoid.__queryHostECS("Renderable");
        console.log(`[DIAG3] Found ${renderableEntities ? renderableEntities.length : 0} entities with Renderable`);
        
        // Query entities with both Position and Renderable
        const posRenderEntities = Toxoid.__queryHostECS("Position, Renderable");
        console.log(`[DIAG3] Found ${posRenderEntities ? posRenderEntities.length : 0} entities with Position + Renderable`);
        
        // Check if our diagnostic entity is in the results
        if (diagnosticEntity && posRenderEntities && posRenderEntities.includes(diagnosticEntity.getId())) {
            console.log("[DIAG3] ✓ Diagnostic entity found in Position + Renderable query");
        } else {
            console.warn("[DIAG3] ✗ Diagnostic entity NOT found in Position + Renderable query");
        }
    } else {
        console.error("[DIAG3] __queryHostECS not available");
    }
}

// Test 4: System registration and iteration
console.log("=== TEST 4: System Registration and Iteration ===");

let systemCallCount = 0;
let lastPositionSeen = null;

function testSystemIteration() {
    console.log("[DIAG4] Registering diagnostic movement system...");
    
    const diagnosticSystem = Toxoid.System.create("DiagnosticMovement", "Position, Renderable", 4, function(iter) {
        systemCallCount++;
        
        if (systemCallCount % 60 === 0) { // Log every 60 frames (about once per second)
            console.log(`[DIAG4] System called ${systemCallCount} times`);
        }
        
        const entities = iter.entities();
        
        if (entities.length === 0) {
            if (systemCallCount % 60 === 0) {
                console.log("[DIAG4] No entities found in system iteration");
            }
            return;
        }
        
        if (systemCallCount % 60 === 0) {
            console.log(`[DIAG4] Processing ${entities.length} entities`);
        }
        
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            
            // Focus on our diagnostic entity
            if (diagnosticEntity && entity.getId() === diagnosticEntity.getId()) {
                const pos = entity.getComponent("Position");
                
                if (pos) {
                    if (systemCallCount % 60 === 0) {
                        console.log(`[DIAG4] Diagnostic entity position in system: (${pos.x}, ${pos.y})`);
                    }
                    
                    // Move the entity in a small circle to test visual updates
                    const angle = systemCallCount * 0.02;
                    const centerX = 400;
                    const centerY = 200;
                    const radius = 50;
                    
                    const newX = centerX + Math.cos(angle) * radius;
                    const newY = centerY + Math.sin(angle) * radius;
                    
                    const updateSuccess = entity.setComponent("Position", { x: newX, y: newY });
                    
                    if (systemCallCount % 60 === 0 && updateSuccess) {
                        console.log(`[DIAG4] ✓ Updated diagnostic entity to (${newX}, ${newY})`);
                        
                        // Verify the update took effect
                        const verifyPos = entity.getComponent("Position");
                        if (verifyPos) {
                            console.log(`[DIAG4] Verification: position is now (${verifyPos.x}, ${verifyPos.y})`);
                        }
                    }
                } else {
                    if (systemCallCount % 60 === 0) {
                        console.warn(`[DIAG4] Diagnostic entity has no Position component in system iteration`);
                    }
                }
            }
        }
    });
    
    console.log(`[DIAG4] ✓ Diagnostic system registered with ID: ${Toxoid.System.getId(diagnosticSystem)}`);
}

// Test 5: Compare with host ECS state
console.log("=== TEST 5: Host ECS State Comparison ===");

function compareWithHostECS() {
    console.log("[DIAG5] Comparing JavaScript entity state with host ECS...");
    
    if (!diagnosticEntity) {
        console.error("[DIAG5] No diagnostic entity available");
        return;
    }
    
    const entityId = diagnosticEntity.getId();
    
    // Get position via JavaScript entity wrapper
    const jsPos = diagnosticEntity.getComponent("Position");
    console.log(`[DIAG5] JS Entity position: (${jsPos ? jsPos.x : "null"}, ${jsPos ? jsPos.y : "null"})`);
    
    // Try to get position via host component access
    if (typeof Toxoid.__getHostComponent === 'function') {
        const hostPosData = Toxoid.__getHostComponent(entityId, "Position");
        console.log(`[DIAG5] Host ECS position data: ${hostPosData}`);
        
        if (hostPosData) {
            try {
                const hostPos = JSON.parse(hostPosData);
                console.log(`[DIAG5] Host ECS position: (${hostPos.x}, ${hostPos.y})`);
                
                if (jsPos && Math.abs(jsPos.x - hostPos.x) < 0.1 && Math.abs(jsPos.y - hostPos.y) < 0.1) {
                    console.log("[DIAG5] ✓ JS and Host ECS positions match");
                } else {
                    console.error("[DIAG5] ✗ JS and Host ECS positions differ!");
                }
            } catch (e) {
                console.error("[DIAG5] Failed to parse host position data:", e);
            }
        }
    } else {
        console.warn("[DIAG5] __getHostComponent not available");
    }
}

// Run all diagnostic tests
function runAllTests() {
    console.log("[DIAGNOSIS] Running all diagnostic tests...");
    
    if (createDiagnosticEntity()) {
        // Wait a frame for entity to be fully created
        setTimeout(() => {
            testDirectPositionUpdates();
            testECSQueries();
            testSystemIteration();
            
            // Run ECS comparison periodically
            setInterval(() => {
                compareWithHostECS();
            }, 2000);
            
        }, 100);
    }
}

// Start diagnosis
runAllTests();

console.log("[DIAGNOSIS] All tests started. Monitor console for results...");