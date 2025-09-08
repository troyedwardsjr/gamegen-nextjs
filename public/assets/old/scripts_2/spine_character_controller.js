// Spine Character Controller Example
// 
// This script demonstrates:
// - Loading a spine animation character
// - Handling keyboard input for movement
// - Updating animations based on movement state
// - Managing animation transitions smoothly

console.log("[SpineCharacter] Initializing Spine Character Controller...");

// Character state management
const CharacterState = {
    entity: null,
    isMoving: false,
    currentDirection: "down",
    currentAnimation: "idle_down",
    velocity: { x: 0, y: 0 },
    speed: 150, // pixels per second
    animations: {
        idle_up: "idle_up",
        idle_down: "idle_down",
        idle_left: "idle_left",
        idle_right: "idle_right",
        walk_up: "walk_up",
        walk_down: "walk_down",
        walk_left: "walk_left",
        walk_right: "walk_right",
        attack_up: "attack_up",
        attack_down: "attack_down",
        attack_left: "attack_left",
        attack_right: "attack_right"
    }
};

// Direction enum matching the Rust implementation
const Direction = {
    None: 0,
    Up: 1,
    Down: 2,
    Left: 3,
    Right: 4,
    UpRight: 5,
    UpLeft: 6,
    DownRight: 7,
    DownLeft: 8
};

// Initialize the character
function initializeCharacter() {
    console.log("[SpineCharacter] Loading spine animation character...");
    
    // Load the spine animation character
    const atlasPath = "assets/animations/character/character.atlas";
    const skeletonPath = "assets/animations/character/character.json";
    const textureName = "character";
    
    try {
        // Load the prefab with callback for proper async handling
        Toxoid.API.loadSpineAnimation(
            atlasPath, 
            skeletonPath, 
            textureName, 
            false,  // Don't render the prefab
            function(prefab) {  // Callback when prefab is loaded
                console.log("[SpineCharacter] ✓ Spine prefab loaded, entity ID:", prefab.id);
                
                // Now create an instance of the character
                const character = Toxoid.API.createSpineAnimation(atlasPath, skeletonPath, textureName);
                
                if (character && character.id) {
                    console.log("[SpineCharacter] ✓ Character instance created, ID:", character.id);
                    
                    // Store the character entity
                    CharacterState.entity = character;
                    
                    // Add necessary components for gameplay
                    character.add("Player");
                    character.add("LocalPlayer");
                    
                    // Set initial position
                    const position = character.getComponent("Position");
                    if (position) {
                        position.x = 400;
                        position.y = 300;
                        console.log("[SpineCharacter] Character positioned at:", position.x, position.y);
                    }
                    
                    // Check for SpineInstance component
                    const spineInstance = character.getComponent("SpineInstance");
                    if (spineInstance) {
                        console.log("[SpineCharacter] SpineInstance component found");
                        // Set initial animation
                        setCharacterAnimation("idle_down");
                    }
                    
                    // Add Direction component if needed
                    if (!character.has("Direction")) {
                        character.add("Direction");
                    }
                    
                    // Add MovementState component if needed
                    if (!character.has("MovementState")) {
                        character.add("MovementState");
                    }
                    
                    // Add AnimationState component (required by Rust animation system)
                    if (!character.has("AnimationState")) {
                        character.add("AnimationState");
                        character.setComponent("AnimationState", {
                            current_animation: "idle_down",
                            last_valid_direction: 2 // DirectionEnum::Down
                        });
                    }
                    
                    // Add AttackState component for attack animations
                    if (!character.has("AttackState")) {
                        character.add("AttackState");
                    }
                    
                    // Add CombatAnimationState for hurt/death animations
                    if (!character.has("CombatAnimationState")) {
                        character.add("CombatAnimationState");
                    }
                    
                    console.log("[SpineCharacter] ✓ Character initialization complete");
                } else {
                    console.error("[SpineCharacter] Failed to create character instance");
                }
            }
        );
        
    } catch (error) {
        console.error("[SpineCharacter] Error loading character:", error.message);
    }
}

// Setup character with components
function setupCharacter(character) {
    character.add("Player");
    character.add("LocalPlayer");
    
    const position = character.getComponent("Position");
    if (position) {
        position.x = 400;
        position.y = 300;
    }
    
    if (!character.has("Direction")) {
        character.add("Direction");
    }
    
    if (!character.has("MovementState")) {
        character.add("MovementState");
    }
}

// Set character animation
function setCharacterAnimation(animationName) {
    if (!CharacterState.entity) return;
    
    // Check if AnimationState component exists, add if not
    if (!CharacterState.entity.has("AnimationState")) {
        CharacterState.entity.add("AnimationState");
    }
    
    const animState = CharacterState.entity.getComponent("AnimationState");
    const spineInstance = CharacterState.entity.getComponent("SpineInstance");
    
    // Only update if animation actually changed
    if (animState && animState.current_animation !== animationName) {
        console.log("[SpineCharacter] Changing animation to:", animationName);
        
        // Update AnimationState component (this is what the Rust system checks)
        CharacterState.entity.setComponent("AnimationState", {
            current_animation: animationName,
            last_valid_direction: animState.last_valid_direction || 2 // Default to Down
        });
        
        // Also update SpineInstance for consistency
        if (spineInstance) {
            CharacterState.entity.setComponent("SpineInstance", {
                current_animation: animationName
            });
        }
        
        CharacterState.currentAnimation = animationName;
    }
}

// Get animation name based on direction and movement state
function getAnimationName(direction, isMoving) {
    const prefix = isMoving ? "walk" : "idle";
    
    let directionStr = "down"; // default
    switch (direction) {
        case Direction.Up:
            directionStr = "up";
            break;
        case Direction.Down:
            directionStr = "down";
            break;
        case Direction.Left:
            directionStr = "left";
            break;
        case Direction.Right:
            directionStr = "right";
            break;
        case Direction.UpRight:
        case Direction.DownRight:
            directionStr = "right";
            break;
        case Direction.UpLeft:
        case Direction.DownLeft:
            directionStr = "left";
            break;
    }
    
    return `${prefix}_${directionStr}`;
}

// Character movement and animation system
function characterControllerSystem() {
    if (!CharacterState.entity) return;
    
    // Get keyboard input singleton
    const keyboard = Toxoid.API.getSingleton("KeyboardInput");
    if (!keyboard) return;
    
    // Get entity components
    const position = CharacterState.entity.getComponent("Position");
    const direction = CharacterState.entity.getComponent("Direction");
    const movementState = CharacterState.entity.getComponent("MovementState");
    
    if (!position) return;
    
    // Calculate movement direction based on input
    let moveX = 0;
    let moveY = 0;
    let newDirection = Direction.None;
    
    if (keyboard.up) moveY = -1;
    if (keyboard.down) moveY = 1;
    if (keyboard.left) moveX = -1;
    if (keyboard.right) moveX = 1;
    
    // Determine direction enum
    if (moveY < 0 && moveX === 0) newDirection = Direction.Up;
    else if (moveY > 0 && moveX === 0) newDirection = Direction.Down;
    else if (moveX < 0 && moveY === 0) newDirection = Direction.Left;
    else if (moveX > 0 && moveY === 0) newDirection = Direction.Right;
    else if (moveY < 0 && moveX > 0) newDirection = Direction.UpRight;
    else if (moveY < 0 && moveX < 0) newDirection = Direction.UpLeft;
    else if (moveY > 0 && moveX > 0) newDirection = Direction.DownRight;
    else if (moveY > 0 && moveX < 0) newDirection = Direction.DownLeft;
    
    // Update movement state
    const isMoving = (moveX !== 0 || moveY !== 0);
    CharacterState.isMoving = isMoving;
    
    // Update direction component if available
    if (direction && newDirection !== Direction.None) {
        direction.direction = newDirection;
        CharacterState.currentDirection = newDirection;
    }
    
    // Update movement state component if available
    if (movementState) {
        movementState.is_moving = isMoving;
    }
    
    // Apply movement
    if (isMoving) {
        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707; // 1/sqrt(2)
            moveY *= 0.707;
        }
        
        // Apply speed and frame-independent movement
        // Note: In a real implementation, you'd use delta time
        const speed = CharacterState.speed * 0.016; // Assuming 60 FPS
        position.x += moveX * speed;
        position.y += moveY * speed;
    }
    
    // Update animation based on state
    const animationName = getAnimationName(
        newDirection !== Direction.None ? newDirection : CharacterState.currentDirection,
        isMoving
    );
    
    if (animationName !== CharacterState.currentAnimation) {
        setCharacterAnimation(animationName);
    }
    
    // Handle attack input (space key)
    if (keyboard.space) {
        const attackAnimation = getAttackAnimation(CharacterState.currentDirection);
        setCharacterAnimation(attackAnimation);
    }
}

// Get attack animation name
function getAttackAnimation(direction) {
    let directionStr = "down";
    switch (direction) {
        case Direction.Up:
            directionStr = "up";
            break;
        case Direction.Down:
            directionStr = "down";
            break;
        case Direction.Left:
            directionStr = "left";
            break;
        case Direction.Right:
            directionStr = "right";
            break;
        default:
            directionStr = "down";
    }
    return `attack_${directionStr}`;
}

// Register the character controller system
function registerCharacterControllerSystem() {
    try {
        // Query for entities with SpineInstance component
        const system = Toxoid.System.create(
            "CharacterControllerSystem",
            "Position, SpineInstance",
            Toxoid.Phases.ON_UPDATE,
            characterControllerSystem
        );
        
        if (system) {
            console.log("[SpineCharacter] ✓ Character controller system registered");
            return system;
        } else {
            console.error("[SpineCharacter] Failed to register character controller system");
        }
    } catch (error) {
        console.error("[SpineCharacter] Error registering system:", error);
    }
}

// Initialize when Toxoid is ready
function waitForToxoid() {
    if (typeof Toxoid !== 'undefined' && Toxoid.API && Toxoid.System) {
        console.log("[SpineCharacter] Toxoid is ready, initializing...");
        
        // Initialize character
        initializeCharacter();
        
        // Register controller system
        registerCharacterControllerSystem();
        
        // Add some UI hints
        console.log("[SpineCharacter] Controls:");
        console.log("  - Arrow Keys or WASD: Move character");
        console.log("  - Space: Attack");
        console.log("  - Character will animate based on movement");
        
    } else {
        console.log("[SpineCharacter] Waiting for Toxoid...");
        setTimeout(waitForToxoid, 100);
    }
}

// Start initialization
waitForToxoid();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CharacterState,
        initializeCharacter,
        setCharacterAnimation,
        characterControllerSystem,
        registerCharacterControllerSystem
    };
}