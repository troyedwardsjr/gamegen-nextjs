// Example: Basic Physics Simulation
// This script demonstrates simple physics systems using the Toxoid QuickJS API

console.log("[PhysicsDemo] Loading physics demonstration...");

// Basic physics components that can be added to entities
class PhysicsManager {
    constructor() {
        this.entities = [];
        this.gravity = { x: 0, y: 200 }; // pixels per second squared
        this.bounds = { minX: -400, maxX: 400, minY: -300, maxY: 300 };
        this.restitution = 0.8; // bounciness factor
        this.friction = 0.95; // velocity damping
    }
    
    // Add physics to an entity
    addPhysicsEntity(entity, mass, initialVelocity, hasGravity) {
        const physicsData = {
            entity: entity,
            velocity: { x: initialVelocity.x, y: initialVelocity.y },
            acceleration: { x: 0, y: 0 },
            mass: mass,
            hasGravity: hasGravity,
            isGrounded: false,
            bounciness: 0.8,
            friction: 0.98
        };
        
        this.entities.push(physicsData);
        console.log(`[PhysicsDemo] Added physics to entity: ${entity.getName()}`);
        return physicsData;
    }
    
    // Create a physics-enabled ball
    createPhysicsBall(name, x, y, velocity, mass, color) {
        const entity = new Toxoid.Entity(name);
        entity.add("Position");
        entity.add("Size");
        entity.add("Rect");
        entity.add("Color");
        entity.add("Renderable");
        
        entity.setComponent("Position", { x: x, y: y });
        entity.setComponent("Size", { width: 20, height: 20 });
        entity.setComponent("Rect", { filled: true });
        entity.setComponent("Color", color);
        
        this.addPhysicsEntity(entity, mass, velocity, true);
        
        console.log(`[PhysicsDemo] Created physics ball: ${name} at (${x}, ${y})`);
        return entity;
    }
    
    // Create a static platform
    createPlatform(name, x, y, width, height, color) {
        const entity = new Toxoid.Entity(name);
        entity.add("Position");
        entity.add("Size");
        entity.add("Rect");
        entity.add("Color");
        entity.add("Renderable");
        
        entity.setComponent("Position", { x: x, y: y });
        entity.setComponent("Size", { width: width, height: height });
        entity.setComponent("Rect", { filled: false }); // Outline only
        entity.setComponent("Color", color);
        
        // Platforms don't have physics but can be collided with
        console.log(`[PhysicsDemo] Created platform: ${name} at (${x}, ${y})`);
        return entity;
    }
    
    // Check collision between two rectangles
    checkRectCollision(pos1, size1, pos2, size2) {
        return pos1.x < pos2.x + size2.width &&
               pos1.x + size1.width > pos2.x &&
               pos1.y < pos2.y + size2.height &&
               pos1.y + size1.height > pos2.y;
    }
    
    // Apply forces and update physics
    update(deltaTime) {
        this.entities.forEach(physicsData => {
            const entity = physicsData.entity;
            const position = entity.getComponent("Position");
            const size = entity.getComponent("Size");
            
            if (!position || !size) return;
            
            // Apply gravity
            if (physicsData.hasGravity) {
                physicsData.acceleration.x = this.gravity.x;
                physicsData.acceleration.y = this.gravity.y;
            } else {
                physicsData.acceleration.x = 0;
                physicsData.acceleration.y = 0;
            }
            
            // Update velocity based on acceleration
            physicsData.velocity.x += physicsData.acceleration.x * deltaTime;
            physicsData.velocity.y += physicsData.acceleration.y * deltaTime;
            
            // Apply friction
            physicsData.velocity.x *= physicsData.friction;
            physicsData.velocity.y *= physicsData.friction;
            
            // Update position based on velocity
            let newX = position.x + physicsData.velocity.x * deltaTime;
            let newY = position.y + physicsData.velocity.y * deltaTime;
            
            // Boundary collision detection
            physicsData.isGrounded = false;
            
            // Left and right bounds
            if (newX <= this.bounds.minX) {
                newX = this.bounds.minX;
                physicsData.velocity.x = -physicsData.velocity.x * physicsData.bounciness;
            } else if (newX + size.width >= this.bounds.maxX) {
                newX = this.bounds.maxX - size.width;
                physicsData.velocity.x = -physicsData.velocity.x * physicsData.bounciness;
            }
            
            // Top and bottom bounds
            if (newY <= this.bounds.minY) {
                newY = this.bounds.minY;
                physicsData.velocity.y = -physicsData.velocity.y * physicsData.bounciness;
            } else if (newY + size.height >= this.bounds.maxY) {
                newY = this.bounds.maxY - size.height;
                physicsData.velocity.y = -physicsData.velocity.y * physicsData.bounciness;
                physicsData.isGrounded = true;
                
                // Reduce horizontal velocity when on ground
                physicsData.velocity.x *= 0.9;
            }
            
            // Update entity position
            entity.setComponent("Position", { 
                x: Math.floor(newX), 
                y: Math.floor(newY) 
            });
            
            // Change color based on physics state
            const currentColor = entity.getComponent("Color");
            if (physicsData.isGrounded) {
                // Green tint when grounded
                entity.setComponent("Color", {
                    r: currentColor.r * 0.8,
                    g: Math.min(1.0, currentColor.g * 1.2),
                    b: currentColor.b * 0.8,
                    a: currentColor.a
                });
            } else {
                // Restore original color when airborne
                entity.setComponent("Color", {
                    r: Math.min(1.0, currentColor.r * 1.1),
                    g: currentColor.g,
                    b: currentColor.b,
                    a: currentColor.a
                });
            }
        });
        
        // Check entity-to-entity collisions
        for (let i = 0; i < this.entities.length; i++) {
            for (let j = i + 1; j < this.entities.length; j++) {
                const entity1 = this.entities[i];
                const entity2 = this.entities[j];
                
                const pos1 = entity1.entity.getComponent("Position");
                const size1 = entity1.entity.getComponent("Size");
                const pos2 = entity2.entity.getComponent("Position");
                const size2 = entity2.entity.getComponent("Size");
                
                if (this.checkRectCollision(pos1, size1, pos2, size2)) {
                    // Simple elastic collision - exchange velocities
                    const tempVelX = entity1.velocity.x;
                    const tempVelY = entity1.velocity.y;
                    
                    entity1.velocity.x = entity2.velocity.x * 0.8;
                    entity1.velocity.y = entity2.velocity.y * 0.8;
                    entity2.velocity.x = tempVelX * 0.8;
                    entity2.velocity.y = tempVelY * 0.8;
                    
                    // Separate entities to prevent overlap
                    const centerX1 = pos1.x + size1.width / 2;
                    const centerY1 = pos1.y + size1.height / 2;
                    const centerX2 = pos2.x + size2.width / 2;
                    const centerY2 = pos2.y + size2.height / 2;
                    
                    const dx = centerX2 - centerX1;
                    const dy = centerY2 - centerY1;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        const separationX = (dx / distance) * 2;
                        const separationY = (dy / distance) * 2;
                        
                        entity1.entity.setComponent("Position", {
                            x: pos1.x - separationX,
                            y: pos1.y - separationY
                        });
                        entity2.entity.setComponent("Position", {
                            x: pos2.x + separationX,
                            y: pos2.y + separationY
                        });
                    }
                }
            }
        }
    }
    
    // Add impulse to an entity
    addImpulse(entityName, impulseX, impulseY) {
        const physicsData = this.entities.find(data => 
            data.entity.getName() === entityName
        );
        
        if (physicsData) {
            physicsData.velocity.x += impulseX;
            physicsData.velocity.y += impulseY;
            console.log(`[PhysicsDemo] Added impulse (${impulseX}, ${impulseY}) to ${entityName}`);
        }
    }
    
    // Get physics stats
    getStats() {
        const totalKineticEnergy = this.entities.reduce((total, data) => {
            const speed = Math.sqrt(
                data.velocity.x * data.velocity.x + 
                data.velocity.y * data.velocity.y
            );
            return total + (0.5 * data.mass * speed * speed);
        }, 0);
        
        return {
            entityCount: this.entities.length,
            totalKineticEnergy: totalKineticEnergy.toFixed(2),
            gravity: this.gravity,
            bounds: this.bounds
        };
    }
    
    // Reset all entities to random positions with random velocities
    reset() {
        this.entities.forEach(physicsData => {
            const entity = physicsData.entity;
            
            // Random position
            const x = Math.random() * 200 - 100;
            const y = Math.random() * 100 - 200;
            entity.setComponent("Position", { x: Math.floor(x), y: Math.floor(y) });
            
            // Random velocity
            physicsData.velocity.x = (Math.random() - 0.5) * 200;
            physicsData.velocity.y = (Math.random() - 0.5) * 200;
        });
        
        console.log("[PhysicsDemo] Reset all physics entities");
    }
    
    // Clean up all physics entities
    cleanup() {
        this.entities.forEach(physicsData => {
            physicsData.entity.destruct();
        });
        this.entities = [];
        console.log("[PhysicsDemo] Cleaned up all physics entities");
    }
}

// Create global physics manager
const physicsManager = new PhysicsManager();

try {
    // Create physics demo scene
    console.log("[PhysicsDemo] Creating physics simulation scene...");
    
    // Create several bouncing balls with different properties
    physicsManager.createPhysicsBall("RedBall", -50, -100, { x: 50, y: -100 }, 1.0, 
        { r: 1.0, g: 0.0, b: 0.0, a: 1.0 });
    
    physicsManager.createPhysicsBall("BlueBall", 0, -150, { x: -30, y: -80 }, 1.5, 
        { r: 0.0, g: 0.0, b: 1.0, a: 1.0 });
    
    physicsManager.createPhysicsBall("GreenBall", 50, -200, { x: 0, y: -120 }, 0.8, 
        { r: 0.0, g: 1.0, b: 0.0, a: 1.0 });
    
    physicsManager.createPhysicsBall("YellowBall", -100, -50, { x: 80, y: -60 }, 1.2, 
        { r: 1.0, g: 1.0, b: 0.0, a: 1.0 });
    
    physicsManager.createPhysicsBall("PurpleBall", 100, -80, { x: -60, y: -90 }, 0.9, 
        { r: 1.0, g: 0.0, b: 1.0, a: 1.0 });
    
    // Create some platforms (static objects)
    physicsManager.createPlatform("Platform1", -150, 0, 100, 20, 
        { r: 0.5, g: 0.5, b: 0.5, a: 1.0 });
    
    physicsManager.createPlatform("Platform2", 50, -50, 120, 15, 
        { r: 0.6, g: 0.4, b: 0.2, a: 1.0 });
    
    // Create physics update system
    const physicsSystem = Toxoid.System.create(
        "PhysicsUpdateSystem",
        "", // No specific components needed
        Toxoid.Phases.ON_UPDATE,
        function(iter) {
            const deltaTime = 1.0 / 60.0; // Assume 60 FPS
            physicsManager.update(deltaTime);
        }
    );
    
    console.log("[PhysicsDemo] Physics update system created");
    
    // Create periodic impulse system for fun
    let impulseTimer = 0;
    const impulseSystem = Toxoid.System.create(
        "RandomImpulseSystem",
        "",
        Toxoid.Phases.POST_UPDATE,
        function(iter) {
            impulseTimer += 1.0 / 60.0;
            if (impulseTimer >= 3.0) { // Every 3 seconds
                const ballNames = ["RedBall", "BlueBall", "GreenBall", "YellowBall", "PurpleBall"];
                const randomBall = ballNames[Math.floor(Math.random() * ballNames.length)];
                const impulseX = (Math.random() - 0.5) * 100;
                const impulseY = -Math.random() * 100;
                
                physicsManager.addImpulse(randomBall, impulseX, impulseY);
                impulseTimer = 0;
            }
        }
    );
    
    // Create stats display system
    let statsTimer = 0;
    const statsSystem = Toxoid.System.create(
        "PhysicsStatsSystem",
        "",
        Toxoid.Phases.POST_UPDATE,
        function(iter) {
            statsTimer += 1.0 / 60.0;
            if (statsTimer >= 5.0) {
                const stats = physicsManager.getStats();
                console.log(`[PhysicsDemo] Physics Stats - Entities: ${stats.entityCount}, ` +
                          `Kinetic Energy: ${stats.totalKineticEnergy}, ` +
                          `Gravity: (${stats.gravity.x}, ${stats.gravity.y})`);
                statsTimer = 0;
            }
        }
    );
    
    // Expose physics manager globally for debugging
    if (typeof globalThis !== 'undefined') {
        globalThis.physicsManager = physicsManager;
        globalThis.addImpulse = (name, x, y) => physicsManager.addImpulse(name, x, y);
        globalThis.resetPhysics = () => physicsManager.reset();
        globalThis.getPhysicsStats = () => physicsManager.getStats();
        globalThis.setGravity = (x, y) => { physicsManager.gravity = { x, y }; };
    }
    
    console.log("[PhysicsDemo] Physics demonstration initialized successfully");
    console.log("[PhysicsDemo] Watch the colorful balls bounce around with gravity and collisions!");
    console.log("[PhysicsDemo] Balls will randomly receive impulses every 3 seconds");
    
} catch (error) {
    console.error("[PhysicsDemo] Error in physics demo:", error);
}

console.log("[PhysicsDemo] Physics demonstration loaded successfully");