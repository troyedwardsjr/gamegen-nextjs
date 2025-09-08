// Test script to verify system execution works after the fix
console.log("[Test] Creating test system to verify fix...");

// Create a simple test system
const testSystem = Toxoid.System.create(
    "TestSystem",
    "Position",
    Toxoid.Phases.OnUpdate,
    function(iter) {
        console.log("[Test] System executed successfully! Found", iter.count, "entities");
    }
);

console.log("[Test] Test system created successfully with ID:", Toxoid.System.getId(testSystem));
console.log("[Test] System name:", Toxoid.System.getName(testSystem));
console.log("[Test] System query:", Toxoid.System.getQuery(testSystem));