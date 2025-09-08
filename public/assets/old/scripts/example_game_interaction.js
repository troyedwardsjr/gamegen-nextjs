// Example: Basic Entity Interaction
// This script demonstrates basic entity operations using the current Toxoid QuickJS API

console.log("[Script] Loading basic interaction example...");

// Create some entities to demonstrate interactions
function createTestEntities() {
    console.log("[Script] Creating test entities...");
    
    // Create different types of entities
    const player = new Toxoid.Entity("Player");
    const npc1 = Toxoid.Entity.named("NPC_Guard");
    const npc2 = Toxoid.Entity.fromId(100); // Create from specific ID
    
    console.log(`[Script] Created ${player.getName()} with ID ${player.getId()}`);
    console.log(`[Script] Created ${npc1.getName()} with ID ${npc1.getId()}`);
    console.log(`[Script] Created ${npc2.getName()} with ID ${npc2.getId()}`);
    
    // Demonstrate entity relationships
    npc1.childOf(player.getId());
    npc2.childOf(player.getId());
    
    console.log(`[Script] Set NPCs as children of player`);
    
    // Show parent-child relationships
    const children = player.children();
    console.log(`[Script] Player has ${children.length} children`);
    
    children.forEach((child, index) => {
        console.log(`[Script] Child ${index + 1}: ${child.getName()}`);
    });
    
    return { player, npc1, npc2 };
}

// Demonstrate entity name updates
function demonstrateNameUpdates(entities) {
    console.log("[Script] Demonstrating name updates...");
    
    const { player, npc1, npc2 } = entities;
    
    // Update names
    player.setName("MainPlayer");
    npc1.setName("GuardianNPC");
    npc2.setName("MerchantNPC");
    
    console.log(`[Script] Updated names:`);
    console.log(`[Script] - ${player.getName()}`);
    console.log(`[Script] - ${npc1.getName()}`);
    console.log(`[Script] - ${npc2.getName()}`);
}

// Create and demonstrate entities
const entities = createTestEntities();
demonstrateNameUpdates(entities);

// Simulate some game interaction logic
console.log("[Script] Simulating game interactions...");

// Create some additional entities to populate the world
const buildings = [];
for (let i = 0; i < 3; i++) {
    const building = new Toxoid.Entity(`Building_${i}`);
    buildings.push(building);
    console.log(`[Script] Created ${building.getName()}`);
}

// Create a simple interaction timer
let interactionCount = 0;
function simulateInteraction() {
    interactionCount++;
    console.log(`[Script] Interaction ${interactionCount}: Entities are active`);
    
    // Stop after 5 interactions
    if (interactionCount < 5) {
        setTimeout(simulateInteraction, 2000); // Run every 2 seconds
    } else {
        console.log("[Script] Simulation complete");
    }
}

// Start the simulation
simulateInteraction();

console.log("[Script] Basic interaction example loaded successfully - " + Date.now());