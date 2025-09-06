import { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  console.log("🏁 Starting GameGen E2E Global Teardown");
  
  // Clean up any test artifacts or temporary data
  // This could include clearing test databases, removing temporary files, etc.
  
  console.log("✅ GameGen E2E Global Teardown completed");
}

export default globalTeardown;