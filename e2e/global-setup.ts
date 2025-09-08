import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting GameGen E2E Global Setup");

  // Check if the GameGen app is accessible
  if (process.env.PLAYWRIGHT_TEST_BASE_URL) {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      await page.goto(process.env.PLAYWRIGHT_TEST_BASE_URL);
      console.log("✅ GameGen app is accessible for E2E tests");

      // Verify the app loads properly
      await page.waitForSelector("body", { timeout: 10000 });
      const title = await page.title();

      console.log(`📱 GameGen app title: ${title}`);
    } catch (error) {
      console.error("❌ GameGen app is not accessible:", error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  // Setup test environment variables
  if (!process.env.E2E_TEST_EMAIL) {
    process.env.E2E_TEST_EMAIL = "test@gamegen.com";
  }
  if (!process.env.E2E_TEST_PASSWORD) {
    process.env.E2E_TEST_PASSWORD = "GameGenTest123!";
  }

  console.log("✅ GameGen E2E Global Setup completed");
}

export default globalSetup;
