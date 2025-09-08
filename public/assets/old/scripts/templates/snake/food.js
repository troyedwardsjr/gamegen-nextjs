// Snake Game - Food Management Module
// This module handles food spawning, management, and special food types

console.log("[Snake] Loading food management module...");

// Food class for managing food entities
class Food {
    constructor(gridWidth, gridHeight, cellSize) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.cellSize = cellSize;
        this.items = [];
        this.spawnedCount = 0;
        this.maxItems = 5; // Maximum food items on screen
        this.spawnRate = 0.1; // Probability of spawning per update
        this.types = {
            NORMAL: { 
                value: 10, 
                color: { r: 1.0, g: 0.0, b: 0.0, a: 1.0 }, 
                char: "●",
                duration: -1 // Permanent
            },
            BONUS: { 
                value: 50, 
                color: { r: 1.0, g: 1.0, b: 0.0, a: 1.0 }, 
                char: "★",
                duration: 10000 // 10 seconds
            },
            SPEED: { 
                value: 20, 
                color: { r: 0.0, g: 0.0, b: 1.0, a: 1.0 }, 
                char: "▲",
                duration: 8000, // 8 seconds
                effect: "speed"
            },
            GROWTH: { 
                value: 30, 
                color: { r: 0.0, g: 1.0, b: 1.0, a: 1.0 }, 
                char: "♦",
                duration: 12000, // 12 seconds
                effect: "growth"
            },
            MEGA: { 
                value: 100, 
                color: { r: 1.0, g: 0.0, b: 1.0, a: 1.0 }, 
                char: "♠",
                duration: 5000, // 5 seconds
                effect: "mega"
            }
        };
    }
    
    // Initialize food system
    initialize() {
        this.items = [];
        this.spawnedCount = 0;
        console.log("[Snake] Food system initialized");
    }
    
    // Spawn food at random valid position
    spawnFood(type = "NORMAL", forcedPosition = null) {
        if (this.items.length >= this.maxItems) {
            console.log("[Snake] Maximum food items reached, not spawning");
            return null;
        }
        
        let position;
        let attempts = 0;
        const maxAttempts = 100;
        
        if (forcedPosition) {
            position = { ...forcedPosition };
        } else {
            // Find valid spawn position
            do {
                position = {
                    x: Math.floor(Math.random() * this.gridWidth),
                    y: Math.floor(Math.random() * this.gridHeight)
                };
                attempts++;
            } while (this.isPositionOccupied(position.x, position.y) && attempts < maxAttempts);
            
            if (attempts >= maxAttempts) {
                console.warn("[Snake] Could not find valid food spawn position");
                return null;
            }
        }
        
        const foodType = this.types[type] || this.types.NORMAL;
        const food = {
            id: this.spawnedCount++,
            type: type,
            position: position,
            spawnTime: Date.now(),
            duration: foodType.duration,
            value: foodType.value,
            color: { ...foodType.color },
            effect: foodType.effect || null,
            isBlinking: false,
            blinkStartTime: 0
        };
        
        this.items.push(food);
        
        console.log(`[Snake] Spawned ${type} food at (${position.x}, ${position.y}) worth ${food.value} points`);
        return food;
    }
    
    // Remove food by ID
    removeFood(foodId) {
        const index = this.items.findIndex(food => food.id === foodId);
        if (index !== -1) {
            const removed = this.items.splice(index, 1)[0];
            console.log(`[Snake] Removed ${removed.type} food at (${removed.position.x}, ${removed.position.y})`);
            return removed;
        }
        return null;
    }
    
    // Get food at specific position
    getFoodAt(x, y) {
        return this.items.find(food => food.position.x === x && food.position.y === y);
    }
    
    // Check if position is occupied by any food
    isPositionOccupied(x, y) {
        return this.items.some(food => food.position.x === x && food.position.y === y);
    }
    
    // Update food system (handle expiring food, effects, etc.)
    update(currentTime, snakePositions = []) {
        const itemsToRemove = [];
        
        this.items.forEach(food => {
            // Check if food has expired
            if (food.duration > 0) {
                const age = currentTime - food.spawnTime;
                const timeLeft = food.duration - age;
                
                // Start blinking when 2 seconds left
                if (timeLeft <= 2000 && !food.isBlinking) {
                    food.isBlinking = true;
                    food.blinkStartTime = currentTime;
                    console.log(`[Snake] ${food.type} food started blinking (expires soon)`);
                }
                
                // Remove expired food
                if (timeLeft <= 0) {
                    itemsToRemove.push(food.id);
                }
            }
            
            // Update blinking effect
            if (food.isBlinking) {
                const blinkTime = currentTime - food.blinkStartTime;
                const blinkCycle = Math.floor(blinkTime / 250) % 2; // Blink every 250ms
                
                if (blinkCycle === 0) {
                    // Dim the food
                    food.color.a = 0.3;
                } else {
                    // Restore full opacity
                    const originalType = this.types[food.type];
                    food.color.a = originalType.color.a;
                }
            }
        });
        
        // Remove expired items
        itemsToRemove.forEach(id => this.removeFood(id));
        
        // Randomly spawn special food
        if (Math.random() < this.spawnRate * 0.1) { // 10% of normal spawn rate for special food
            this.spawnRandomSpecialFood();
        }
    }
    
    // Spawn random special food type
    spawnRandomSpecialFood() {
        const specialTypes = ["BONUS", "SPEED", "GROWTH", "MEGA"];
        const randomType = specialTypes[Math.floor(Math.random() * specialTypes.length)];
        return this.spawnFood(randomType);
    }
    
    // Consume food (called when snake eats it)
    consumeFood(foodId) {
        const food = this.items.find(f => f.id === foodId);
        if (!food) return null;
        
        const consumedFood = { ...food };
        this.removeFood(foodId);
        
        console.log(`[Snake] Consumed ${consumedFood.type} food worth ${consumedFood.value} points`);
        
        return {
            value: consumedFood.value,
            effect: consumedFood.effect,
            type: consumedFood.type
        };
    }
    
    // Get all food items
    getAllFood() {
        return this.items.map(food => ({ ...food }));
    }
    
    // Get food count by type
    getFoodCount(type = null) {
        if (type) {
            return this.items.filter(food => food.type === type).length;
        }
        return this.items.length;
    }
    
    // Clear all food
    clearAll() {
        this.items = [];
        console.log("[Snake] Cleared all food items");
    }
    
    // Generate food placement suggestions (for AI or auto-placement)
    generatePlacementSuggestions(snakePositions, count = 3) {
        const suggestions = [];
        const attempts = 0;
        const maxAttempts = 50;
        
        while (suggestions.length < count && attempts < maxAttempts) {
            const position = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight)
            };
            
            // Check if position is valid
            const isOccupiedBySnake = snakePositions.some(pos => 
                pos.x === position.x && pos.y === position.y
            );
            const isOccupiedByFood = this.isPositionOccupied(position.x, position.y);
            const alreadySuggested = suggestions.some(pos => 
                pos.x === position.x && pos.y === position.y
            );
            
            if (!isOccupiedBySnake && !isOccupiedByFood && !alreadySuggested) {
                suggestions.push(position);
            }
        }
        
        return suggestions;
    }
    
    // Apply food effect to game state
    static applyFoodEffect(effect, gameState, snake) {
        switch (effect) {
            case "speed":
                // Temporarily increase snake speed
                const originalSpeed = snake.getSpeed();
                snake.setSpeed(originalSpeed * 1.5);
                console.log("[Snake] Speed boost activated!");
                
                // Reset speed after duration
                setTimeout(() => {
                    snake.setSpeed(originalSpeed);
                    console.log("[Snake] Speed boost expired");
                }, 5000);
                break;
                
            case "growth":
                // Make snake grow extra segments
                snake.grow(2);
                console.log("[Snake] Growth boost activated!");
                break;
                
            case "mega":
                // Multiple effects
                snake.grow(3);
                gameState.score += 50; // Bonus points
                console.log("[Snake] Mega bonus activated!");
                break;
                
            default:
                // No special effect
                break;
        }
    }
    
    // Get food statistics
    getStats() {
        const typeCount = {};
        Object.keys(this.types).forEach(type => {
            typeCount[type] = this.getFoodCount(type);
        });
        
        return {
            totalItems: this.items.length,
            maxItems: this.maxItems,
            spawnedCount: this.spawnedCount,
            typeCount: typeCount,
            spawnRate: this.spawnRate
        };
    }
    
    // Set maximum food items
    setMaxItems(max) {
        this.maxItems = Math.max(1, max);
        console.log(`[Snake] Maximum food items set to ${this.maxItems}`);
    }
    
    // Set spawn rate
    setSpawnRate(rate) {
        this.spawnRate = Math.max(0, Math.min(1, rate));
        console.log(`[Snake] Food spawn rate set to ${this.spawnRate}`);
    }
    
    // Create food pattern (for special levels)
    createPattern(pattern) {
        this.clearAll();
        
        switch (pattern) {
            case "cross":
                const centerX = Math.floor(this.gridWidth / 2);
                const centerY = Math.floor(this.gridHeight / 2);
                
                this.spawnFood("NORMAL", { x: centerX, y: centerY });
                this.spawnFood("BONUS", { x: centerX - 2, y: centerY });
                this.spawnFood("BONUS", { x: centerX + 2, y: centerY });
                this.spawnFood("BONUS", { x: centerX, y: centerY - 2 });
                this.spawnFood("BONUS", { x: centerX, y: centerY + 2 });
                break;
                
            case "corners":
                this.spawnFood("MEGA", { x: 1, y: 1 });
                this.spawnFood("MEGA", { x: this.gridWidth - 2, y: 1 });
                this.spawnFood("MEGA", { x: 1, y: this.gridHeight - 2 });
                this.spawnFood("MEGA", { x: this.gridWidth - 2, y: this.gridHeight - 2 });
                break;
                
            case "line":
                const lineY = Math.floor(this.gridHeight / 2);
                for (let x = 2; x < this.gridWidth - 2; x += 2) {
                    const type = x % 4 === 2 ? "NORMAL" : "SPEED";
                    this.spawnFood(type, { x: x, y: lineY });
                }
                break;
                
            default:
                console.warn(`[Snake] Unknown food pattern: ${pattern}`);
        }
        
        console.log(`[Snake] Created food pattern: ${pattern}`);
    }
}

// Export for use in other modules (conceptual)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Food };
}

// Make available globally for the main game
if (typeof globalThis !== 'undefined') {
    globalThis.FoodClass = Food;
}

console.log("[Snake] Food management module loaded successfully");