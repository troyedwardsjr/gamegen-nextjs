// Example: Loading and manipulating sprites
// This script demonstrates how to work with sprite assets through the Toxoid QuickJS API

console.log("[SpriteLoader] Loading sprite manipulation example...");

// Function to create a sprite entity with position and properties
function createSpriteEntity(imagePath, name, x, y) {
    console.log(`[SpriteLoader] Creating sprite entity: ${name} at (${x}, ${y})`);
    
    // Create a new entity
    const entity = new Toxoid.Entity(name);
    
    // Add basic components
    entity.add("Position");
    entity.add("Size");
    entity.add("Sprite");
    entity.add("Renderable");
    
    // Set position
    entity.setComponent("Position", { x: x, y: y });
    
    // Set size (default sprite size)
    entity.setComponent("Size", { width: 64, height: 64 });
    
    console.log(`[SpriteLoader] Created sprite entity ${name} with ID: ${entity.getId()}`);
    return entity;
}

// Function to create animated sprites using frame-by-frame animation
function createAnimatedSprite(name, x, y, frameCount) {
    console.log(`[SpriteLoader] Creating animated sprite: ${name} with ${frameCount} frames`);
    
    const entity = new Toxoid.Entity(name);
    
    // Add animation components
    entity.add("Position");
    entity.add("Size");
    entity.add("FrameByFrameAnimation");
    entity.add("AnimatedSprite");
    entity.add("Renderable");
    
    // Set position
    entity.setComponent("Position", { x: x, y: y });
    
    // Configure frame-by-frame animation
    entity.setComponent("FrameByFrameAnimation", {
        current_frame: 0,
        frame_rate: 8.0,
        animation_timer: 0.0,
        total_frames: frameCount,
        is_looping: true,
        is_playing: true,
        frame_duration: 1.0 / 8.0,
        frame_width: 32,
        frame_height: 32,
        frames_per_row: 4,
        play_from_frame: -1,
        play_to_frame: -1,
        loop_mode: 1,
        forward_direction: true,
        last_update_time: 0
    });
    
    console.log(`[SpriteLoader] Created animated sprite ${name} with ID: ${entity.getId()}`);
    return entity;
}

// Function to demonstrate sprite scaling and color manipulation
function manipulateSpriteProperties(entity, scale, color) {
    console.log(`[SpriteLoader] Manipulating sprite properties for entity ${entity.getName()}`);
    
    // Add scale component
    entity.add("Scale");
    entity.setComponent("Scale", { scale: scale });
    
    // Add color component
    entity.add("Color");
    entity.setComponent("Color", {
        r: color.r,
        g: color.g,
        b: color.b,
        a: color.a
    });
    
    console.log(`[SpriteLoader] Applied scale ${scale} and color (${color.r}, ${color.g}, ${color.b}, ${color.a})`);
}

// Example usage: Create various sprite entities
try {
    // Create some basic sprites (note: actual sprite loading would need valid image paths)
    const sprite1 = createSpriteEntity("assets/sprites/priestess.png", "Priestess", 100, 100);
    const sprite2 = createSpriteEntity("assets/sprites/fighter.png", "Fighter", 200, 100);
    
    // Create animated sprite
    const animatedSprite = createAnimatedSprite("AnimatedCharacter", 300, 100, 8);
    
    // Manipulate sprite properties
    manipulateSpriteProperties(sprite1, 1.5, { r: 1.0, g: 0.8, b: 0.8, a: 1.0 }); // Slightly red tint
    manipulateSpriteProperties(sprite2, 0.8, { r: 0.8, g: 0.8, b: 1.0, a: 1.0 }); // Slightly blue tint
    
    // Demonstrate parent-child relationships for sprites
    const container = new Toxoid.Entity("SpriteContainer");
    container.add("Position");
    container.setComponent("Position", { x: 0, y: 0 });
    
    // Make sprites children of container
    sprite1.childOf(container.getId());
    sprite2.childOf(container.getId());
    
    console.log(`[SpriteLoader] Created sprite container with ${container.children().length} children`);
    
    // Create a system to move the container (which will move all child sprites)
    const spriteContainerSystem = Toxoid.System.create(
        "SpriteContainerMovement",
        "Position",
        Toxoid.Phases.ON_UPDATE,
        function(iter) {
            const entities = iter.entities();
            
            for (let entity of entities) {
                if (entity.getName() === "SpriteContainer") {
                    const position = entity.getComponent("Position");
                    if (position) {
                        // Move container in a circle
                        const time = Date.now() / 1000.0;
                        const newX = Math.cos(time) * 50;
                        const newY = Math.sin(time) * 50;
                        
                        entity.setComponent("Position", { x: newX, y: newY });
                    }
                    break;
                }
            }
        }
    );
    
    console.log("[SpriteLoader] Created sprite movement system");
    
} catch (error) {
    console.error("[SpriteLoader] Error in sprite loader example:", error);
}

console.log("[SpriteLoader] Sprite loader example completed successfully");