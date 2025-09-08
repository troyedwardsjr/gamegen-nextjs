// Example: Script State Management
// This script demonstrates basic state tracking for development

console.log("[Script] Loading script state example...");

// Simple state tracking (simulating hot-reload concepts)
if (typeof globalThis.__scriptState === 'undefined') {
    globalThis.__scriptState = {
        loadCount: 0,
        entities: []
    };
}

globalThis.__scriptState.loadCount++;
console.log(`[Script] Script load count: ${globalThis.__scriptState.loadCount}`);

// Clean up entities from previous runs
function cleanup() {
    console.log("[Script] Cleaning up previous entities...");
    
    // Clear the entity list (in a full implementation, this would destroy entities)
    globalThis.__scriptState.entities.forEach(entityData => {
        console.log(`[Script] Would clean up entity: ${entityData.name}`);
    });
    globalThis.__scriptState.entities = [];
}

// Run cleanup if this isn't the first load
if (globalThis.__scriptState.loadCount > 1) {
    cleanup();
}

// Create test entities for this run
function createTestEntities() {
    console.log("[Script] Creating entities for this run...");
    
    const entities = [];
    const loadCount = globalThis.__scriptState.loadCount;
    
    // Create different entities based on load count
    for (let i = 0; i < 3; i++) {
        const entityName = `TestEntity_${loadCount}_${i}`;
        const entity = new Toxoid.Entity(entityName);
        
        // Store entity data
        const entityData = {
            id: entity.getId(),
            name: entity.getName(),
            loadCount: loadCount
        };
        
        entities.push(entity);
        globalThis.__scriptState.entities.push(entityData);
        
        console.log(`[Script] Created ${entityName} with ID ${entity.getId()}`);
    }
    
    return entities;
}

// Create entities for this run
const entities = createTestEntities();

// Demonstrate different behaviors based on load count
if (globalThis.__scriptState.loadCount % 2 === 1) {
    console.log("[Script] Odd load - Setting up linear hierarchy");
    // Create a linear parent-child chain
    for (let i = 1; i < entities.length; i++) {
        entities[i].childOf(entities[i-1].getId());
        console.log(`[Script] Set ${entities[i].getName()} as child of ${entities[i-1].getName()}`);
    }
} else {
    console.log("[Script] Even load - Setting up star hierarchy");
    // Create a star pattern with first entity as parent
    for (let i = 1; i < entities.length; i++) {
        entities[i].childOf(entities[0].getId());
        console.log(`[Script] Set ${entities[i].getName()} as child of ${entities[0].getName()}`);
    }
}

// Show hierarchy information
console.log("[Script] Current hierarchy:");
entities.forEach(entity => {
    const children = entity.children();
    console.log(`[Script] ${entity.getName()} has ${children.length} children`);
});

// Set up a simple timer to demonstrate ongoing script activity
let activityCount = 0;
function showActivity() {
    activityCount++;
    console.log(`[Script] Activity ${activityCount} - Script is still running (Load ${globalThis.__scriptState.loadCount})`);
    
    if (activityCount < 3) {
        setTimeout(showActivity, 3000); // Run every 3 seconds
    } else {
        console.log("[Script] Activity demonstration complete");
    }
}

// Start activity demonstration
showActivity();

console.log("[Script] Script state example loaded successfully - Load #" + globalThis.__scriptState.loadCount);