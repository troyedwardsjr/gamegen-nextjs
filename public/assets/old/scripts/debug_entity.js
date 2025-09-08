// Debug script to test entity objects
console.log("=== Debug Entity Objects ===");

function debugEntities(iter) {
    console.log("Debug entity objects...");
    
    // const entities = iter.entities();
    // console.log("entities() returned:", entities);
    // console.log("entities type:", typeof entities);
    // console.log("entities length:", entities.length);
    
    // if (entities.length > 0) {
    //     const entity = entities[0]; // Get first entity safely
    //     console.log("First entity object:", entity);
    //     console.log("Entity type:", typeof entity);
    //     console.log("Entity constructor:", entity.constructor?.name);
    //     console.log("Entity id:", entity.id);
    //     console.log("Entity __entity_id:", entity.__entity_id);
    //     console.log("Entity methods:", Object.getOwnPropertyNames(entity));
    //     console.log("Entity prototype:", Object.getPrototypeOf(entity));
    //     console.log("Has getComponent?", typeof entity.getComponent);
        
    //     // Test getComponent safely
    //     if (typeof entity.getComponent === 'function') {
    //         console.log("Testing getComponent...");
    //         try {
    //             const position = entity.getComponent("Position");
    //             console.log("Position component:", position);
    //         } catch (e) {
    //             console.log("getComponent error:", e);
    //         }
    //     } else {
    //         console.log("getComponent is not a function!");
    //     }
    //     console.log("----");
    // }
}

// Register the system
try {
    Toxoid.System.create("DebugEntitySystem", "Position", Toxoid.Phases.ON_UPDATE, debugEntities);
    console.log("Debug system registered");
} catch (error) {
    console.error("Failed to register debug system:", error);
}
