// Test script to verify Position component setters
console.log("=== Testing Position Component Setters ===");

function testPositionSetters(iter) {
    console.log("Testing Position component setters...");
    
    const entities = iter.entities();
    console.log(`Found ${entities.length} entities from Position query`);
    
    entities.forEach((entity, index) => {
        console.log(`\n=== Entity ${index} (ID: ${entity.id}) ===`);
        
        // Get the position component 
        const position = entity.getComponent("Position");
        console.log("Position object:", position);
        
        if (position && typeof position === 'object') {
            console.log("Current position:");
            console.log("  x:", position.x);
            console.log("  y:", position.y);
            
            // Check for setter methods
            console.log("Available methods:");
            const props = Object.getOwnPropertyNames(position);
            for (const prop of props) {
                if (typeof position[prop] === 'function') {
                    console.log(`  ${prop}() - function`);
                } else {
                    console.log(`  ${prop} - ${typeof position[prop]}`);
                }
            }
            
            // Test setters if they exist
            if (typeof position.set_x === 'function') {
                console.log("Testing position.set_x(100)...");
                try {
                    position.set_x(100);
                    console.log("✓ set_x() called successfully");
                    
                    // Get the position again to see if it changed
                    const updatedPosition = entity.getComponent("Position");
                    console.log("Updated x:", updatedPosition.x);
                } catch (e) {
                    console.log("✗ set_x() failed:", e);
                }
            } else {
                console.log("No set_x method found");
            }
            
            if (typeof position.set_y === 'function') {
                console.log("Testing position.set_y(200)...");
                try {
                    position.set_y(200);
                    console.log("✓ set_y() called successfully");
                    
                    // Get the position again to see if it changed
                    const updatedPosition = entity.getComponent("Position");
                    console.log("Updated y:", updatedPosition.y);
                } catch (e) {
                    console.log("✗ set_y() failed:", e);
                }
            } else {
                console.log("No set_y method found");
            }
        }
    });
}

// Register the system
try {
    Toxoid.System.create("TestPositionSettersSystem", "Position", Toxoid.Phases.ON_UPDATE, testPositionSetters);
    console.log("Position setters test system registered successfully");
} catch (error) {
    console.error("Failed to register position setters test system:", error);
}

console.log("=== Position Setters Test Script Loaded ===");
