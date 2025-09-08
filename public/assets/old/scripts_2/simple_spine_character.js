// Simple Spine Character Example
// A minimal example showing spine animation with keyboard control

console.log("[SpineExample] Starting simple spine character example...");

// Global character reference
let playerCharacter = null;
let currentAnimation = "idle_down";

// Initialize character when Toxoid is ready
function initCharacter() {
    try {
        console.log("[SpineExample] Loading spine animation prefab...");
        
        // Load the spine animation prefab with callback
        Toxoid.API.loadSpineAnimation(
            "assets/animations/character/character.atlas",
            "assets/animations/character/character.json",
            "character",
            false,  // Don't render the prefab itself
            function(prefab) {  // Callback when prefab is loaded
                console.log("[SpineExample] ✓ Prefab loaded in callback, ID:", prefab.id);
                
                // Now create an instance from the prefab
                const character = Toxoid.API.createSpineAnimation(
                    "assets/animations/character/character.atlas",
                    "assets/animations/character/character.json",
                    "character"
                );
                
                if (character && character.id) {
                    console.log("[SpineExample] ✓ Character created, ID:", character.id);
                    playerCharacter = character;
                    
                    // Add player tags
                    character.add("Player");
                    character.add("LocalPlayer");
                    
                    // Set initial position
                    const pos = character.getComponent("Position");
                    if (pos) {
                        pos.x = 400;
                        pos.y = 300;
                        console.log("[SpineExample] Character at:", pos.x, pos.y);
                    }
                    
                    // Setup animation
                    const spineInstance = character.getComponent("SpineInstance");
                    if (spineInstance) {
                        spineInstance.current_animation = "idle_down";
                        console.log("[SpineExample] Initial animation set");
                    }
                } else {
                    console.error("[SpineExample] Failed to create character instance");
                }
            }
        );
    } catch (error) {
        console.error("[SpineExample] Error creating character:", error);
    }
}

// Simple movement system
function movementSystem() {
    if (!playerCharacter) return;
    
    const keyboard = Toxoid.API.getSingleton("KeyboardInput");
    if (!keyboard) return;
    
    const pos = playerCharacter.getComponent("Position");
    const spine = playerCharacter.getComponent("SpineInstance");
    if (!pos || !spine) return;
    
    // Movement
    let dx = 0, dy = 0;
    let moving = false;
    let direction = "down";
    
    if (keyboard.up) {
        dy = -3;
        direction = "up";
        moving = true;
    }
    if (keyboard.down) {
        dy = 3;
        direction = "down";
        moving = true;
    }
    if (keyboard.left) {
        dx = -3;
        direction = "left";
        moving = true;
    }
    if (keyboard.right) {
        dx = 3;
        direction = "right";
        moving = true;
    }
    
    // Update position
    pos.x += dx;
    pos.y += dy;
    
    // Update animation
    const newAnimation = moving ? `walk_${direction}` : `idle_${direction}`;
    if (newAnimation !== currentAnimation) {
        spine.current_animation = newAnimation;
        currentAnimation = newAnimation;
        console.log("[SpineExample] Animation:", newAnimation);
    }
}

// Register system
function registerSystem() {
    const system = Toxoid.System.create(
        "SimpleSpineMovement",
        "Position",
        Toxoid.Phases.ON_UPDATE,
        movementSystem
    );
    
    if (system) {
        console.log("[SpineExample] ✓ System registered");
    }
}

// Wait for Toxoid and initialize
function start() {
    if (typeof Toxoid !== 'undefined' && Toxoid.API) {
        initCharacter();
        registerSystem();
        console.log("[SpineExample] Use arrow keys to move!");
    } else {
        setTimeout(start, 100);
    }
}

start();