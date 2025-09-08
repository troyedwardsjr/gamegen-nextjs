// Test script to verify ECS integration works
console.log("Testing ECS integration from JavaScript...");

try {
    // Test creating a component type
    console.log("Creating component type...");
    const PositionComponent = Toxoid.createComponentType("TestPosition", ["x", "y"], ["f32", "f32"]);
    console.log("Component type created successfully!");

    // Test creating an entity
    console.log("Creating entity...");
    const entity = Toxoid.createEntity("TestEntity");
    console.log("Entity created with ID:", entity.getId());

    // Test adding component to entity
    console.log("Adding component to entity...");
    entity.add(PositionComponent);
    console.log("Component added successfully!");

    // Test component has check
    console.log("Checking if entity has component...");
    const hasComponent = entity.has(PositionComponent);
    console.log("Entity has component:", hasComponent);

    // Test setting component data
    console.log("Setting component data...");
    const component = entity.get(PositionComponent);
    component.setX(100.0);
    component.setY(200.0);
    console.log("Component data set successfully!");

    // Test getting component data
    console.log("Getting component data...");
    const x = component.getX();
    const y = component.getY();
    console.log("Position:", x, y);

    console.log("ECS integration test completed successfully!");

} catch (error) {
    console.error("ECS integration test failed:", error);
}