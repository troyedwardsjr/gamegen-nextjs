// // Simple test script for sandbox mode
// console.log("Test script loaded successfully!");

// // Test basic functionality
// try {
//     // Test if Toxoid API is available
//     if (typeof Toxoid !== 'undefined') {
//         console.log("Toxoid API is available");
//         console.log("Available APIs:", Object.keys(Toxoid));
//     } else {
//         console.log("Toxoid API is not available");
//     }
// } catch (error) {
//     console.log("Error testing Toxoid API:", error);
// }

// // Test script for the WorldLink Toxoid API
// console.log("Testing Toxoid API bindings...");

// // // Test camera functions
// // console.log("Testing camera functions...");
// // const camera = Toxoid.API.getCamera();
// // console.log("Current camera:", camera);

// // Toxoid.API.setCamera(100, 200, 2.0);
// // console.log("Set camera to (100, 200) with zoom 2.0");

// // Test drawing functions
// console.log("Testing drawing functions...");

// // Create a red rectangle (using 6-parameter API: x, y, width, height, r, g - b defaults to 0, a defaults to 1.0)
// const redRect = Toxoid.API.filledRect(0, 0, 200, 150, 1.0, 0.0);
// console.log("Created red rectangle:", redRect);

// // Create a blue outline rectangle (using RGBA wrapper function)
// const blueRect = Toxoid.API.filledRectRGBA(200, 50, 150, 75, {r: 0.0, g: 0.0, b: 1.0, a: 1.0});
// console.log("Created blue rectangle:", blueRect);

// // Create some lines
// const lines = [
//     {x1: 0, y1: 0, x2: 100, y2: 100, thickness: 2.0},
//     {x1: 100, y1: 0, x2: 0, y2: 100, thickness: 2.0}
// ];
// const greenColor = {r: 0.0, g: 1.0, b: 0.0, a: 1.0};
// const linesEntity = Toxoid.API.lines(lines, greenColor); // Green lines
// console.log("Created green lines:", linesEntity);

// // Test sprite loading (will only log for now)
// console.log("Testing sprite functions...");
// const spriteId = Toxoid.API.loadSprite("assets/ui/cursor_1.png");
// console.log("Loading sprite, ID:", spriteId);

// // Test entity creation
// console.log("Testing entity functions...");
// const entityId = Toxoid.API.createEntity("TestEntity");
// console.log("Created entity:", entityId);

// const entityInfo = Toxoid.API.getEntity(entityId);
// console.log("Entity info:", entityInfo);

// console.log("API test completed!");

// // Create an observer using the Observer class
// const observer = Toxoid.Observer.create({
//     name: "my_observer",           // Optional, defaults to "unnamed_observer"
//     query: "Sprite, Loaded",   // Required - ECS query string
//     events: [0, 1, 2],            // Optional - array of event numbers
//     callback: () => console.log("Observer callback called!")   // Optional - not fully implemented yet
// });

// // Get the observer ID
// const observerId = Toxoid.Observer.getId(observer);

// // Get the observer name
// const observerName = Toxoid.Observer.getName(observer);

// console.log("Observer ID:", observerId);
// console.log("Observer name:", observerName);

// const positionMoverSystem = Toxoid.System.create(
//     "TestSystem123",
//     "Sprite",
//     Toxoid.Phases.ON_UPDATE,
//     function(iter) {
//         console.log("System called!");
//     }
// );

const sprite = Toxoid.API.createSprite("assets/sprites/sakura.png");
// sprite.add("Renderable");
