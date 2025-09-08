// Functional test for Observer API - test real observer callbacks
console.log("[Test] Testing functional Observer API...");

let observerTriggered = false;
let addObserverTriggered = false;
let setObserverTriggered = false;

try {
    // Test 0: Verify event constants are available
    console.log("[Test] Checking ObserverEvents constants...");
    if (Toxoid.ObserverEvents) {
        console.log("[Test] ✓ ObserverEvents constants available:");
        console.log("  - OnSet:", Toxoid.ObserverEvents.OnSet);
        console.log("  - OnAdd:", Toxoid.ObserverEvents.OnAdd);
        console.log("  - OnRemove:", Toxoid.ObserverEvents.OnRemove);
        console.log("  - OnDelete:", Toxoid.ObserverEvents.OnDelete);
        console.log("  - OnDeleteTarget:", Toxoid.ObserverEvents.OnDeleteTarget);
        console.log("  - OnTableCreate:", Toxoid.ObserverEvents.OnTableCreate);
        console.log("  - OnTableDelete:", Toxoid.ObserverEvents.OnTableDelete);
    } else {
        console.log("[Test] ✗ ObserverEvents constants not available");
    }
    
    // Test 1: Create an OnAdd observer
    console.log("[Test] Creating OnAdd observer...");
    
    const addObserver = Toxoid.Observer.create({
        name: "TestOnAddObserver",
        query: "Position",
        events: [Toxoid.ObserverEvents.OnAdd], // Using constant instead of magic number
        callback: function(iter) {
            addObserverTriggered = true;
            console.log("🎯 OnAdd Observer triggered! Entities:", iter.count);
            iter.entities().forEach(entity => {
                console.log("🎯 Entity added with Position:", entity.id);
            });
        }
    });
    
    if (addObserver) {
        console.log("[Test] ✓ OnAdd observer created, ID:", Toxoid.Observer.getId(addObserver));
    }
    
    // Test 2: Create an OnSet observer 
    console.log("[Test] Creating OnSet observer...");
    
    const setObserver = Toxoid.Observer.create({
        name: "TestOnSetObserver", 
        query: "Position",
        events: [Toxoid.ObserverEvents.OnSet], // Using constant instead of magic number
        callback: function(iter) {
            setObserverTriggered = true;
            console.log("🎯 OnSet Observer triggered! Entities:", iter.count);
            iter.entities().forEach(entity => {
                console.log("🎯 Entity modified with Position:", entity.id);
            });
        }
        });
    
    if (setObserver) {
        console.log("[Test] ✓ OnSet observer created, ID:", Toxoid.Observer.getId(setObserver));
    }
    
    // Test 3: Manually trigger observers to test the mechanism
    console.log("[Test] Testing manual observer triggering...");
    
    // Create test entities
    const entity1 = Toxoid.API.createEntity("ObserverTest1");
    const entity2 = Toxoid.API.createEntity("ObserverTest2");
    
    console.log("[Test] Created test entities:", entity1.id, entity2.id);
    
    // Manually trigger OnAdd observer
    if (typeof globalThis.__triggerObserverCallbacks === 'function') {
        console.log("[Test] Manually triggering OnAdd observer...");
        globalThis.__triggerObserverCallbacks(Toxoid.ObserverEvents.OnAdd, [entity1.id, entity2.id]); // Using constant
        
        // Wait a bit and check
        setTimeout(() => {
            if (addObserverTriggered) {
                console.log("[Test] ✓ OnAdd observer was triggered successfully!");
            } else {
                console.log("[Test] ✗ OnAdd observer was NOT triggered");
            }
        }, 100);
    } else {
        console.log("[Test] ✗ __triggerObserverCallbacks not available");
    }
    
    // Test 4: Test through actual ECS operations
    console.log("[Test] Testing observers through real ECS operations...");
    
    // Add Position components - should trigger OnAdd observers
    entity1.add("Position");
    entity2.add("Position");
    
    console.log("[Test] Added Position components to entities");
    
    // Modify position values - should trigger OnSet observers
    const pos1 = entity1.getComponent("Position");
    const pos2 = entity2.getComponent("Position");
    
    if (pos1 && pos2) {
        console.log("[Test] Modifying position values...");
        pos1.x = 100;
        pos1.y = 200;
        pos2.x = 300;
        pos2.y = 400;
        console.log("[Test] Position values modified");
    }
    
    // Test 5: Check callback storage
    console.log("[Test] Checking callback storage...");
    if (globalThis.__toxoid_observer_callbacks) {
        console.log("[Test] Observer callbacks stored:", globalThis.__toxoid_observer_callbacks.size);
        for (const [name, callback] of globalThis.__toxoid_observer_callbacks) {
            console.log("[Test] - Observer:", name, "Callback type:", typeof callback);
        }
    } else {
        console.log("[Test] ✗ No observer callback storage found");
    }
    
    // Final status check
    setTimeout(() => {
        console.log("=== OBSERVER TEST RESULTS ===");
        console.log("OnAdd observer triggered:", addObserverTriggered);
        console.log("OnSet observer triggered:", setObserverTriggered);
        console.log("Overall success:", addObserverTriggered || setObserverTriggered);
    }, 200);
    
} catch (error) {
    console.error("[Test] Error testing functional Observer API:", error.message);
    console.error("[Test] Stack:", error.stack);
}

console.log("[Test] Functional Observer API test completed");
