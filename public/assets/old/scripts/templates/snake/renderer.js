// Snake Game - Rendering Module
// This module handles all visual rendering using Toxoid's rect-based rendering system

console.log("[Snake] Loading rendering module...");

// Renderer class for managing visual representation of game objects
class GameRenderer {
    constructor(gridWidth, gridHeight, cellSize) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.cellSize = cellSize;
        this.entities = new Map();
        this.renderLayers = {
            BACKGROUND: 0,
            GRID: 1,
            FOOD: 2,
            SNAKE: 3,
            UI: 4,
            EFFECTS: 5
        };
        this.initialized = false;
        this.gridOffset = {
            x: -(gridWidth * cellSize) / 2,
            y: -(gridHeight * cellSize) / 2
        };
    }
    
    // Initialize renderer
    initialize() {
        console.log("[Snake] Initializing game renderer...");
        
        try {
            this.createBackground();
            this.createGrid();
            this.initialized = true;
            console.log("[Snake] Renderer initialized successfully");
        } catch (error) {
            console.error("[Snake] Failed to initialize renderer:", error);
        }
    }
    
    // Create background
    createBackground() {
        const bgWidth = this.gridWidth * this.cellSize + 20;
        const bgHeight = this.gridHeight * this.cellSize + 20;
        
        this.createEntity("background", 
            this.gridOffset.x - 10, 
            this.gridOffset.y - 10,
            bgWidth, 
            bgHeight,
            { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
            true,
            this.renderLayers.BACKGROUND
        );
        
        console.log("[Snake] Background created");
    }
    
    // Create grid lines (optional visual aid)
    createGrid(showGrid = false) {
        if (!showGrid) return;
        
        const gridColor = { r: 0.2, g: 0.2, b: 0.2, a: 0.5 };
        
        // Vertical lines
        for (let x = 0; x <= this.gridWidth; x++) {
            const worldX = this.gridOffset.x + x * this.cellSize;
            this.createEntity(`grid_v_${x}`,
                worldX, 
                this.gridOffset.y,
                1, 
                this.gridHeight * this.cellSize,
                gridColor,
                true,
                this.renderLayers.GRID
            );
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.gridHeight; y++) {
            const worldY = this.gridOffset.y + y * this.cellSize;
            this.createEntity(`grid_h_${y}`,
                this.gridOffset.x, 
                worldY,
                this.gridWidth * this.cellSize, 
                1,
                gridColor,
                true,
                this.renderLayers.GRID
            );
        }
        
        console.log("[Snake] Grid lines created");
    }
    
    // Create a visual entity
    createEntity(name, x, y, width, height, color, filled = true, layer = 0) {
        try {
            // Remove existing entity with same name
            this.removeEntity(name);
            
            const entity = new Toxoid.Entity(name);
            entity.add("Position");
            entity.add("Size");
            entity.add("Rect");
            entity.add("Color");
            entity.add("ZDepth");
            entity.add("Renderable");
            
            entity.setComponent("Position", { x: Math.floor(x), y: Math.floor(y) });
            entity.setComponent("Size", { width: width, height: height });
            entity.setComponent("Rect", { filled: filled });
            entity.setComponent("Color", color);
            entity.setComponent("ZDepth", { 
                layer_depth: layer,
                row_depth: 0,
                depth: 0
            });
            
            this.entities.set(name, {
                entity: entity,
                layer: layer,
                created: Date.now()
            });
            
            return entity;
        } catch (error) {
            console.error(`[Snake] Failed to create entity ${name}:`, error);
            return null;
        }
    }
    
    // Remove an entity
    removeEntity(name) {
        const entityData = this.entities.get(name);
        if (entityData) {
            try {
                entityData.entity.destruct();
                this.entities.delete(name);
            } catch (error) {
                console.error(`[Snake] Error removing entity ${name}:`, error);
            }
        }
    }
    
    // Update entity position
    updateEntityPosition(name, x, y) {
        const entityData = this.entities.get(name);
        if (entityData) {
            entityData.entity.setComponent("Position", { x: Math.floor(x), y: Math.floor(y) });
        }
    }
    
    // Update entity color
    updateEntityColor(name, color) {
        const entityData = this.entities.get(name);
        if (entityData) {
            entityData.entity.setComponent("Color", color);
        }
    }
    
    // Update entity size
    updateEntitySize(name, width, height) {
        const entityData = this.entities.get(name);
        if (entityData) {
            entityData.entity.setComponent("Size", { width: width, height: height });
        }
    }
    
    // Convert grid coordinates to world coordinates
    gridToWorld(gridX, gridY) {
        return {
            x: this.gridOffset.x + gridX * this.cellSize,
            y: this.gridOffset.y + gridY * this.cellSize
        };
    }
    
    // Convert world coordinates to grid coordinates
    worldToGrid(worldX, worldY) {
        return {
            x: Math.floor((worldX - this.gridOffset.x) / this.cellSize),
            y: Math.floor((worldY - this.gridOffset.y) / this.cellSize)
        };
    }
    
    // Render snake
    renderSnake(segments, colors = null) {
        // Remove old snake segments
        for (let i = 0; i < 200; i++) {
            this.removeEntity(`snake_${i}`);
        }
        
        segments.forEach((segment, index) => {
            const worldPos = this.gridToWorld(segment.x, segment.y);
            
            // Determine color based on segment type
            let color;
            if (colors && colors[index]) {
                color = colors[index];
            } else if (index === 0) {
                // Head - brighter green
                color = { r: 0.2, g: 1.0, b: 0.2, a: 1.0 };
            } else {
                // Body - darker green, fading with age
                const fade = Math.max(0.3, 1.0 - (index * 0.05));
                color = { r: 0.0, g: fade, b: 0.0, a: 1.0 };
            }
            
            this.createEntity(`snake_${index}`,
                worldPos.x + 1,
                worldPos.y + 1,
                this.cellSize - 2,
                this.cellSize - 2,
                color,
                true,
                this.renderLayers.SNAKE
            );
        });
    }
    
    // Render food items
    renderFood(foodItems) {
        // Remove old food entities
        this.entities.forEach((entityData, name) => {
            if (name.startsWith('food_')) {
                this.removeEntity(name);
            }
        });
        
        foodItems.forEach(food => {
            const worldPos = this.gridToWorld(food.position.x, food.position.y);
            
            // Create main food entity
            this.createEntity(`food_${food.id}`,
                worldPos.x + 2,
                worldPos.y + 2,
                this.cellSize - 4,
                this.cellSize - 4,
                food.color,
                true,
                this.renderLayers.FOOD
            );
            
            // Add visual effects for special food types
            if (food.type !== "NORMAL") {
                this.createFoodEffect(food, worldPos);
            }
        });
    }
    
    // Create special effects for food
    createFoodEffect(food, worldPos) {
        switch (food.type) {
            case "BONUS":
                // Add golden outline
                this.createEntity(`food_effect_${food.id}`,
                    worldPos.x,
                    worldPos.y,
                    this.cellSize,
                    this.cellSize,
                    { r: 1.0, g: 0.8, b: 0.0, a: 0.8 },
                    false, // Outline only
                    this.renderLayers.EFFECTS
                );
                break;
                
            case "SPEED":
                // Add pulsing effect (this would need to be animated)
                this.createEntity(`food_effect_${food.id}`,
                    worldPos.x - 1,
                    worldPos.y - 1,
                    this.cellSize + 2,
                    this.cellSize + 2,
                    { r: 0.0, g: 0.5, b: 1.0, a: 0.3 },
                    true,
                    this.renderLayers.EFFECTS
                );
                break;
                
            case "GROWTH":
                // Add expanding rings
                for (let i = 0; i < 3; i++) {
                    const size = this.cellSize + (i * 4);
                    const offset = i * 2;
                    this.createEntity(`food_effect_${food.id}_${i}`,
                        worldPos.x - offset,
                        worldPos.y - offset,
                        size,
                        size,
                        { r: 0.0, g: 1.0, b: 1.0, a: 0.2 - i * 0.05 },
                        false,
                        this.renderLayers.EFFECTS
                    );
                }
                break;
                
            case "MEGA":
                // Add rotating diamond effect
                this.createEntity(`food_effect_${food.id}`,
                    worldPos.x - 3,
                    worldPos.y - 3,
                    this.cellSize + 6,
                    this.cellSize + 6,
                    { r: 1.0, g: 0.0, b: 1.0, a: 0.6 },
                    false,
                    this.renderLayers.EFFECTS
                );
                break;
        }
    }
    
    // Render UI elements (score, etc.)
    renderUI(gameState) {
        // Note: Text rendering might not be fully supported
        // This is a placeholder for UI rendering
        
        // Create score display background
        this.createEntity("ui_score_bg",
            -200, -180,
            120, 30,
            { r: 0.0, g: 0.0, b: 0.0, a: 0.7 },
            true,
            this.renderLayers.UI
        );
        
        // Game over screen
        if (!gameState.isRunning && gameState.gameOverMessage) {
            this.renderGameOverScreen(gameState);
        }
        
        // Pause indicator
        if (gameState.isPaused) {
            this.createEntity("ui_pause",
                -50, -10,
                100, 20,
                { r: 1.0, g: 1.0, b: 0.0, a: 0.8 },
                true,
                this.renderLayers.UI
            );
        } else {
            this.removeEntity("ui_pause");
        }
    }
    
    // Render game over screen
    renderGameOverScreen(gameState) {
        // Semi-transparent overlay
        this.createEntity("game_over_overlay",
            -250, -150,
            500, 300,
            { r: 0.0, g: 0.0, b: 0.0, a: 0.8 },
            true,
            this.renderLayers.UI
        );
        
        // Game over box
        this.createEntity("game_over_box",
            -150, -75,
            300, 150,
            { r: 0.2, g: 0.2, b: 0.2, a: 0.9 },
            true,
            this.renderLayers.UI
        );
        
        // Border
        this.createEntity("game_over_border",
            -152, -77,
            304, 154,
            { r: 1.0, g: 0.0, b: 0.0, a: 1.0 },
            false,
            this.renderLayers.UI
        );
    }
    
    // Create particle effect
    createParticleEffect(x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const distance = 10 + Math.random() * 20;
            const particleX = x + Math.cos(angle) * distance;
            const particleY = y + Math.sin(angle) * distance;
            
            const particleName = `particle_${Date.now()}_${i}`;
            
            this.createEntity(particleName,
                particleX, particleY,
                3, 3,
                { ...color, a: 0.8 },
                true,
                this.renderLayers.EFFECTS
            );
            
            // Remove particle after short delay
            setTimeout(() => {
                this.removeEntity(particleName);
            }, 500 + Math.random() * 500);
        }
    }
    
    // Screen shake effect
    applyScreenShake(intensity = 5, duration = 200) {
        // This would require camera manipulation
        // For now, just log the effect
        console.log(`[Snake] Screen shake: intensity ${intensity}, duration ${duration}ms`);
    }
    
    // Flash effect
    createFlashEffect(color, duration = 100) {
        const flashName = "screen_flash";
        
        this.createEntity(flashName,
            -400, -300,
            800, 600,
            { ...color, a: 0.5 },
            true,
            this.renderLayers.EFFECTS
        );
        
        setTimeout(() => {
            this.removeEntity(flashName);
        }, duration);
    }
    
    // Clean up all entities
    cleanup() {
        console.log("[Snake] Cleaning up renderer...");
        
        this.entities.forEach((entityData, name) => {
            try {
                entityData.entity.destruct();
            } catch (error) {
                console.error(`[Snake] Error cleaning up entity ${name}:`, error);
            }
        });
        
        this.entities.clear();
        this.initialized = false;
        
        console.log("[Snake] Renderer cleanup complete");
    }
    
    // Get rendering statistics
    getStats() {
        const layerCounts = {};
        Object.values(this.renderLayers).forEach(layer => {
            layerCounts[layer] = 0;
        });
        
        this.entities.forEach(entityData => {
            const layer = entityData.layer;
            layerCounts[layer] = (layerCounts[layer] || 0) + 1;
        });
        
        return {
            totalEntities: this.entities.size,
            layerCounts: layerCounts,
            gridSize: { width: this.gridWidth, height: this.gridHeight },
            cellSize: this.cellSize,
            initialized: this.initialized
        };
    }
    
    // Update renderer settings
    updateSettings(settings) {
        if (settings.showGrid !== undefined) {
            this.createGrid(settings.showGrid);
        }
        
        console.log("[Snake] Renderer settings updated:", settings);
    }
    
    // Batch update multiple entities
    batchUpdate(updates) {
        updates.forEach(update => {
            const { name, position, color, size } = update;
            
            if (position) {
                this.updateEntityPosition(name, position.x, position.y);
            }
            if (color) {
                this.updateEntityColor(name, color);
            }
            if (size) {
                this.updateEntitySize(name, size.width, size.height);
            }
        });
    }
}

// Export for use in other modules (conceptual)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameRenderer };
}

// Make available globally for the main game
if (typeof globalThis !== 'undefined') {
    globalThis.GameRendererClass = GameRenderer;
}

console.log("[Snake] Rendering module loaded successfully");