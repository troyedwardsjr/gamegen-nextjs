// Snake Game - Snake Logic Module
// This module handles all snake-related logic including movement, growth, and collision detection

console.log("[Snake] Loading snake logic module...");

// Snake class for managing snake entity behavior
class Snake {
    constructor(gridWidth, gridHeight, cellSize) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.cellSize = cellSize;
        this.segments = [];
        this.direction = { x: 1, y: 0 };
        this.pendingDirection = { x: 1, y: 0 };
        this.growthPending = 0;
        this.speed = 1; // cells per update
        this.lastMoveTime = 0;
        this.moveInterval = 200; // milliseconds between moves
    }
    
    // Initialize snake at starting position
    initialize(startX, startY, initialLength = 3) {
        this.segments = [];
        
        // Create initial segments
        for (let i = 0; i < initialLength; i++) {
            this.segments.push({
                x: startX - i,
                y: startY,
                age: i // Track segment age for visual effects
            });
        }
        
        this.direction = { x: 1, y: 0 };
        this.pendingDirection = { x: 1, y: 0 };
        this.growthPending = 0;
        this.lastMoveTime = Date.now();
        
        console.log(`[Snake] Snake initialized at (${startX}, ${startY}) with ${initialLength} segments`);
    }
    
    // Set movement direction (with validation)
    setDirection(newDirection) {
        const { x, y } = newDirection;
        
        // Validate direction
        if (Math.abs(x) + Math.abs(y) !== 1) {
            console.warn("[Snake] Invalid direction:", newDirection);
            return false;
        }
        
        // Prevent 180-degree turns (moving directly backwards)
        if (this.segments.length > 1) {
            const currentDir = this.direction;
            if (x === -currentDir.x && y === -currentDir.y) {
                console.log("[Snake] Blocked reverse direction");
                return false;
            }
        }
        
        this.pendingDirection = { x, y };
        return true;
    }
    
    // Update snake position and state
    update(currentTime) {
        // Check if it's time to move
        if (currentTime - this.lastMoveTime < this.moveInterval) {
            return false; // No movement this frame
        }
        
        // Apply pending direction change
        this.direction = { ...this.pendingDirection };
        
        // Calculate new head position
        const currentHead = this.segments[0];
        const newHead = {
            x: currentHead.x + this.direction.x,
            y: currentHead.y + this.direction.y,
            age: 0
        };
        
        // Add new head
        this.segments.unshift(newHead);
        
        // Age all segments
        this.segments.forEach((segment, index) => {
            segment.age = index;
        });
        
        // Remove tail unless growth is pending
        if (this.growthPending > 0) {
            this.growthPending--;
            console.log(`[Snake] Snake grew! Length: ${this.segments.length}, Growth pending: ${this.growthPending}`);
        } else {
            this.segments.pop();
        }
        
        this.lastMoveTime = currentTime;
        return true; // Movement occurred
    }
    
    // Add growth to the snake
    grow(amount = 1) {
        this.growthPending += amount;
        console.log(`[Snake] Growth queued: ${amount}, Total pending: ${this.growthPending}`);
    }
    
    // Check if snake head is at given position
    isHeadAt(x, y) {
        const head = this.segments[0];
        return head && head.x === x && head.y === y;
    }
    
    // Check if snake occupies a given position
    occupiesPosition(x, y) {
        return this.segments.some(segment => segment.x === x && segment.y === y);
    }
    
    // Check collision with itself
    checkSelfCollision() {
        if (this.segments.length < 2) return false;
        
        const head = this.segments[0];
        return this.segments.slice(1).some(segment => 
            segment.x === head.x && segment.y === head.y
        );
    }
    
    // Check if snake is out of bounds
    checkBoundaryCollision() {
        const head = this.segments[0];
        return head.x < 0 || head.x >= this.gridWidth || 
               head.y < 0 || head.y >= this.gridHeight;
    }
    
    // Check collision with a specific point (like food)
    checkPointCollision(x, y) {
        const head = this.segments[0];
        return head.x === x && head.y === y;
    }
    
    // Get head position
    getHeadPosition() {
        return this.segments.length > 0 ? { ...this.segments[0] } : null;
    }
    
    // Get all segments
    getSegments() {
        return this.segments.map(segment => ({ ...segment }));
    }
    
    // Get snake length
    getLength() {
        return this.segments.length;
    }
    
    // Get movement direction
    getDirection() {
        return { ...this.direction };
    }
    
    // Get pending direction
    getPendingDirection() {
        return { ...this.pendingDirection };
    }
    
    // Set movement speed (affects move interval)
    setSpeed(cellsPerSecond) {
        this.moveInterval = Math.max(50, 1000 / cellsPerSecond); // Minimum 50ms interval
        console.log(`[Snake] Speed set to ${cellsPerSecond} cells/second (${this.moveInterval}ms interval)`);
    }
    
    // Get current speed
    getSpeed() {
        return 1000 / this.moveInterval;
    }
    
    // Reset snake to initial state
    reset(startX, startY, initialLength = 3) {
        console.log("[Snake] Resetting snake...");
        this.initialize(startX, startY, initialLength);
    }
    
    // Get snake statistics
    getStats() {
        return {
            length: this.segments.length,
            direction: this.getDirection(),
            pendingDirection: this.getPendingDirection(),
            growthPending: this.growthPending,
            speed: this.getSpeed(),
            headPosition: this.getHeadPosition(),
            segmentCount: this.segments.length
        };
    }
    
    // Advanced movement patterns
    
    // Move in a spiral pattern (for AI or demo mode)
    moveSpiral(centerX, centerY, radius) {
        const head = this.segments[0];
        const dx = head.x - centerX;
        const dy = head.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < radius) {
            // Move outward in spiral
            if (Math.abs(dx) > Math.abs(dy)) {
                this.setDirection({ x: dx > 0 ? 0 : 0, y: dy > 0 ? -1 : 1 });
            } else {
                this.setDirection({ x: dx > 0 ? 1 : -1, y: 0 });
            }
        } else {
            // Move toward center
            this.setDirection({ 
                x: dx > 0 ? -1 : dx < 0 ? 1 : 0,
                y: dy > 0 ? -1 : dy < 0 ? 1 : 0
            });
        }
    }
    
    // Get valid movement directions (avoiding collisions)
    getValidDirections() {
        const validDirs = [];
        const possibleDirs = [
            { x: 0, y: -1, name: "up" },
            { x: 1, y: 0, name: "right" },
            { x: 0, y: 1, name: "down" },
            { x: -1, y: 0, name: "left" }
        ];
        
        const head = this.segments[0];
        
        possibleDirs.forEach(dir => {
            const newX = head.x + dir.x;
            const newY = head.y + dir.y;
            
            // Check bounds
            if (newX < 0 || newX >= this.gridWidth || newY < 0 || newY >= this.gridHeight) {
                return;
            }
            
            // Check self collision
            if (this.occupiesPosition(newX, newY)) {
                return;
            }
            
            // Check reverse direction
            if (dir.x === -this.direction.x && dir.y === -this.direction.y) {
                return;
            }
            
            validDirs.push(dir);
        });
        
        return validDirs;
    }
    
    // AI pathfinding to a target (simple)
    moveToward(targetX, targetY) {
        const head = this.segments[0];
        const dx = targetX - head.x;
        const dy = targetY - head.y;
        
        const validDirs = this.getValidDirections();
        
        if (validDirs.length === 0) {
            console.warn("[Snake] No valid directions available!");
            return false;
        }
        
        // Find best direction toward target
        let bestDir = validDirs[0];
        let bestScore = -Infinity;
        
        validDirs.forEach(dir => {
            // Calculate how much this direction helps reach the target
            const score = dx * dir.x + dy * dir.y;
            if (score > bestScore) {
                bestScore = score;
                bestDir = dir;
            }
        });
        
        return this.setDirection(bestDir);
    }
    
    // Validate snake state (for debugging)
    validateState() {
        const errors = [];
        
        if (this.segments.length === 0) {
            errors.push("Snake has no segments");
        }
        
        // Check for duplicate positions
        const positions = new Set();
        this.segments.forEach((segment, index) => {
            const key = `${segment.x},${segment.y}`;
            if (positions.has(key)) {
                errors.push(`Duplicate position at segment ${index}: (${segment.x}, ${segment.y})`);
            }
            positions.add(key);
        });
        
        // Check for gaps in snake
        for (let i = 0; i < this.segments.length - 1; i++) {
            const curr = this.segments[i];
            const next = this.segments[i + 1];
            const distance = Math.abs(curr.x - next.x) + Math.abs(curr.y - next.y);
            
            if (distance !== 1) {
                errors.push(`Gap between segments ${i} and ${i + 1}: distance ${distance}`);
            }
        }
        
        if (errors.length > 0) {
            console.error("[Snake] State validation errors:", errors);
            return false;
        }
        
        return true;
    }
}

// Export for use in other modules (conceptual - would be handled differently in actual implementation)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Snake };
}

// Make available globally for the main game
if (typeof globalThis !== 'undefined') {
    globalThis.SnakeClass = Snake;
}

console.log("[Snake] Snake logic module loaded successfully");