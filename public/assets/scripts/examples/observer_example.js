// Example: Using Observer API with declarative event constants
console.log("[Example] Observer API with declarative constants");

// Create an observer that triggers when entities get a Position component
const positionAddedObserver = Toxoid.Observer.create({
    name: "PositionAddedObserver",
    query: "Position",
    events: [Toxoid.ObserverEvents.OnAdd], // Much cleaner than [1]!
    callback: function(iter) {
        console.log("🎯 Position component added to", iter.count, "entities");
        iter.entities().forEach(entity => {
            console.log("  - Entity", entity.id, "now has Position");
        });
    }
});

// Create an observer that triggers when Position values change
const positionChangedObserver = Toxoid.Observer.create({
    name: "PositionChangedObserver", 
    query: "Position",
    events: [Toxoid.ObserverEvents.OnSet], // Much cleaner than [0]!
    callback: function(iter) {
        console.log("🎯 Position values changed for", iter.count, "entities");
        iter.entities().forEach(entity => {
            const pos = entity.getComponent("Position");
            if (pos) {
                console.log("  - Entity", entity.id, "position:", pos.x, pos.y);
            }
        });
    }
});

// Create an observer that triggers on multiple events
const lifecycleObserver = Toxoid.Observer.create({
    name: "EntityLifecycleObserver",
    query: "Position",
    events: [
        Toxoid.ObserverEvents.OnAdd,      // When Position is added
        Toxoid.ObserverEvents.OnRemove,   // When Position is removed  
        Toxoid.ObserverEvents.OnDelete    // When entity is deleted
    ],
    callback: function(iter) {
        console.log("🎯 Entity lifecycle event detected");
        iter.entities().forEach(entity => {
            console.log("  - Entity", entity.id, "affected");
        });
    }
});

console.log("[Example] Created 3 observers with declarative event constants");
console.log("[Example] - PositionAddedObserver (OnAdd)");
console.log("[Example] - PositionChangedObserver (OnSet)");
console.log("[Example] - EntityLifecycleObserver (OnAdd, OnRemove, OnDelete)");

// Demonstrate the constants are available
console.log("[Example] Available event constants:");
console.log("  OnSet:", Toxoid.ObserverEvents.OnSet);
console.log("  OnAdd:", Toxoid.ObserverEvents.OnAdd);
console.log("  OnRemove:", Toxoid.ObserverEvents.OnRemove);
console.log("  OnDelete:", Toxoid.ObserverEvents.OnDelete);
console.log("  OnDeleteTarget:", Toxoid.ObserverEvents.OnDeleteTarget);
console.log("  OnTableCreate:", Toxoid.ObserverEvents.OnTableCreate);
console.log("  OnTableDelete:", Toxoid.ObserverEvents.OnTableDelete);
