// Example: Entity Creation and Management System
// This script demonstrates advanced entity spawning, management, and lifecycle

console.log("[EntitySpawner] Loading entity spawning example...");

// Entity spawner class to manage entity creation and cleanup
class EntitySpawner {
    constructor() {
        this.spawnedEntities = [];
        this.entityCount = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 2.0; // Spawn every 2 seconds
        this.maxEntities = 10;
    }
    
    // Spawn a new entity at a random position
    spawnEntity() {
        if (this.spawnedEntities.length >= this.maxEntities) {
            // Remove oldest entity to make room
            this.removeOldestEntity();
        }
        
        const entityName = `SpawnedEntity_${this.entityCount++}`;
        const entity = new Toxoid.Entity(entityName);
        
        // Add components
        entity.add("Position");
        entity.add("Size");
        entity.add("Rect");
        entity.add("Color");
        entity.add("Renderable");
        
        // Random position within screen bounds
        const x = Math.random() * 800 - 400; // -400 to 400
        const y = Math.random() * 600 - 300; // -300 to 300
        
        entity.setComponent("Position", { x: Math.floor(x), y: Math.floor(y) });
        entity.setComponent("Size", { width: 20, height: 20 });
        entity.setComponent("Rect", { filled: true });
        
        // Random color
        entity.setComponent("Color", {
            r: Math.random(),
            g: Math.random(),
            b: Math.random(),
            a: 1.0
        });
        
        this.spawnedEntities.push({
            entity: entity,
            spawnTime: Date.now(),
            lifetime: 5.0 + Math.random() * 5.0 // 5-10 seconds lifetime
        });
        
        console.log(`[EntitySpawner] Spawned ${entityName} at (${Math.floor(x)}, ${Math.floor(y)})`);
        return entity;
    }
    
    // Remove the oldest spawned entity
    removeOldestEntity() {
        if (this.spawnedEntities.length > 0) {
            const oldest = this.spawnedEntities.shift();
            oldest.entity.destruct();
            console.log(`[EntitySpawner] Removed oldest entity: ${oldest.entity.getName()}`);
        }
    }
    
    // Update spawner logic (called each frame)
    update(deltaTime) {
        this.spawnTimer += deltaTime;
        
        // Spawn new entities at intervals
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnEntity();
            this.spawnTimer = 0;
        }
        
        // Check for entities that have exceeded their lifetime
        const currentTime = Date.now();
        this.spawnedEntities = this.spawnedEntities.filter(spawned => {
            const age = (currentTime - spawned.spawnTime) / 1000.0;
            if (age > spawned.lifetime) {
                spawned.entity.destruct();
                console.log(`[EntitySpawner] Entity ${spawned.entity.getName()} expired after ${age.toFixed(1)}s`);
                return false;
            }
            return true;
        });
    }
    
    // Get count of active entities
    getActiveCount() {
        return this.spawnedEntities.length;
    }
    
    // Clean up all spawned entities
    cleanup() {
        this.spawnedEntities.forEach(spawned => {
            spawned.entity.destruct();
        });
        this.spawnedEntities = [];
        console.log("[EntitySpawner] Cleaned up all spawned entities");
    }
}

// Create global spawner instance
const globalSpawner = new EntitySpawner();

// Function to create different types of entities
function createSpecialEntity(type, x, y) {
    const entity = new Toxoid.Entity(`${type}_${Date.now()}`);
    
    entity.add("Position");
    entity.add("Size");
    entity.add("Color");
    entity.add("Renderable");
    
    entity.setComponent("Position", { x: x, y: y });
    
    switch (type) {
        case "Square":
            entity.add("Rect");
            entity.setComponent("Size", { width: 40, height: 40 });
            entity.setComponent("Rect", { filled: true });
            entity.setComponent("Color", { r: 1.0, g: 0.0, b: 0.0, a: 1.0 }); // Red
            break;
            
        case "Rectangle":
            entity.add("Rect");
            entity.setComponent("Size", { width: 60, height: 30 });
            entity.setComponent("Rect", { filled: false }); // Outline only
            entity.setComponent("Color", { r: 0.0, g: 1.0, b: 0.0, a: 1.0 }); // Green
            break;
            
        case "Circle":
            // Note: Using Rect as a placeholder since Circle might not be available
            entity.add("Rect");
            entity.setComponent("Size", { width: 35, height: 35 });
            entity.setComponent("Rect", { filled: true });
            entity.setComponent("Color", { r: 0.0, g: 0.0, b: 1.0, a: 1.0 }); // Blue
            break;
    }
    
    console.log(`[EntitySpawner] Created special entity: ${type} at (${x}, ${y})`);
    return entity;
}

// Create a system to update the spawner
const spawnerUpdateSystem = Toxoid.System.create(
    "EntitySpawnerUpdate",
    "",  // No specific component query needed
    Toxoid.Phases.ON_UPDATE,
    function(iter) {
        const deltaTime = 1.0 / 60.0; // Assume 60 FPS for now
        globalSpawner.update(deltaTime);
    }
);

// Create some initial special entities
try {
    createSpecialEntity("Square", -100, 0);
    createSpecialEntity("Rectangle", 0, 0);
    createSpecialEntity("Circle", 100, 0);
    
    // Create a container entity to demonstrate hierarchy
    const container = new Toxoid.Entity("EntityContainer");
    container.add("Position");
    container.setComponent("Position", { x: 0, y: -150 });
    
    // Create child entities
    for (let i = 0; i < 3; i++) {
        const child = new Toxoid.Entity(`ChildEntity_${i}`);
        child.add("Position");
        child.add("Size");
        child.add("Rect");
        child.add("Color");
        child.add("Renderable");
        
        child.setComponent("Position", { x: i * 50 - 50, y: 0 });
        child.setComponent("Size", { width: 20, height: 20 });
        child.setComponent("Rect", { filled: true });
        child.setComponent("Color", {
            r: i / 3.0,
            g: 1.0 - i / 3.0,
            b: 0.5,
            a: 1.0
        });
        
        child.childOf(container.getId());
    }
    
    console.log(`[EntitySpawner] Created container with ${container.children().length} children`);
    
    // Set up cleanup on script end (if supported)
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
            globalSpawner.cleanup();
        });
    }
    
    console.log("[EntitySpawner] Entity spawner system initialized");
    console.log(`[EntitySpawner] Max entities: ${globalSpawner.maxEntities}, Spawn interval: ${globalSpawner.spawnInterval}s`);
    
} catch (error) {
    console.error("[EntitySpawner] Error in entity spawner example:", error);
}

// Expose spawner functions globally for debugging
if (typeof globalThis !== 'undefined') {
    globalThis.spawnEntity = () => globalSpawner.spawnEntity();
    globalThis.getEntityCount = () => globalSpawner.getActiveCount();
    globalThis.cleanupEntities = () => globalSpawner.cleanup();
}

console.log("[EntitySpawner] Entity spawner example loaded successfully");