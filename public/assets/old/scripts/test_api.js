// Test script for the WorldLink Toxoid API
console.log("Testing Toxoid API bindings...");

// Test camera functions
console.log("Testing camera functions...");
const camera = Toxoid.API.getCamera();
console.log("Current camera:", camera);

Toxoid.API.setCamera(100, 200, 2.0);
console.log("Set camera to (100, 200) with zoom 2.0");

// Test drawing functions
console.log("Testing drawing functions...");

// Create a red rectangle
const redRect = Toxoid.API.filledRect(50, 50, 100, 100, 1.0, 0.0, 0.0, 1.0);
console.log("Created red rectangle:", redRect);

// Create a blue outline rectangle
const blueRect = Toxoid.API.rect(200, 50, 150, 75, 0.0, 0.0, 1.0, 1.0);
console.log("Created blue rectangle outline:", blueRect);

// Create some lines
const lines = [
    {x1: 0, y1: 0, x2: 100, y2: 100, thickness: 2.0},
    {x1: 100, y1: 0, x2: 0, y2: 100, thickness: 2.0}
];
const greenColor = {r: 0.0, g: 1.0, b: 0.0, a: 1.0};
const linesEntity = Toxoid.API.lines(lines, greenColor); // Green lines
console.log("Created green lines:", linesEntity);

// Test sprite loading (will only log for now)
console.log("Testing sprite functions...");
const spriteId = Toxoid.API.loadSprite("assets/ui/cursor_1.png");
console.log("Loading sprite, ID:", spriteId);

// Test entity creation
console.log("Testing entity functions...");
const entityId = Toxoid.API.createEntity("TestEntity");
console.log("Created entity:", entityId);

const entityInfo = Toxoid.API.getEntity(entityId);
console.log("Entity info:", entityInfo);

console.log("API test completed!");