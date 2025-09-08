// Example: Animation and Visual Effects Demo
// This script demonstrates various animation techniques using the Toxoid QuickJS API

console.log("[AnimationDemo] Loading animation demonstration...");

// Animation manager class
class AnimationManager {
    constructor() {
        this.animatedEntities = [];
        this.time = 0;
        this.animations = {
            rotation: [],
            scale: [],
            movement: [],
            color: []
        };
    }
    
    // Create a rotating entity
    createRotatingEntity(name, x, y, rotationSpeed) {
        const entity = new Toxoid.Entity(name);
        entity.add("Position");
        entity.add("Size");
        entity.add("Scale");
        entity.add("Rect");
        entity.add("Color");
        entity.add("Renderable");
        
        entity.setComponent("Position", { x: x, y: y });
        entity.setComponent("Size", { width: 30, height: 30 });
        entity.setComponent("Scale", { scale: 1.0 });
        entity.setComponent("Rect", { filled: true });
        entity.setComponent("Color", { r: 1.0, g: 0.5, b: 0.0, a: 1.0 }); // Orange
        
        this.animations.rotation.push({
            entity: entity,
            speed: rotationSpeed,
            angle: 0,
            baseX: x,
            baseY: y,
            radius: 50
        });
        
        console.log(`[AnimationDemo] Created rotating entity: ${name}`);
        return entity;
    }
    
    // Create a scaling entity (pulsing effect)
    createPulsingEntity(name, x, y, pulseSpeed) {
        const entity = new Toxoid.Entity(name);
        entity.add("Position");
        entity.add("Size");
        entity.add("Scale");
        entity.add("Rect");
        entity.add("Color");
        entity.add("Renderable");
        
        entity.setComponent("Position", { x: x, y: y });
        entity.setComponent("Size", { width: 40, height: 40 });
        entity.setComponent("Scale", { scale: 1.0 });
        entity.setComponent("Rect", { filled: true });
        entity.setComponent("Color", { r: 0.0, g: 1.0, b: 1.0, a: 1.0 }); // Cyan
        
        this.animations.scale.push({
            entity: entity,
            speed: pulseSpeed,
            minScale: 0.5,
            maxScale: 1.5,
            direction: 1
        });
        
        console.log(`[AnimationDemo] Created pulsing entity: ${name}`);
        return entity;
    }
    
    // Create a moving entity (bouncing)
    createBouncingEntity(name, x, y, velocity) {
        const entity = new Toxoid.Entity(name);
        entity.add("Position");
        entity.add("Size");
        entity.add("Rect");
        entity.add("Color");
        entity.add("Renderable");
        
        entity.setComponent("Position", { x: x, y: y });
        entity.setComponent("Size", { width: 25, height: 25 });
        entity.setComponent("Rect", { filled: true });
        entity.setComponent("Color", { r: 1.0, g: 0.0, b: 1.0, a: 1.0 }); // Magenta
        
        this.animations.movement.push({
            entity: entity,
            velocity: { x: velocity.x, y: velocity.y },
            bounds: { minX: -300, maxX: 300, minY: -200, maxY: 200 }
        });
        
        console.log(`[AnimationDemo] Created bouncing entity: ${name}`);
        return entity;
    }
    
    // Create a color-changing entity
    createColorCyclingEntity(name, x, y, cycleSpeed) {
        const entity = new Toxoid.Entity(name);
        entity.add("Position");
        entity.add("Size");
        entity.add("Rect");
        entity.add("Color");
        entity.add("Renderable");
        
        entity.setComponent("Position", { x: x, y: y });
        entity.setComponent("Size", { width: 35, height: 35 });
        entity.setComponent("Rect", { filled: true });
        entity.setComponent("Color", { r: 1.0, g: 0.0, b: 0.0, a: 1.0 }); // Start with red
        
        this.animations.color.push({
            entity: entity,
            speed: cycleSpeed,
            hue: 0
        });
        
        console.log(`[AnimationDemo] Created color-cycling entity: ${name}`);
        return entity;
    }
    
    // HSV to RGB conversion for color cycling
    hsvToRgb(h, s, v) {
        let r, g, b;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        
        return { r: r, g: g, b: b };
    }
    
    // Update all animations
    update(deltaTime) {
        this.time += deltaTime;
        
        // Update rotation animations
        this.animations.rotation.forEach(anim => {
            anim.angle += anim.speed * deltaTime;
            const x = anim.baseX + Math.cos(anim.angle) * anim.radius;
            const y = anim.baseY + Math.sin(anim.angle) * anim.radius;
            anim.entity.setComponent("Position", { 
                x: Math.floor(x), 
                y: Math.floor(y) 
            });
        });
        
        // Update scale animations
        this.animations.scale.forEach(anim => {
            const scale = anim.entity.getComponent("Scale");
            if (scale) {
                let newScale = scale.scale + (anim.speed * anim.direction * deltaTime);
                
                if (newScale >= anim.maxScale) {
                    newScale = anim.maxScale;
                    anim.direction = -1;
                } else if (newScale <= anim.minScale) {
                    newScale = anim.minScale;
                    anim.direction = 1;
                }
                
                anim.entity.setComponent("Scale", { scale: newScale });
            }
        });
        
        // Update movement animations
        this.animations.movement.forEach(anim => {
            const position = anim.entity.getComponent("Position");
            if (position) {
                let newX = position.x + anim.velocity.x * deltaTime;
                let newY = position.y + anim.velocity.y * deltaTime;
                
                // Bounce off bounds
                if (newX <= anim.bounds.minX || newX >= anim.bounds.maxX) {
                    anim.velocity.x = -anim.velocity.x;
                    newX = Math.max(anim.bounds.minX, Math.min(anim.bounds.maxX, newX));
                }
                if (newY <= anim.bounds.minY || newY >= anim.bounds.maxY) {
                    anim.velocity.y = -anim.velocity.y;
                    newY = Math.max(anim.bounds.minY, Math.min(anim.bounds.maxY, newY));
                }
                
                anim.entity.setComponent("Position", { 
                    x: Math.floor(newX), 
                    y: Math.floor(newY) 
                });
            }
        });
        
        // Update color animations
        this.animations.color.forEach(anim => {
            anim.hue += anim.speed * deltaTime;
            if (anim.hue > 1.0) anim.hue -= 1.0;
            
            const rgb = this.hsvToRgb(anim.hue, 1.0, 1.0);
            anim.entity.setComponent("Color", {
                r: rgb.r,
                g: rgb.g,
                b: rgb.b,
                a: 1.0
            });
        });
    }
    
    // Create a complex animated scene
    createAnimationScene() {
        console.log("[AnimationDemo] Creating complex animation scene...");
        
        // Create multiple animated entities
        this.createRotatingEntity("RotatingSquare1", -100, 0, 2.0);
        this.createRotatingEntity("RotatingSquare2", 100, 0, -1.5);
        
        this.createPulsingEntity("PulsingSquare1", -100, -100, 3.0);
        this.createPulsingEntity("PulsingSquare2", 100, -100, 2.0);
        
        this.createBouncingEntity("BouncingSquare1", 0, 0, { x: 120, y: 80 });
        this.createBouncingEntity("BouncingSquare2", 50, 50, { x: -100, y: 100 });
        
        this.createColorCyclingEntity("ColorSquare1", 0, 100, 1.0);
        this.createColorCyclingEntity("ColorSquare2", 0, -50, 0.5);
        
        console.log("[AnimationDemo] Animation scene created with multiple effects");
    }
    
    // Get animation statistics
    getStats() {
        return {
            totalAnimations: this.animations.rotation.length + 
                           this.animations.scale.length + 
                           this.animations.movement.length + 
                           this.animations.color.length,
            rotationCount: this.animations.rotation.length,
            scaleCount: this.animations.scale.length,
            movementCount: this.animations.movement.length,
            colorCount: this.animations.color.length,
            uptime: this.time
        };
    }
    
    // Clean up all animations
    cleanup() {
        Object.values(this.animations).forEach(animArray => {
            animArray.forEach(anim => {
                anim.entity.destruct();
            });
        });
        
        this.animations = {
            rotation: [],
            scale: [],
            movement: [],
            color: []
        };
        
        console.log("[AnimationDemo] Cleaned up all animations");
    }
}

// Create global animation manager
const animationManager = new AnimationManager();

try {
    // Create the animation scene
    animationManager.createAnimationScene();
    
    // Create animation update system
    const animationSystem = Toxoid.System.create(
        "AnimationUpdateSystem",
        "", // No specific components needed
        Toxoid.Phases.ON_UPDATE,
        function(iter) {
            const deltaTime = 1.0 / 60.0; // Assume 60 FPS
            animationManager.update(deltaTime);
        }
    );
    
    console.log("[AnimationDemo] Animation update system created");
    
    // Create a statistics display system (logs every 5 seconds)
    let statsTimer = 0;
    const statsSystem = Toxoid.System.create(
        "AnimationStatsSystem",
        "",
        Toxoid.Phases.POST_UPDATE,
        function(iter) {
            statsTimer += 1.0 / 60.0;
            if (statsTimer >= 5.0) {
                const stats = animationManager.getStats();
                console.log(`[AnimationDemo] Stats - Total: ${stats.totalAnimations}, ` +
                          `Rot: ${stats.rotationCount}, Scale: ${stats.scaleCount}, ` +
                          `Move: ${stats.movementCount}, Color: ${stats.colorCount}, ` +
                          `Uptime: ${stats.uptime.toFixed(1)}s`);
                statsTimer = 0;
            }
        }
    );
    
    // Expose animation manager globally for debugging
    if (typeof globalThis !== 'undefined') {
        globalThis.animationManager = animationManager;
        globalThis.getAnimationStats = () => animationManager.getStats();
        globalThis.cleanupAnimations = () => animationManager.cleanup();
    }
    
    console.log("[AnimationDemo] Animation demonstration initialized successfully");
    console.log("[AnimationDemo] Watch for rotating, pulsing, bouncing, and color-cycling squares!");
    
} catch (error) {
    console.error("[AnimationDemo] Error in animation demo:", error);
}

console.log("[AnimationDemo] Animation demonstration loaded successfully");