// Example: Input Handling and Player Control
// This script demonstrates how to handle keyboard and mouse input through the Toxoid API

console.log("[InputHandler] Loading input handling example...");

// Input manager class to handle player controls
class InputManager {
    constructor() {
        this.playerEntity = null;
        this.moveSpeed = 100; // pixels per second
        this.lastInputState = {
            keyboard: {},
            mouse: {}
        };
        this.inputBuffer = [];
        this.bufferSize = 10;
    }
    
    // Initialize player entity for input control
    initializePlayer() {
        // Try to find existing player entity first
        const query = new Toxoid.Query("Position, LocalPlayer");
        query.build();
        const players = query.entities();
        
        if (players.length > 0) {
            this.playerEntity = players[0];
            console.log(`[InputHandler] Found existing player entity: ${this.playerEntity.getName()}`);
        } else {
            // Create a new player entity
            this.playerEntity = new Toxoid.Entity("InputControlledPlayer");
            this.playerEntity.add("Position");
            this.playerEntity.add("Size");
            this.playerEntity.add("Rect");
            this.playerEntity.add("Color");
            this.playerEntity.add("Renderable");
            this.playerEntity.add("LocalPlayer");
            
            // Set initial properties
            this.playerEntity.setComponent("Position", { x: 0, y: 0 });
            this.playerEntity.setComponent("Size", { width: 32, height: 32 });
            this.playerEntity.setComponent("Rect", { filled: true });
            this.playerEntity.setComponent("Color", { r: 0.0, g: 1.0, b: 0.0, a: 1.0 }); // Green player
            
            console.log("[InputHandler] Created new player entity for input control");
        }
        
        return this.playerEntity;
    }
    
    // Get current input state from singletons
    getCurrentInputState() {
        try {
            // Get keyboard input singleton
            const keyboardQuery = new Toxoid.Query("KeyboardInput");
            keyboardQuery.build();
            const keyboardEntities = keyboardQuery.entities();
            
            const mouseQuery = new Toxoid.Query("MouseInput");
            mouseQuery.build();
            const mouseEntities = mouseQuery.entities();
            
            let keyboard = {};
            let mouse = {};
            
            if (keyboardEntities.length > 0) {
                const keyboardComp = keyboardEntities[0].getComponent("KeyboardInput");
                if (keyboardComp) {
                    keyboard = {
                        up: keyboardComp.up || false,
                        down: keyboardComp.down || false,
                        left: keyboardComp.left || false,
                        right: keyboardComp.right || false,
                        w: keyboardComp.w || false,
                        a: keyboardComp.a || false,
                        s: keyboardComp.s || false,
                        d: keyboardComp.d || false,
                        space: keyboardComp.space || false,
                        enter: keyboardComp.enter || false,
                        escape: keyboardComp.escape || false
                    };
                }
            }
            
            if (mouseEntities.length > 0) {
                const mouseComp = mouseEntities[0].getComponent("MouseInput");
                if (mouseComp) {
                    mouse = {
                        x: mouseComp.x || 0,
                        y: mouseComp.y || 0,
                        dx: mouseComp.dx || 0,
                        dy: mouseComp.dy || 0,
                        left: mouseComp.left || false,
                        right: mouseComp.right || false,
                        middle: mouseComp.middle || false
                    };
                }
            }
            
            return { keyboard, mouse };
        } catch (error) {
            console.warn("[InputHandler] Could not get input state:", error);
            return { keyboard: {}, mouse: {} };
        }
    }
    
    // Process input and update player
    processInput(deltaTime) {
        if (!this.playerEntity) return;
        
        const inputState = this.getCurrentInputState();
        const keyboard = inputState.keyboard;
        const mouse = inputState.mouse;
        
        // Calculate movement vector
        let moveX = 0;
        let moveY = 0;
        
        // WASD or Arrow key movement
        if (keyboard.left || keyboard.a) moveX -= 1;
        if (keyboard.right || keyboard.d) moveX += 1;
        if (keyboard.up || keyboard.w) moveY -= 1;
        if (keyboard.down || keyboard.s) moveY += 1;
        
        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;
        }
        
        // Apply movement
        if (moveX !== 0 || moveY !== 0) {
            const position = this.playerEntity.getComponent("Position");
            if (position) {
                const newX = position.x + (moveX * this.moveSpeed * deltaTime);
                const newY = position.y + (moveY * this.moveSpeed * deltaTime);
                
                this.playerEntity.setComponent("Position", { 
                    x: Math.floor(newX), 
                    y: Math.floor(newY) 
                });
            }
        }
        
        // Handle mouse input for color changes
        if (mouse.left && !this.lastInputState.mouse.left) {
            // Left click - change to red
            this.playerEntity.setComponent("Color", { r: 1.0, g: 0.0, b: 0.0, a: 1.0 });
            console.log("[InputHandler] Left click - Player turned red");
        }
        
        if (mouse.right && !this.lastInputState.mouse.right) {
            // Right click - change to blue
            this.playerEntity.setComponent("Color", { r: 0.0, g: 0.0, b: 1.0, a: 1.0 });
            console.log("[InputHandler] Right click - Player turned blue");
        }
        
        // Handle special keys
        if (keyboard.space && !this.lastInputState.keyboard.space) {
            // Space - reset color to green
            this.playerEntity.setComponent("Color", { r: 0.0, g: 1.0, b: 0.0, a: 1.0 });
            console.log("[InputHandler] Space pressed - Player reset to green");
        }
        
        if (keyboard.enter && !this.lastInputState.keyboard.enter) {
            // Enter - reset position
            this.playerEntity.setComponent("Position", { x: 0, y: 0 });
            console.log("[InputHandler] Enter pressed - Player position reset");
        }
        
        // Store input state for next frame edge detection
        this.lastInputState = {
            keyboard: { ...keyboard },
            mouse: { ...mouse }
        };
        
        // Add to input buffer for analysis
        this.addToInputBuffer({
            timestamp: Date.now(),
            keyboard: { ...keyboard },
            mouse: { ...mouse }
        });
    }
    
    // Add input to buffer for pattern analysis
    addToInputBuffer(inputData) {
        this.inputBuffer.push(inputData);
        if (this.inputBuffer.length > this.bufferSize) {
            this.inputBuffer.shift();
        }
    }
    
    // Analyze input patterns
    analyzeInputPatterns() {
        if (this.inputBuffer.length < 3) return;
        
        // Look for rapid key sequences
        const recentInputs = this.inputBuffer.slice(-3);
        const keySequence = recentInputs.map(input => {
            const keys = [];
            if (input.keyboard.w) keys.push('W');
            if (input.keyboard.a) keys.push('A');
            if (input.keyboard.s) keys.push('S');
            if (input.keyboard.d) keys.push('D');
            return keys.join('');
        }).join('-');
        
        // Detect specific patterns
        if (keySequence.includes('W-S-W') || keySequence.includes('A-D-A')) {
            console.log("[InputHandler] Detected rapid back-and-forth movement");
        }
    }
    
    // Get player information
    getPlayerInfo() {
        if (!this.playerEntity) return null;
        
        const position = this.playerEntity.getComponent("Position");
        const color = this.playerEntity.getComponent("Color");
        
        return {
            id: this.playerEntity.getId(),
            name: this.playerEntity.getName(),
            position: position ? { x: position.x, y: position.y } : { x: 0, y: 0 },
            color: color ? { r: color.r, g: color.g, b: color.b, a: color.a } : { r: 1, g: 1, b: 1, a: 1 }
        };
    }
}

// Create global input manager
const inputManager = new InputManager();

// Initialize player
try {
    inputManager.initializePlayer();
    
    // Create input processing system
    const inputSystem = Toxoid.System.create(
        "InputProcessingSystem",
        "", // No specific components needed
        Toxoid.Phases.ON_UPDATE,
        function(iter) {
            const deltaTime = 1.0 / 60.0; // Assume 60 FPS
            inputManager.processInput(deltaTime);
            
            // Analyze patterns occasionally
            if (Math.random() < 0.01) { // 1% chance per frame
                inputManager.analyzeInputPatterns();
            }
        }
    );
    
    console.log("[InputHandler] Input processing system created");
    
    // Create some visual feedback entities
    const instructions = [
        "WASD/Arrow Keys: Move player",
        "Left Click: Turn red",
        "Right Click: Turn blue", 
        "Space: Reset color",
        "Enter: Reset position"
    ];
    
    // Note: Text entities might not be fully supported, so we'll just log instructions
    console.log("[InputHandler] Controls:");
    instructions.forEach(instruction => console.log(`  ${instruction}`));
    
    // Expose input manager globally for debugging
    if (typeof globalThis !== 'undefined') {
        globalThis.inputManager = inputManager;
        globalThis.getPlayerInfo = () => inputManager.getPlayerInfo();
        globalThis.setMoveSpeed = (speed) => { inputManager.moveSpeed = speed; };
    }
    
    console.log("[InputHandler] Input handler example initialized successfully");
    
} catch (error) {
    console.error("[InputHandler] Error in input handler example:", error);
}

console.log("[InputHandler] Input handling example loaded successfully");