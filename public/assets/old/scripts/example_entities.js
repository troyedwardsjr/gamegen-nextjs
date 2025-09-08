// Example: Creating entities with components
// This script demonstrates how to create game entities from JavaScript using the Toxoid QuickJS API

console.log("[Script] Loading entity creation example...");

// Create a simple bouncing ball entity
function createBouncingBall(x, y) {
    // Create a new entity using the Toxoid API
    const ball = new Toxoid.Entity("BouncingBall_" + Date.now());
    
    // NOTE: Component system is not yet fully implemented in the QuickJS API
    // For now, we'll just create entities and show basic functionality
    
    console.log(`[Script] Created entity: ${ball.getName()} with ID: ${ball.getId()}`);
    
    // Demonstrate entity operations
    ball.setName(`BouncingBall_at_${x}_${y}`);
    console.log(`[Script] Updated name to: ${ball.getName()}`);
    
    return ball;
}

// Create a few entities at startup
const ball1 = createBouncingBall(100, 100);
const ball2 = createBouncingBall(200, 150);
const ball3 = createBouncingBall(300, 200);

// Demonstrate parent/child relationships
ball1.childOf(ball2.getId());
console.log(`[Script] Set ${ball1.getName()} as child of ${ball2.getName()}`);

// Show children
const children = ball2.children();
console.log(`[Script] ${ball2.getName()} has ${children.length} children`);

console.log("[Script] Entity creation example loaded successfully - " + Date.now());