// Example script showing how to access KeyboardInput singleton from JavaScript
// This mimics the input.rs system but in JavaScript

// Create a system that processes player input using the KeyboardInput singleton
function playerInputSystem(iter) {
    iter.entities().forEach(entity => {
        // console.log(`Entity ID: ${entity.id}, Name: '${entity.name || 'unnamed'}'`);
        const position = entity.getComponent("Position");
        // if (position) {
        //     console.log("Position:", position.x, position.y);
        // } else {
        //     console.log("Position: null (entity has no Position component)");
        // }
        // Get KeyboardInput singleton (like World::get_singleton::<KeyboardInput>() in Rust)
        const keyboard = Toxoid.API.getSingleton("KeyboardInput");
        
        // if (!keyboard) {
        //     console.warn("KeyboardInput singleton not found");
        //     return;
        // }
        
        // console.log("KeyboardInput singleton found:", keyboard);
        // console.log("Up key:", keyboard.up);
        // console.log("Down key:", keyboard.down);
        // console.log("Left key:", keyboard.left);
        // console.log("Right key:", keyboard.right);

        if (keyboard.up) {
            // console.log("Up key pressed");
            position.y -= 5;  // Natural syntax!
        }
        if (keyboard.down) {
            // console.log("Down key pressed");
            position.y += 5;  // Natural syntax!
        }
        if (keyboard.left) {
            // console.log("Left key pressed");
            position.x -= 5;  // Natural syntax!
        }
        if (keyboard.right) {
            // console.log("Right key pressed");
            position.x += 5;  // Natural syntax!
        }
        
        // Focus on the sakura sprite for testing
        // if (entity.id === 980) {
        //     console.log(`*** SAKURA SPRITE (ID 980) - Position: ${position.x}, ${position.y} ***`);
        // }
    });

    
    // // Process each entity in the query
    // iter.entities().forEach(entity => {
    //     // Get the entity's components
    //     const position = entity.getComponent("Position");
        
    //     position.x += 1;
    //     // const direction = entity.getComponent("Direction");
    //     // const movementState = entity.getComponent("MovementState");
        
    //     // if (!position || !direction || !movementState) {
    //     //     console.warn("Entity missing required components");
    //     //     return;
    //     // }
        
    //     // // Read input state from the singleton properties
    //     // const up = keyboard.up;
    //     // const down = keyboard.down;
    //     // const left = keyboard.left;
    //     // const right = keyboard.right;
    //     // const space = keyboard.space;
        
    //     // console.log("Keyboard input:", { up, down, left, right, space });
        
    //     // // Calculate movement direction
    //     // let newDirection = 0; // DirectionEnum::None
        
    //     // if (up && !down && !left && !right) {
    //     //     newDirection = 1; // DirectionEnum::Up
    //     // } else if (!up && down && !left && !right) {
    //     //     newDirection = 2; // DirectionEnum::Down
    //     // } else if (!up && !down && left && !right) {
    //     //     newDirection = 3; // DirectionEnum::Left
    //     // } else if (!up && !down && !left && right) {
    //     //     newDirection = 4; // DirectionEnum::Right
    //     // } else if (up && !down && !left && right) {
    //     //     newDirection = 5; // DirectionEnum::UpRight
    //     // } else if (up && !down && left && !right) {
    //     //     newDirection = 6; // DirectionEnum::UpLeft
    //     // } else if (!up && down && !left && right) {
    //     //     newDirection = 7; // DirectionEnum::DownRight
    //     // } else if (!up && down && left && !right) {
    //     //     newDirection = 8; // DirectionEnum::DownLeft
    //     // }
        
    //     // // Update components
    //     // if (direction.set_direction) {
    //     //     direction.set_direction(newDirection);
    //     // } else {
    //     //     direction.direction = newDirection;
    //     // }
        
    //     // const isMoving = newDirection !== 0;
    //     // if (movementState.set_is_moving) {
    //     //     movementState.set_is_moving(isMoving);
    //     // } else {
    //     //     movementState.is_moving = isMoving;
    //     // }
        
    //     // // Update position if moving
    //     // if (isMoving && position.get_x && position.get_y && position.set_x && position.set_y) {
    //     //     const currentX = position.get_x();
    //     //     const currentY = position.get_y();
            
    //     //     // Simple movement (you'd typically use delta time in a real implementation)
    //     //     const speed = 3;
    //     //     let dx = 0, dy = 0;
            
    //     //     switch (newDirection) {
    //     //         case 1: dy = -speed; break; // Up
    //     //         case 2: dy = speed; break;  // Down
    //     //         case 3: dx = -speed; break; // Left
    //     //         case 4: dx = speed; break;  // Right
    //     //         case 5: dx = speed; dy = -speed; break; // UpRight
    //     //         case 6: dx = -speed; dy = -speed; break; // UpLeft
    //     //         case 7: dx = speed; dy = speed; break; // DownRight
    //     //         case 8: dx = -speed; dy = speed; break; // DownLeft
    //     //     }
            
    //     //     position.set_x(currentX + dx);
    //     //     position.set_y(currentY + dy);
            
    //     //     console.log("Moving entity to:", currentX + dx, currentY + dy);
    //     // }
    // });
}

// Register the system
// Note: This would typically be called during game initialization
function registerPlayerInputSystem() {
    try {
        // Create system with query for entities that have Position components
        // For now, just control all positioned entities until proper component adding is implemented
        const system = Toxoid.System.create("PlayerInputSystem", "Position, Sprite", Toxoid.Phases.ON_UPDATE, playerInputSystem);
        
        if (system) {
            console.log("Player input system registered successfully");
            return system;
        } else {
            console.error("Failed to register player input system");
        }
    } catch (error) {
        console.error("Error registering player input system:", error);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { playerInputSystem, registerPlayerInputSystem };
}

// Auto-register if this script is loaded directly
if (typeof Toxoid !== 'undefined') {
    registerPlayerInputSystem();
}

const sprite = Toxoid.API.createSprite("assets/sprites/sakura.png");
sprite.add("LocalPlayer");
sprite.add("Player");