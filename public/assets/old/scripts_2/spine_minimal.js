// Minimal Spine Animation Example
// Shows the correct order: load prefab first, then create instances

console.log("[Spine] Starting minimal spine example...");

// Global reference to our character
let playerCharacter = null;

// Load the prefab with a callback
Toxoid.API.loadSpineAnimation(
    "assets/animations/character/character.atlas",
    "assets/animations/character/character.json",
    "character",
    false,  // Don't render the prefab
    function(prefab) {
        console.log("[Spine] ✓ Prefab loaded in callback:", prefab.id);
        
        // Now create an instance from the prefab
        const character = Toxoid.API.createSpineAnimation(
            "assets/animations/character/character.atlas",
            "assets/animations/character/character.json",
            "character"
        );
        
        if (character) {
            console.log("[Spine] ✓ Character created:", character.id);
            playerCharacter = character;
            
            // Setup the character
            character.add("Player");
            character.add("LocalPlayer");
            
            const pos = character.getComponent("Position");
            if (pos) {
                pos.x = 400;
                pos.y = 300;
                console.log("[Spine] Position set:", pos.x, pos.y);
            }
            
            // Add required animation components
            if (!character.has("Direction")) {
                character.add("Direction");
            }
            if (!character.has("MovementState")) {
                character.add("MovementState");
            }
            if (!character.has("AnimationState")) {
                character.add("AnimationState");
            }
            if (!character.has("AttackState")) {
                character.add("AttackState");
            }
            if (!character.has("CombatAnimationState")) {
                character.add("CombatAnimationState");
            }
            
            // Set initial animation through AnimationState
            character.setComponent("AnimationState", {
                current_animation: "idle_down",
                last_valid_direction: 2 // Down
            });
            console.log("[Spine] Animation set to idle_down");
            
            console.log("[Spine] ✓ Setup complete. Use arrow keys to move!");
        } else {
            console.error("[Spine] Failed to create character");
        }
    }
);

// Create a simple movement system
Toxoid.System.create("SpineMove", "Position", 4, function() {
    if (!playerCharacter) return;
    
    const kb = Toxoid.API.getSingleton("KeyboardInput");
    if (!kb) return;
    
    const p = playerCharacter.getComponent("Position");
    const animState = playerCharacter.getComponent("AnimationState");
    const movementState = playerCharacter.getComponent("MovementState");
    const direction = playerCharacter.getComponent("Direction");
    
    if (!p || !animState) return;
    
    // Move and animate
    let anim = "idle_down";
    let moved = false;
    let dir = 2; // Down
    
    if (kb.up) { 
        p.y -= 3; 
        anim = "walk_up"; 
        moved = true;
        dir = 1; // Up
    } else if (kb.down) { 
        p.y += 3; 
        anim = "walk_down"; 
        moved = true;
        dir = 2; // Down
    } else if (kb.left) { 
        p.x -= 3; 
        anim = "walk_left"; 
        moved = true;
        dir = 3; // Left
    } else if (kb.right) { 
        p.x += 3; 
        anim = "walk_right"; 
        moved = true;
        dir = 4; // Right
    }
    
    // If not moving, use idle animation for current direction
    if (!moved) {
        const lastDir = animState.last_valid_direction || 2;
        switch(lastDir) {
            case 1: anim = "idle_up"; break;
            case 2: anim = "idle_down"; break;
            case 3: anim = "idle_left"; break;
            case 4: anim = "idle_right"; break;
            default: anim = "idle_down";
        }
    }
    
    // Update movement state
    if (movementState) {
        playerCharacter.setComponent("MovementState", {
            is_moving: moved
        });
    }
    
    // Update direction
    if (direction && moved) {
        playerCharacter.setComponent("Direction", {
            direction: dir
        });
    }
    
    // Only change animation if needed
    if (animState.current_animation !== anim) {
        playerCharacter.setComponent("AnimationState", {
            current_animation: anim,
            last_valid_direction: moved ? dir : (animState.last_valid_direction || 2)
        });
    }
});

console.log("[Spine] Script loaded. Waiting for prefab load callback...");