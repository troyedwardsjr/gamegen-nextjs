// Simple rectangle test to verify component updates work
console.log("[SimpleRect] Starting simple rectangle test...");

// Create a blue rectangle
const entityId = Toxoid.API.filledRect(100, 100, 50, 50, { r: 0.0, g: 0.0, b: 1.0, a: 1.0 });
const entity = Toxoid.API.getEntity(entityId);

if (entity) {
    console.log("[SimpleRect] ✓ Created entity:", entity.id);
    
    // Get the Position component
    const pos = entity.getComponent("Position");
    if (pos) {
        console.log("[SimpleRect] ✓ Got Position component");
        console.log("[SimpleRect] Initial position:", pos.x, pos.y);
        
        // Test direct property assignment
        console.log("[SimpleRect] Testing direct property assignment...");
        pos.x = 200;
        pos.y = 150;
        
        console.log("[SimpleRect] After assignment - position:", pos.x, pos.y);
        
        // Create a simple system to verify position updates are visible
        Toxoid.System.create("SimpleRectMove", "Position", 4, function(iter) {
            const entities = iter.entities();
            
            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i];
                
                if (entity.id === entityId) {
                    const p = entity.getComponent("Position");
                    if (p) {
                        // Move in a small circle
                        const time = Date.now() * 0.001;
                        p.x = 200 + Math.cos(time) * 50;
                        p.y = 150 + Math.sin(time) * 50;
                        
                        // Log occasionally to verify updates
                        if (Math.floor(time) % 5 === 0 && Math.abs(time - Math.floor(time)) < 0.02) {
                            console.log("[SimpleRectMove] Rectangle at:", p.x, p.y);
                        }
                    }
                }
            }
        });
        
        console.log("[SimpleRect] ✓ SimpleRectMove system created");
    } else {
        console.error("[SimpleRect] Failed to get Position component");
    }
} else {
    console.error("[SimpleRect] Failed to create entity");
}

console.log("[SimpleRect] Simple rectangle test complete!");