/**
 * Snake Game Script
 * A complete snake game implementation using the simplified ECS scripting API
 * Uses tag-based components and singleton state management like the bullet hell example
 */

console.log("[Snake] Starting initialization...");

// ===== COMPONENT REGISTRATION =====
console.log("[Snake] Registering components...");

// Game state singletons with simplified schemas
const SnakeGameState = Toxoid.API.registerSingleton("SnakeGameState", [
    { name: "score", type: "number" },
    { name: "direction_x", type: "number" },
    { name: "direction_y", type: "number" },
    { name: "next_direction_x", type: "number" },
    { name: "next_direction_y", type: "number" },
    { name: "game_over", type: "boolean" },
    { name: "paused", type: "boolean" },
    { name: "move_timer", type: "number" },
    { name: "grid_size", type: "number" },
    { name: "game_width", type: "number" },
    { name: "game_height", type: "number" }
]);

const SnakeAssetState = Toxoid.API.registerSingleton("SnakeAssetState", [
    { name: "font_loaded", type: "boolean" }
]);

const SnakeScoreText = Toxoid.API.registerSingleton("SnakeScoreText", [
    { name: "score_text_entity_id", type: "entity" }
]);

const SnakeFoodState = Toxoid.API.registerSingleton("SnakeFoodState", [
    { name: "food_entity_id", type: "entity" },
    { name: "food_x", type: "number" },
    { name: "food_y", type: "number" }
]);

// Component tags (no data attached)
Toxoid.registerComponent("SnakeSegment");
Toxoid.registerComponent("SnakeHead");
Toxoid.registerComponent("SnakeFood");

console.log("[Snake] Components registered successfully!");

// ===== GAME CONFIG =====
const CONFIG = {
    GRID_SIZE: 25,
    GAME_WIDTH: 800,
    GAME_HEIGHT: 600,
    INITIAL_SNAKE_LENGTH: 3,
    GAME_SPEED: 120, // milliseconds between moves
    COLORS: {
        SNAKE_HEAD: { r: 0.2, g: 0.8, b: 0.2, a: 1.0 }, // Bright green
        SNAKE_BODY: { r: 0.1, g: 0.6, b: 0.1, a: 1.0 }, // Dark green
        FOOD: { r: 0.9, g: 0.1, b: 0.1, a: 1.0 },        // Red
    }
};

// Snake segments stored as simple array (not in ECS)
let snakeSegments = [];

// ===== HELPER FUNCTIONS =====
function getGameState() {
    return SnakeGameState;
}

function getAssetState() {
    return SnakeAssetState;
}

function getScoreTextRef() {
    return SnakeScoreText;
}

function getFoodState() {
    return SnakeFoodState;
}

function initializeGameState() {
    const gameState = getGameState();
    if (gameState) {
        gameState.score = 0;
        gameState.direction_x = 1;
        gameState.direction_y = 0;
        gameState.next_direction_x = 1;
        gameState.next_direction_y = 0;
        gameState.game_over = false;
        gameState.paused = false;
        gameState.move_timer = 0;
        gameState.grid_size = CONFIG.GRID_SIZE;
        gameState.game_width = CONFIG.GAME_WIDTH;
        gameState.game_height = CONFIG.GAME_HEIGHT;
    }
    
    const assetState = getAssetState();
    if (assetState) {
        assetState.font_loaded = false;
    }
    
    const scoreTextRef = getScoreTextRef();
    if (scoreTextRef) {
        scoreTextRef.score_text_entity_id = 0;
    }
    
    const foodState = getFoodState();
    if (foodState) {
        foodState.food_entity_id = 0;
        foodState.food_x = 0;
        foodState.food_y = 0;
    }
    
    console.log("[Snake] ECS singletons initialized");
}

function gridToScreen(gridX, gridY) {
    return {
        x: gridX * CONFIG.GRID_SIZE + (CONFIG.GAME_WIDTH - (Math.floor(CONFIG.GAME_WIDTH / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE)) / 2,
        y: gridY * CONFIG.GRID_SIZE + (CONFIG.GAME_HEIGHT - (Math.floor(CONFIG.GAME_HEIGHT / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE)) / 2
    };
}

function createGameRect(gridX, gridY, color) {
    const screenPos = gridToScreen(gridX, gridY);
    
    const rectId = Toxoid.API.filledRect(
        screenPos.x, 
        screenPos.y, 
        CONFIG.GRID_SIZE - 2, 
        CONFIG.GRID_SIZE - 2, 
        { r: color.r, g: color.g, b: color.b, a: color.a || 1.0 }
    );
    
    return Toxoid.API.getEntity(rectId);
}

// ===== SCORE SYSTEM =====
function createScoreText() {
    const assetState = getAssetState();
    if (!assetState || !assetState.font_loaded) return null;
    
    const gameState = getGameState();
    const score = gameState ? gameState.score : 0;
    
    const scoreEntity = Toxoid.API.createFontText("assets/Montserrat-Regular.ttf", `Score: ${score}`);
    
    if (scoreEntity) {
        const pos = scoreEntity.getComponent("Position");
        if (pos) {
            pos.x = 30;
            pos.y = 30;
        }
        
        const fontText = scoreEntity.getComponent("FontText");
        if (fontText) {
            fontText.halign = 0; // Left alignment
            fontText.valign = 0; // Top alignment
        }
        
        scoreEntity.add("Renderable");
        scoreEntity.add("UIFont");
        
        console.log("[Snake] Score text created:", scoreEntity.id);
    }
    
    return scoreEntity;
}

function updateScoreText() {
    const gameState = getGameState();
    const scoreTextRef = getScoreTextRef();
    if (!gameState || !scoreTextRef) return;
    
    if (scoreTextRef.score_text_entity_id) {
        try {
            Toxoid.API.removeEntity(scoreTextRef.score_text_entity_id);
        } catch (e) {
            console.log("[Snake] Could not remove old score text:", e);
        }
    }
    
    const newScoreText = createScoreText();
    if (newScoreText) {
        scoreTextRef.score_text_entity_id = newScoreText.id;
    }
    console.log("[Snake] Score text updated with score:", gameState.score);
}

// ===== SNAKE SYSTEM =====
function initializeSnake() {
    console.log("[Snake] Initializing snake...");
    
    // Clear existing segments
    snakeSegments.forEach(segment => {
        if (segment.entity) {
            Toxoid.API.removeEntity(segment.entity.id);
        }
    });
    snakeSegments = [];
    
    const centerX = Math.floor(CONFIG.GAME_WIDTH / CONFIG.GRID_SIZE / 2);
    const centerY = Math.floor(CONFIG.GAME_HEIGHT / CONFIG.GRID_SIZE / 2);
    
    for (let i = 0; i < CONFIG.INITIAL_SNAKE_LENGTH; i++) {
        const gridX = centerX - i;
        const gridY = centerY;
        
        const isHead = i === 0;
        const color = isHead ? CONFIG.COLORS.SNAKE_HEAD : CONFIG.COLORS.SNAKE_BODY;
        const segment = createGameRect(gridX, gridY, color);
        
        segment.add("SnakeSegment");
        if (isHead) {
            segment.add("SnakeHead");
        }
        
        snakeSegments.push({
            entity: segment,
            gridX: gridX,
            gridY: gridY,
            isHead: isHead
        });
        
        console.log(`[Snake] Created segment at (${gridX}, ${gridY}), is_head: ${isHead}`);
    }
    
    console.log(`[Snake] Created snake with ${CONFIG.INITIAL_SNAKE_LENGTH} segments`);
}

function generateFood() {
    const maxX = Math.floor(CONFIG.GAME_WIDTH / CONFIG.GRID_SIZE) - 1;
    const maxY = Math.floor(CONFIG.GAME_HEIGHT / CONFIG.GRID_SIZE) - 1;
    
    let foodX, foodY;
    let attempts = 0;
    
    do {
        foodX = Math.floor(Math.random() * maxX);
        foodY = Math.floor(Math.random() * maxY);
        attempts++;
    } while (isPositionOccupied(foodX, foodY) && attempts < 100);
    
    const foodState = getFoodState();
    if (foodState && foodState.food_entity_id) {
        Toxoid.API.removeEntity(foodState.food_entity_id);
    }
    
    const foodEntity = createGameRect(foodX, foodY, CONFIG.COLORS.FOOD);
    foodEntity.add("SnakeFood");
    
    if (foodState) {
        foodState.food_entity_id = foodEntity.id;
        foodState.food_x = foodX;
        foodState.food_y = foodY;
    }
    
    console.log(`[Snake] Generated food at (${foodX}, ${foodY})`);
}

function isPositionOccupied(gridX, gridY) {
    return snakeSegments.some(segment => 
        segment.gridX === gridX && segment.gridY === gridY);
}

function isValidPosition(gridX, gridY) {
    const maxX = Math.floor(CONFIG.GAME_WIDTH / CONFIG.GRID_SIZE) - 1;
    const maxY = Math.floor(CONFIG.GAME_HEIGHT / CONFIG.GRID_SIZE) - 1;
    return gridX >= 0 && gridX <= maxX && gridY >= 0 && gridY <= maxY;
}

function gameOver() {
    const gameState = getGameState();
    const score = gameState ? gameState.score : 0;
    console.log(`[Snake] Game Over! Final Score: ${score}`);
    
    if (gameState) {
        gameState.game_over = true;
    }
}

function resetGame() {
    console.log("[Snake] Resetting game...");
    
    // Clean up snake segments
    snakeSegments.forEach(segment => {
        if (segment.entity) {
            Toxoid.API.removeEntity(segment.entity.id);
        }
    });
    snakeSegments = [];
    
    // Clean up food
    const foodState = getFoodState();
    if (foodState && foodState.food_entity_id) {
        Toxoid.API.removeEntity(foodState.food_entity_id);
    }
    
    initializeGameState();
    initializeSnake();
    generateFood();
    updateScoreText();
}

// ===== INPUT SYSTEM =====
function handleInput() {
    const keyboard = Toxoid.API.getSingleton("KeyboardInput");
    const gameState = getGameState();
    if (!keyboard || !gameState) return;
    
    // Direction changes (prevent 180-degree turns)
    if (keyboard.up && gameState.direction_y === 0) {
        gameState.next_direction_x = 0;
        gameState.next_direction_y = -1;
    } else if (keyboard.down && gameState.direction_y === 0) {
        gameState.next_direction_x = 0;
        gameState.next_direction_y = 1;
    } else if (keyboard.left && gameState.direction_x === 0) {
        gameState.next_direction_x = -1;
        gameState.next_direction_y = 0;
    } else if (keyboard.right && gameState.direction_x === 0) {
        gameState.next_direction_x = 1;
        gameState.next_direction_y = 0;
    }
    
    // Game controls
    if (keyboard.space) {
        if (gameState.game_over) {
            resetGame();
        } else {
            gameState.paused = !gameState.paused;
            console.log(`[Snake] Game ${gameState.paused ? 'paused' : 'resumed'}`);
        }
    }
    
    if (keyboard.escape) {
        resetGame();
    }
}

// ===== MOVEMENT SYSTEM =====
function snakeMovementSystem() {
    try {
        const gameState = getGameState();
        if (!gameState) return;
        
        handleInput();
        
        if (gameState.game_over || gameState.paused) return;
        
        gameState.move_timer++;
        
        const moveIntervalFrames = Math.floor(CONFIG.GAME_SPEED / (1000 / 60));
        if (gameState.move_timer >= moveIntervalFrames) {
            // Update direction
            gameState.direction_x = gameState.next_direction_x;
            gameState.direction_y = gameState.next_direction_y;
            
            if (snakeSegments.length === 0) {
                console.log("[Snake] No snake segments, reinitializing...");
                initializeSnake();
                return;
            }
            
            const head = snakeSegments.find(s => s.isHead);
            if (!head) {
                console.log("[Snake] No head found, reinitializing...");
                initializeSnake();
                return;
            }
            
            const newHeadX = head.gridX + gameState.direction_x;
            const newHeadY = head.gridY + gameState.direction_y;
            
            // Check collisions
            if (!isValidPosition(newHeadX, newHeadY)) {
                console.log(`[Snake] Wall collision at (${newHeadX}, ${newHeadY})`);
                gameOver();
                return;
            }
            
            if (isPositionOccupied(newHeadX, newHeadY)) {
                console.log(`[Snake] Self collision at (${newHeadX}, ${newHeadY})`);
                gameOver();
                return;
            }
            
            // Check food collision
            let ateFood = false;
            const foodState = getFoodState();
            if (foodState && foodState.food_x === newHeadX && foodState.food_y === newHeadY) {
                ateFood = true;
                gameState.score += 10;
                console.log(`[Snake] Food eaten! Score: ${gameState.score}`);
                updateScoreText();
                generateFood();
            }
            
            // Create new head
            const newHeadEntity = createGameRect(newHeadX, newHeadY, CONFIG.COLORS.SNAKE_HEAD);
            newHeadEntity.add("SnakeSegment");
            newHeadEntity.add("SnakeHead");
            
            // Update old head to body
            head.isHead = false;
            if (head.entity) {
                const color = head.entity.getComponent("Color");
                if (color) {
                    color.r = CONFIG.COLORS.SNAKE_BODY.r;
                    color.g = CONFIG.COLORS.SNAKE_BODY.g;
                    color.b = CONFIG.COLORS.SNAKE_BODY.b;
                }
            }
            
            // Add new head to front
            snakeSegments.unshift({
                entity: newHeadEntity,
                gridX: newHeadX,
                gridY: newHeadY,
                isHead: true
            });
            
            // Remove tail if no food eaten
            if (!ateFood) {
                const tail = snakeSegments.pop();
                if (tail && tail.entity) {
                    Toxoid.API.removeEntity(tail.entity.id);
                }
            }
            
            gameState.move_timer = 0;
        }
        
    } catch (error) {
        console.error("[Snake] Error in snakeMovementSystem:", error);
    }
}

function snakeUISystem() {
    const gameState = getGameState();
    if (!gameState) return;
    
    if (gameState.game_over && Math.floor(Date.now() / 1000) % 2 === 0) {
        console.log(`[Snake] GAME OVER - Score: ${gameState.score} - Press SPACE to restart`);
    }
}

// ===== INITIALIZATION =====
const init = () => {
    console.log("[Snake] Initializing Snake Game...");
    
    initializeGameState();
    
    console.log("[Snake] Loading font for text displays...");
    Toxoid.API.loadFontText("assets/Montserrat-Regular.ttf", 16.0, function(fontEntity) {
        console.log("[Snake] ✓ Font loaded successfully");
        
        const assetState = getAssetState();
        if (assetState) {
            assetState.font_loaded = true;
        }
        
        const scoreText = createScoreText();
        const scoreTextRef = getScoreTextRef();
        if (scoreText && scoreTextRef) {
            scoreTextRef.score_text_entity_id = scoreText.id;
        }
        
        initGameSystems();
        initializeSnake();
        generateFood();
        
        console.log("[Snake] Snake Game initialized! Use arrow keys to play!");
        console.log("[Snake] SPACE = pause/restart, ESC = reset");
    });
};

function initGameSystems() {
    console.log("[Snake] Initializing game systems...");
    
    try {
        // Use SnakeHead query to ensure we have a valid query target
        const movementSys = Toxoid.System.create(
            'SnakeMovementSystem',
            'SnakeHead',
            Toxoid.Phases.ON_UPDATE,
            function(iter) {
                try {
                    snakeMovementSystem();
                } catch (error) {
                    console.error("[Snake] Error in snakeMovementSystem:", error);
                }
            }
        );
        
        const uiSys = Toxoid.System.create(
            'SnakeUISystem',
            'SnakeFood',
            Toxoid.Phases.ON_UPDATE,
            function(iter) {
                try {
                    snakeUISystem();
                } catch (error) {
                    console.error("[Snake] Error in snakeUISystem:", error);
                }
            }
        );
        
        if (movementSys && uiSys) {
            console.log("[Snake] All systems registered successfully!");
            console.log("[Snake] Controls: Arrow keys to move");
            console.log("[Snake] SPACE to pause/restart, ESC to reset");
            console.log("[Snake] Eat red food squares to grow and increase score!");
        } else {
            console.error("[Snake] Failed to register some systems");
        }
        
    } catch (error) {
        console.error("[Snake] Error initializing game:", error);
    }
}

// Auto-start the game
if (typeof Toxoid !== 'undefined') {
    init();
}