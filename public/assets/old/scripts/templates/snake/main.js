// Snake Game - Main Entry Point
// This is the main entry point for the Snake game template
// Demonstrates rect rendering, grid-based movement, and game state management

console.log("[Snake] Loading Snake game...");

// Import other modules (conceptual - actual implementation would need to be inline or loaded separately)
// import { SnakeGame } from './snake.js';
// import { Food } from './food.js';
// import { RectRenderer } from './renderer.js';

// Game configuration
const GAME_CONFIG = {
    gridWidth: 20,
    gridHeight: 15,
    cellSize: 20,
    tickRate: 200, // milliseconds per game tick
    colors: {
        snake: { r: 0.0, g: 1.0, b: 0.0, a: 1.0 },    // Green
        food: { r: 1.0, g: 0.0, b: 0.0, a: 1.0 },     // Red
        background: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 }, // Dark gray
        border: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 }    // White
    }
};

// Game state
let gameState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    highScore: 0,
    gameOverMessage: "",
    lastTickTime: 0
};

// Snake game main class
class SnakeGameMain {
    constructor() {
        this.snake = null;
        this.food = null;
        this.renderer = null;
        this.entities = [];
        this.initialized = false;
    }
    
    // Initialize the game
    init() {
        console.log("[Snake] Initializing Snake game...");
        
        try {
            // Initialize renderer
            this.renderer = new RectRenderer(GAME_CONFIG);
            
            // Initialize game objects
            this.snake = new SnakeEntity(GAME_CONFIG);
            this.food = new FoodEntity(GAME_CONFIG);
            
            // Set up game field
            this.setupGameField();
            
            // Initialize snake
            this.snake.init(Math.floor(GAME_CONFIG.gridWidth / 2), Math.floor(GAME_CONFIG.gridHeight / 2));
            
            // Spawn first food
            this.spawnFood();
            
            // Set up input handling
            this.setupInput();
            
            // Create game systems
            this.createGameSystems();
            
            gameState.isRunning = true;
            gameState.lastTickTime = Date.now();
            this.initialized = true;
            
            console.log("[Snake] Game initialized successfully");
            this.logInstructions();
            
        } catch (error) {
            console.error("[Snake] Failed to initialize game:", error);
        }
    }
    
    // Set up game field borders
    setupGameField() {
        console.log("[Snake] Setting up game field...");
        
        // Calculate field position (centered)
        const fieldWidth = GAME_CONFIG.gridWidth * GAME_CONFIG.cellSize;
        const fieldHeight = GAME_CONFIG.gridHeight * GAME_CONFIG.cellSize;
        const fieldX = -fieldWidth / 2;
        const fieldY = -fieldHeight / 2;
        
        // Create border entities
        const borderThickness = 2;
        
        // Top border
        this.renderer.createRect("border_top", 
            fieldX - borderThickness, 
            fieldY - borderThickness, 
            fieldWidth + borderThickness * 2, 
            borderThickness, 
            GAME_CONFIG.colors.border, true);
        
        // Bottom border  
        this.renderer.createRect("border_bottom", 
            fieldX - borderThickness, 
            fieldY + fieldHeight, 
            fieldWidth + borderThickness * 2, 
            borderThickness, 
            GAME_CONFIG.colors.border, true);
        
        // Left border
        this.renderer.createRect("border_left", 
            fieldX - borderThickness, 
            fieldY, 
            borderThickness, 
            fieldHeight, 
            GAME_CONFIG.colors.border, true);
        
        // Right border
        this.renderer.createRect("border_right", 
            fieldX + fieldWidth, 
            fieldY, 
            borderThickness, 
            fieldHeight, 
            GAME_CONFIG.colors.border, true);
        
        console.log("[Snake] Game field borders created");
    }
    
    // Set up input handling
    setupInput() {
        console.log("[Snake] Setting up input handling...");
        
        // Input will be handled in the update system
        // Store current input state for edge detection
        this.lastInputState = {
            up: false,
            down: false,
            left: false,
            right: false,
            space: false,
            enter: false,
            escape: false
        };
    }
    
    // Create game update systems
    createGameSystems() {
        console.log("[Snake] Creating game systems...");
        
        // Main game update system
        const gameUpdateSystem = Toxoid.System.create(
            "SnakeGameUpdate",
            "",
            Toxoid.Phases.ON_UPDATE,
            (iter) => {
                if (!this.initialized) return;
                
                this.handleInput();
                this.updateGame();
            }
        );
        
        console.log("[Snake] Game systems created");
    }
    
    // Handle input
    handleInput() {
        try {
            // Get keyboard input
            const keyboardQuery = new Toxoid.Query("KeyboardInput");
            keyboardQuery.build();
            const keyboardEntities = keyboardQuery.entities();
            
            if (keyboardEntities.length > 0) {
                const keyboardComp = keyboardEntities[0].getComponent("KeyboardInput");
                if (keyboardComp) {
                    // Movement input (only on key press, not hold)
                    if (keyboardComp.up && !this.lastInputState.up) {
                        this.snake.changeDirection(0, -1);
                    }
                    if (keyboardComp.down && !this.lastInputState.down) {
                        this.snake.changeDirection(0, 1);
                    }
                    if (keyboardComp.left && !this.lastInputState.left) {
                        this.snake.changeDirection(-1, 0);
                    }
                    if (keyboardComp.right && !this.lastInputState.right) {
                        this.snake.changeDirection(1, 0);
                    }
                    
                    // Game control input
                    if (keyboardComp.space && !this.lastInputState.space) {
                        this.togglePause();
                    }
                    if (keyboardComp.enter && !this.lastInputState.enter) {
                        if (!gameState.isRunning) {
                            this.restartGame();
                        }
                    }
                    if (keyboardComp.escape && !this.lastInputState.escape) {
                        this.exitGame();
                    }
                    
                    // Store current state for next frame
                    this.lastInputState = {
                        up: keyboardComp.up,
                        down: keyboardComp.down,
                        left: keyboardComp.left,
                        right: keyboardComp.right,
                        space: keyboardComp.space,
                        enter: keyboardComp.enter,
                        escape: keyboardComp.escape
                    };
                }
            }
        } catch (error) {
            // Input handling errors are not critical
        }
    }
    
    // Main game update loop
    updateGame() {
        if (!gameState.isRunning || gameState.isPaused) return;
        
        const currentTime = Date.now();
        
        if (currentTime - gameState.lastTickTime >= GAME_CONFIG.tickRate) {
            this.gameTick();
            gameState.lastTickTime = currentTime;
        }
    }
    
    // Game tick (main game logic update)
    gameTick() {
        // Update snake
        this.snake.update();
        
        // Check boundaries
        if (this.snake.isOutOfBounds(GAME_CONFIG.gridWidth, GAME_CONFIG.gridHeight)) {
            this.gameOver("Snake hit the wall!");
            return;
        }
        
        // Check self collision
        if (this.snake.checkSelfCollision()) {
            this.gameOver("Snake hit itself!");
            return;
        }
        
        // Check food collision
        if (this.snake.checkFoodCollision(this.food.getPosition())) {
            this.snake.grow();
            gameState.score += 10;
            this.spawnFood();
            
            console.log(`[Snake] Food eaten! Score: ${gameState.score}`);
            
            // Increase speed slightly
            GAME_CONFIG.tickRate = Math.max(100, GAME_CONFIG.tickRate - 2);
        }
        
        // Update visual representation
        this.updateVisuals();
    }
    
    // Spawn new food
    spawnFood() {
        let attempts = 0;
        let position;
        
        do {
            position = {
                x: Math.floor(Math.random() * GAME_CONFIG.gridWidth),
                y: Math.floor(Math.random() * GAME_CONFIG.gridHeight)
            };
            attempts++;
        } while (this.snake.occupiesPosition(position.x, position.y) && attempts < 100);
        
        this.food.spawn(position.x, position.y);
        console.log(`[Snake] Food spawned at (${position.x}, ${position.y})`);
    }
    
    // Update visual representation
    updateVisuals() {
        // Update snake visuals
        this.snake.updateVisuals(this.renderer);
        
        // Update food visuals
        this.food.updateVisuals(this.renderer);
    }
    
    // Toggle pause
    togglePause() {
        gameState.isPaused = !gameState.isPaused;
        console.log(`[Snake] Game ${gameState.isPaused ? 'paused' : 'resumed'}`);
    }
    
    // Game over
    gameOver(message) {
        gameState.isRunning = false;
        gameState.gameOverMessage = message;
        
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            console.log(`[Snake] New high score: ${gameState.highScore}!`);
        }
        
        console.log(`[Snake] Game Over: ${message}`);
        console.log(`[Snake] Final Score: ${gameState.score}`);
        console.log(`[Snake] Press ENTER to restart`);
    }
    
    // Restart game
    restartGame() {
        console.log("[Snake] Restarting game...");
        
        // Reset game state
        gameState.isRunning = true;
        gameState.isPaused = false;
        gameState.score = 0;
        gameState.gameOverMessage = "";
        GAME_CONFIG.tickRate = 200;
        
        // Reset snake
        this.snake.reset(Math.floor(GAME_CONFIG.gridWidth / 2), Math.floor(GAME_CONFIG.gridHeight / 2));
        
        // Spawn new food
        this.spawnFood();
        
        // Update visuals
        this.updateVisuals();
        
        console.log("[Snake] Game restarted");
    }
    
    // Exit game
    exitGame() {
        console.log("[Snake] Exiting game...");
        gameState.isRunning = false;
        
        // Clean up entities
        this.cleanup();
    }
    
    // Clean up
    cleanup() {
        if (this.snake) this.snake.cleanup();
        if (this.food) this.food.cleanup();
        if (this.renderer) this.renderer.cleanup();
        
        console.log("[Snake] Game cleaned up");
    }
    
    // Log instructions
    logInstructions() {
        console.log("[Snake] === SNAKE GAME CONTROLS ===");
        console.log("[Snake] Arrow Keys / WASD: Move snake");
        console.log("[Snake] SPACE: Pause/Resume");
        console.log("[Snake] ENTER: Restart (when game over)");
        console.log("[Snake] ESCAPE: Exit game");
        console.log("[Snake] ================================");
    }
    
    // Get current game state
    getGameState() {
        return {
            ...gameState,
            snakeLength: this.snake ? this.snake.getLength() : 0,
            foodPosition: this.food ? this.food.getPosition() : null
        };
    }
}

// Note: Since we can't use ES6 modules, we need to include all classes inline
// This would normally be in separate files

// Rect renderer class
class RectRenderer {
    constructor(config) {
        this.config = config;
        this.entities = new Map();
    }
    
    createRect(name, x, y, width, height, color, filled) {
        try {
            const entity = new Toxoid.Entity(name);
            entity.add("Position");
            entity.add("Size");
            entity.add("Rect");
            entity.add("Color");
            entity.add("Renderable");
            
            entity.setComponent("Position", { x: Math.floor(x), y: Math.floor(y) });
            entity.setComponent("Size", { width: width, height: height });
            entity.setComponent("Rect", { filled: filled });
            entity.setComponent("Color", color);
            
            this.entities.set(name, entity);
            return entity;
        } catch (error) {
            console.error(`[Snake] Failed to create rect ${name}:`, error);
            return null;
        }
    }
    
    updateRect(name, x, y, width, height, color) {
        const entity = this.entities.get(name);
        if (entity) {
            entity.setComponent("Position", { x: Math.floor(x), y: Math.floor(y) });
            if (width !== undefined && height !== undefined) {
                entity.setComponent("Size", { width: width, height: height });
            }
            if (color) {
                entity.setComponent("Color", color);
            }
        }
    }
    
    removeRect(name) {
        const entity = this.entities.get(name);
        if (entity) {
            entity.destruct();
            this.entities.delete(name);
        }
    }
    
    cleanup() {
        this.entities.forEach((entity, name) => {
            entity.destruct();
        });
        this.entities.clear();
    }
}

// Snake entity class
class SnakeEntity {
    constructor(config) {
        this.config = config;
        this.segments = [];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.growthQueue = 0;
    }
    
    init(startX, startY) {
        this.segments = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.growthQueue = 0;
    }
    
    changeDirection(dx, dy) {
        // Prevent reversing into self
        if (this.direction.x === -dx && this.direction.y === -dy) {
            return;
        }
        
        this.nextDirection = { x: dx, y: dy };
    }
    
    update() {
        // Update direction
        this.direction = { ...this.nextDirection };
        
        // Calculate new head position
        const head = this.segments[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };
        
        // Add new head
        this.segments.unshift(newHead);
        
        // Remove tail unless growing
        if (this.growthQueue > 0) {
            this.growthQueue--;
        } else {
            this.segments.pop();
        }
    }
    
    grow() {
        this.growthQueue += 1;
    }
    
    checkSelfCollision() {
        const head = this.segments[0];
        return this.segments.slice(1).some(segment => 
            segment.x === head.x && segment.y === head.y
        );
    }
    
    isOutOfBounds(gridWidth, gridHeight) {
        const head = this.segments[0];
        return head.x < 0 || head.x >= gridWidth || 
               head.y < 0 || head.y >= gridHeight;
    }
    
    occupiesPosition(x, y) {
        return this.segments.some(segment => 
            segment.x === x && segment.y === y
        );
    }
    
    checkFoodCollision(foodPos) {
        const head = this.segments[0];
        return head.x === foodPos.x && head.y === foodPos.y;
    }
    
    updateVisuals(renderer) {
        // Remove old segment visuals
        for (let i = 0; i < 200; i++) {
            renderer.removeRect(`snake_segment_${i}`);
        }
        
        // Create new segment visuals
        this.segments.forEach((segment, index) => {
            const worldX = (segment.x * this.config.cellSize) - (this.config.gridWidth * this.config.cellSize / 2);
            const worldY = (segment.y * this.config.cellSize) - (this.config.gridHeight * this.config.cellSize / 2);
            
            // Head is slightly brighter
            const color = index === 0 ? 
                { r: 0.0, g: 1.0, b: 0.5, a: 1.0 } : 
                this.config.colors.snake;
            
            renderer.createRect(
                `snake_segment_${index}`,
                worldX,
                worldY,
                this.config.cellSize - 1,
                this.config.cellSize - 1,
                color,
                true
            );
        });
    }
    
    reset(startX, startY) {
        this.init(startX, startY);
    }
    
    getLength() {
        return this.segments.length;
    }
    
    cleanup() {
        // Visuals will be cleaned up by renderer
    }
}

// Food entity class
class FoodEntity {
    constructor(config) {
        this.config = config;
        this.position = { x: 0, y: 0 };
    }
    
    spawn(x, y) {
        this.position = { x: x, y: y };
    }
    
    getPosition() {
        return { ...this.position };
    }
    
    updateVisuals(renderer) {
        const worldX = (this.position.x * this.config.cellSize) - (this.config.gridWidth * this.config.cellSize / 2);
        const worldY = (this.position.y * this.config.cellSize) - (this.config.gridHeight * this.config.cellSize / 2);
        
        renderer.createRect(
            "food",
            worldX,
            worldY,
            this.config.cellSize - 1,
            this.config.cellSize - 1,
            this.config.colors.food,
            true
        );
    }
    
    cleanup() {
        // Visuals will be cleaned up by renderer
    }
}

// Initialize and start the game
try {
    const snakeGame = new SnakeGameMain();
    snakeGame.init();
    
    // Expose game globally for debugging
    if (typeof globalThis !== 'undefined') {
        globalThis.snakeGame = snakeGame;
        globalThis.getSnakeGameState = () => snakeGame.getGameState();
        globalThis.restartSnakeGame = () => snakeGame.restartGame();
        globalThis.pauseSnakeGame = () => snakeGame.togglePause();
    }
    
    console.log("[Snake] Snake game loaded and ready to play!");
    
} catch (error) {
    console.error("[Snake] Failed to load Snake game:", error);
}

console.log("[Snake] Snake game main script loaded successfully");