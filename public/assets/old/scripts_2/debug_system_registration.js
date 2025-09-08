// Debug System Registration Script
// Inspects the internal state of system registration to find issues

console.log("[SystemDebug] Starting system registration debug...");

// Function to inspect global system state
function inspectSystemState() {
    console.log("[SystemDebug] === SYSTEM STATE INSPECTION ===");
    
    // Check if global system callback map exists
    if (typeof globalThis.__toxoid_system_callbacks !== 'undefined') {
        console.log("[SystemDebug] Global system callbacks map exists");
        console.log("[SystemDebug] Callback map size:", globalThis.__toxoid_system_callbacks.size);
        
        // List all registered callbacks
        let index = 0;
        for (const [name, callback] of globalThis.__toxoid_system_callbacks) {
            console.log(`[SystemDebug] Callback ${index++}: ${name} (type: ${typeof callback})`);
        }
    } else {
        console.log("[SystemDebug] ❌ Global system callbacks map does NOT exist");
    }
    
    // Check if queries map exists
    if (typeof globalThis.__toxoid_system_queries !== 'undefined') {
        console.log("[SystemDebug] Global system queries map exists");
        console.log("[SystemDebug] Query map size:", globalThis.__toxoid_system_queries.size);
        
        // List all registered queries
        let index = 0;
        for (const [name, query] of globalThis.__toxoid_system_queries) {
            console.log(`[SystemDebug] Query ${index++}: ${name} -> "${query}"`);
        }
    } else {
        console.log("[SystemDebug] ❌ Global system queries map does NOT exist");
    }
    
    console.log("[SystemDebug] === END INSPECTION ===");
}

// Initial inspection
inspectSystemState();

// Create a simple test system 1
console.log("[SystemDebug] Creating Test System 1...");
const system1 = Toxoid.System.create("DebugSystem1", "Position", Toxoid.Phases.ON_UPDATE, function(iter) {
    console.log("[DebugSystem1] Called with", iter.entities().length, "entities");
});

if (system1) {
    console.log("[SystemDebug] ✅ Test System 1 created successfully");
    console.log("[SystemDebug] System 1 ID:", Toxoid.System.getId(system1));
    console.log("[SystemDebug] System 1 Name:", Toxoid.System.getName(system1));
    console.log("[SystemDebug] System 1 Query:", Toxoid.System.getQuery(system1));
} else {
    console.error("[SystemDebug] ❌ Test System 1 creation failed");
}

// Post-first-system inspection
console.log("[SystemDebug] After creating first system:");
inspectSystemState();

// Create a simple test system 2
console.log("[SystemDebug] Creating Test System 2...");
const system2 = Toxoid.System.create("DebugSystem2", "Velocity", Toxoid.Phases.ON_UPDATE, function(iter) {
    console.log("[DebugSystem2] Called with", iter.entities().length, "entities");
});

if (system2) {
    console.log("[SystemDebug] ✅ Test System 2 created successfully");
    console.log("[SystemDebug] System 2 ID:", Toxoid.System.getId(system2));
    console.log("[SystemDebug] System 2 Name:", Toxoid.System.getName(system2));
    console.log("[SystemDebug] System 2 Query:", Toxoid.System.getQuery(system2));
} else {
    console.error("[SystemDebug] ❌ Test System 2 creation failed");
}

// Post-second-system inspection
console.log("[SystemDebug] After creating second system:");
inspectSystemState();

// Create a simple test system 3 (with multiple components in query)
console.log("[SystemDebug] Creating Test System 3 (multi-component query)...");
const system3 = Toxoid.System.create("DebugSystem3", "Position, Velocity", Toxoid.Phases.ON_UPDATE, function(iter) {
    console.log("[DebugSystem3] Called with", iter.entities().length, "entities");
});

if (system3) {
    console.log("[SystemDebug] ✅ Test System 3 created successfully");
    console.log("[SystemDebug] System 3 ID:", Toxoid.System.getId(system3));
    console.log("[SystemDebug] System 3 Name:", Toxoid.System.getName(system3));
    console.log("[SystemDebug] System 3 Query:", Toxoid.System.getQuery(system3));
} else {
    console.error("[SystemDebug] ❌ Test System 3 creation failed");
}

// Final inspection
console.log("[SystemDebug] After creating all systems:");
inspectSystemState();

// Test if we can manually examine the callback functions
if (globalThis.__toxoid_system_callbacks && globalThis.__toxoid_system_callbacks.size > 0) {
    console.log("[SystemDebug] Testing callback function types:");
    let callbackIndex = 0;
    for (const [name, callback] of globalThis.__toxoid_system_callbacks) {
        console.log(`[SystemDebug] Callback ${callbackIndex++}: ${name}`);
        console.log(`  - Type: ${typeof callback}`);
        console.log(`  - Is Function: ${typeof callback === 'function'}`);
        console.log(`  - Constructor: ${callback.constructor?.name || 'unknown'}`);
        console.log(`  - Length: ${callback.length || 'n/a'}`);
        if (typeof callback === 'function') {
            try {
                console.log(`  - toString: ${callback.toString().substring(0, 50)}...`);
            } catch (e) {
                console.log(`  - toString error: ${e}`);
            }
        }
    }
}

console.log("[SystemDebug] System registration debug complete!");
console.log("[SystemDebug] If you see systems running in subsequent frames, they work.");
console.log("[SystemDebug] If not, there's an issue with the execution loop.");

// Create a test entity to see if our systems actually get called
const testEntityId = Toxoid.API.filledRect(100, 100, 20, 20, { r: 1.0, g: 0.0, b: 1.0, a: 1.0 });
const testEntity = Toxoid.API.getEntity(testEntityId);

if (testEntity) {
    testEntity.add("Velocity");
    console.log("[SystemDebug] Created test entity with Position and Velocity components");
    console.log("[SystemDebug] Entity ID:", testEntity.__entity_id);
} else {
    console.error("[SystemDebug] Failed to create test entity");
}