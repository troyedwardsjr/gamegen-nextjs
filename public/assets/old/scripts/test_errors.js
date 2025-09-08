// Test script to verify error handling
console.log("Testing error handling...");

try {
    // Test 1: Invalid API call
    console.log("Test 1: Invalid API call");
    Toxoid.API.nonExistentFunction();
} catch (error) {
    console.log("✓ Caught expected error:", error);
}

try {
    // Test 2: Invalid parameters
    console.log("Test 2: Invalid parameters");
    Toxoid.API.filledRect("invalid", "params", "here"); // Invalid types
} catch (error) {
    console.log("✓ Caught parameter error:", error);
}

try {
    // Test 3: Syntax error (this should be caught during compilation)
    console.log("Test 3: Runtime error");
    throw new Error("Intentional runtime error");
} catch (error) {
    console.log("✓ Caught runtime error:", error);
}

console.log("Error handling test completed");