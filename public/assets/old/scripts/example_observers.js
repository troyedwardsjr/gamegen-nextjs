// Example: Entity Event Concepts
// This script demonstrates event-driven entity interactions using basic functionality

console.log("[Script] Loading entity event example...");

// Simulate entity event handling using manual triggers
class EntityEventSystem {
    constructor() {
        this.entities = [];
        this.eventHandlers = [];
    }
    
    // Add an entity to be tracked
    trackEntity(entity) {
        this.entities.push(entity);
        console.log(`[Script] Now tracking entity: ${entity.getName()}`);
        this.triggerEvent("EntityAdded", entity);
    }
    
    // Register an event handler
    onEvent(eventType, handler) {
        this.eventHandlers.push({ type: eventType, handler });
        console.log(`[Script] Registered handler for event: ${eventType}`);
    }
    
    // Trigger an event
    triggerEvent(eventType, ...args) {
        this.eventHandlers
            .filter(h => h.type === eventType)
            .forEach(h => h.handler(...args));
    }
    
    // Simulate entity interaction
    simulateInteraction(entity1, entity2) {
        console.log(`[Script] Simulating interaction between ${entity1.getName()} and ${entity2.getName()}`);
        this.triggerEvent("EntityInteraction", entity1, entity2);
    }
    
    // Update entity state and trigger events
    updateEntityState(entity, newState) {
        const oldName = entity.getName();
        entity.setName(`${entity.getName().split('_')[0]}_${newState}`);
        console.log(`[Script] Updated ${oldName} to ${entity.getName()}`);
        this.triggerEvent("EntityStateChanged", entity, newState);
    }
}

// Create the event system
const eventSystem = new EntityEventSystem();

// Register event handlers
eventSystem.onEvent("EntityAdded", (entity) => {
    console.log(`[Script] Event: New entity added - ${entity.getName()}`);
    
    // Auto-assign properties based on entity name
    if (entity.getName().includes("Player")) {
        console.log(`[Script] Auto-configured ${entity.getName()} as player entity`);
    } else if (entity.getName().includes("Guard")) {
        console.log(`[Script] Auto-configured ${entity.getName()} as guard entity`);
    }
});

eventSystem.onEvent("EntityInteraction", (entity1, entity2) => {
    console.log(`[Script] Event: Interaction detected between ${entity1.getName()} and ${entity2.getName()}`);
    
    // Simulate different interaction types
    if (entity1.getName().includes("Player") && entity2.getName().includes("Guard")) {
        console.log(`[Script] Player-Guard interaction: Dialogue initiated`);
    } else if (entity1.getName().includes("Player") && entity2.getName().includes("Merchant")) {
        console.log(`[Script] Player-Merchant interaction: Trade window opened`);
    }
});

eventSystem.onEvent("EntityStateChanged", (entity, newState) => {
    console.log(`[Script] Event: ${entity.getName()} changed to state: ${newState}`);
    
    // React to specific state changes
    if (newState === "Alert") {
        console.log(`[Script] ${entity.getName()} is now alert! Other entities should react.`);
    } else if (newState === "Dead") {
        console.log(`[Script] ${entity.getName()} has died! Triggering cleanup...`);
    }
});

// Create test entities
console.log("[Script] Creating test entities for event demonstration...");

const player = new Toxoid.Entity("Player");
const guard = new Toxoid.Entity("Guard");
const merchant = Toxoid.Entity.named("Merchant");
const enemy = new Toxoid.Entity("Enemy");

// Track entities in the event system
eventSystem.trackEntity(player);
eventSystem.trackEntity(guard);
eventSystem.trackEntity(merchant);
eventSystem.trackEntity(enemy);

// Simulate a sequence of events
setTimeout(() => {
    console.log("[Script] === Starting event sequence ===");
    
    // Event 1: Player encounters guard
    eventSystem.simulateInteraction(player, guard);
}, 1000);

setTimeout(() => {
    // Event 2: Guard becomes alert
    eventSystem.updateEntityState(guard, "Alert");
}, 2000);

setTimeout(() => {
    // Event 3: Player trades with merchant
    eventSystem.simulateInteraction(player, merchant);
}, 3000);

setTimeout(() => {
    // Event 4: Enemy appears
    eventSystem.updateEntityState(enemy, "Hostile");
}, 4000);

setTimeout(() => {
    // Event 5: Combat sequence
    eventSystem.simulateInteraction(player, enemy);
    eventSystem.updateEntityState(enemy, "Dead");
}, 5000);

setTimeout(() => {
    console.log("[Script] === Event sequence complete ===");
}, 6000);

console.log("[Script] Entity event system example loaded successfully - " + Date.now());