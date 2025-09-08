// Example: Entity Movement Concepts
// This script demonstrates movement concepts using basic entity functionality

console.log("[Script] Loading movement concept example...");

// Create entities that represent different types of movement
function createMovingEntities() {
    console.log("[Script] Creating entities for movement demonstration...");
    
    // Static entity (no movement)
    const staticEntity = new Toxoid.Entity("StaticBuilding");
    console.log(`[Script] Created ${staticEntity.getName()} at ID ${staticEntity.getId()}`);
    
    // Patrol entity (moves between points)
    const patrolEntity = Toxoid.Entity.named("PatrolGuard");
    console.log(`[Script] Created ${patrolEntity.getName()} at ID ${patrolEntity.getId()}`);
    
    // Following entity (follows another entity)
    const followerEntity = new Toxoid.Entity("FollowerPet");
    console.log(`[Script] Created ${followerEntity.getName()} at ID ${followerEntity.getId()}`);
    
    // Set up relationships
    followerEntity.childOf(patrolEntity.getId());
    console.log(`[Script] Set ${followerEntity.getName()} to follow ${patrolEntity.getName()}`);
    
    return { staticEntity, patrolEntity, followerEntity };
}

// Simulate movement states using entity properties
function simulateMovementStates(entities) {
    console.log("[Script] Simulating movement states...");
    
    const { staticEntity, patrolEntity, followerEntity } = entities;
    
    // Simulate different movement states by changing entity names
    const movementStates = [
        "Idle", "Moving", "Running", "Attacking", "Returning"
    ];
    
    let stateIndex = 0;
    
    function updateMovementState() {
        const currentState = movementStates[stateIndex];
        
        // Update patrol entity state
        patrolEntity.setName(`PatrolGuard_${currentState}`);
        
        // Follower reacts to patrol entity state
        if (currentState === "Running" || currentState === "Attacking") {
            followerEntity.setName(`FollowerPet_Scared`);
        } else {
            followerEntity.setName(`FollowerPet_Calm`);
        }
        
        console.log(`[Script] Movement state: ${currentState}`);
        console.log(`[Script] - Patrol: ${patrolEntity.getName()}`);
        console.log(`[Script] - Follower: ${followerEntity.getName()}`);
        
        stateIndex = (stateIndex + 1) % movementStates.length;
        
        // Continue simulation
        if (stateIndex !== 0) { // Stop after one full cycle
            setTimeout(updateMovementState, 1500);
        } else {
            console.log("[Script] Movement simulation complete");
        }
    }
    
    // Start the movement simulation
    updateMovementState();
}

// Demonstrate pathfinding concepts
function demonstratePathfinding() {
    console.log("[Script] Demonstrating pathfinding concepts...");
    
    // Create entities representing waypoints
    const waypoints = [];
    const waypointNames = ["Home", "Market", "Guard_Post", "Temple", "Home"];
    
    waypointNames.forEach((name, index) => {
        const waypoint = new Toxoid.Entity(`Waypoint_${name}`);
        waypoints.push(waypoint);
        console.log(`[Script] Created waypoint: ${waypoint.getName()}`);
    });
    
    // Create a traveler entity
    const traveler = new Toxoid.Entity("Traveler");
    console.log(`[Script] Created ${traveler.getName()}`);
    
    // Simulate traveling between waypoints
    let currentWaypoint = 0;
    
    function travelToNextWaypoint() {
        const current = waypoints[currentWaypoint];
        const next = waypoints[(currentWaypoint + 1) % waypoints.length];
        
        console.log(`[Script] ${traveler.getName()} traveling from ${current.getName()} to ${next.getName()}`);
        
        currentWaypoint = (currentWaypoint + 1) % waypoints.length;
        
        if (currentWaypoint !== 0) { // Stop after reaching home again
            setTimeout(travelToNextWaypoint, 2000);
        } else {
            console.log(`[Script] ${traveler.getName()} completed the journey!`);
        }
    }
    
    // Start the journey
    setTimeout(travelToNextWaypoint, 1000);
}

// Create and demonstrate movement
const entities = createMovingEntities();
simulateMovementStates(entities);
demonstratePathfinding();

console.log("[Script] Movement concept example loaded successfully - " + Date.now());