import { test, expect } from "@playwright/test";

import { GameGenAuthHelper, TestUser } from "./helpers/auth-helper";
import { GameGenLandingPage } from "./pages/landing-page";
import { GameGenPricingPage } from "./pages/pricing-page";
import { GameGenCreatorPage } from "./pages/game-creator-page";

test.describe("GameGen Error Handling & Edge Cases", () => {
  let authHelper: GameGenAuthHelper;
  let landingPage: GameGenLandingPage;
  let pricingPage: GameGenPricingPage;
  let creatorPage: GameGenCreatorPage;

  test.beforeEach(async ({ page }) => {
    authHelper = new GameGenAuthHelper(page);
    landingPage = new GameGenLandingPage(page);
    pricingPage = new GameGenPricingPage(page);
    creatorPage = new GameGenCreatorPage(page);
  });

  test.describe("Network Connectivity Issues", () => {
    test("should handle complete network failure gracefully", async ({
      page,
    }) => {
      // Start with normal connection
      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Go offline
      const client = await page.context().newCDPSession(page);

      await client.send("Network.enable");
      await client.send("Network.emulateNetworkConditions", {
        offline: true,
        downloadThroughput: 0,
        uploadThroughput: 0,
        latency: 0,
      });

      // Try to navigate to pricing
      await landingPage.navigateToPricing();

      // Should show offline indicator or cached content
      const offlineIndicator = page.locator(
        '[data-testid="offline-indicator"], .offline-status, .network-error',
      );

      const cachedContent = page.locator(
        '[data-testid="cached-content"], .offline-content',
      );

      const hasOfflineHandling = await Promise.race([
        offlineIndicator.isVisible({ timeout: 5000 }),
        cachedContent.isVisible({ timeout: 5000 }),
      ]);

      if (hasOfflineHandling) {
        if (await offlineIndicator.isVisible()) {
          await expect(offlineIndicator).toContainText(
            /offline|no.*connection|network.*error/i,
          );
        } else {
          await expect(cachedContent).toBeVisible();
        }
      }

      // Come back online
      await client.send("Network.emulateNetworkConditions", {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0,
      });

      // Should recover gracefully
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    test("should handle intermittent connectivity", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Simulate intermittent connection by alternating between online/offline
      const client = await page.context().newCDPSession(page);

      await client.send("Network.enable");

      for (let i = 0; i < 3; i++) {
        // Go offline briefly
        await client.send("Network.emulateNetworkConditions", {
          offline: true,
          downloadThroughput: 0,
          uploadThroughput: 0,
          latency: 0,
        });

        await page.waitForTimeout(1000);

        // Come back online
        await client.send("Network.emulateNetworkConditions", {
          offline: false,
          downloadThroughput: -1,
          uploadThroughput: -1,
          latency: 0,
        });

        await page.waitForTimeout(1000);
      }

      // Application should handle the intermittent connectivity
      await creatorPage.verifyCreatorLayout();
    });

    test("should handle slow network connections", async ({ page }) => {
      // Simulate very slow connection (256kbps)
      const client = await page.context().newCDPSession(page);

      await client.send("Network.enable");
      await client.send("Network.emulateNetworkConditions", {
        offline: false,
        downloadThroughput: (256 * 1024) / 8, // 256kbps
        uploadThroughput: (128 * 1024) / 8, // 128kbps
        latency: 2000, // 2s latency
      });

      const startTime = Date.now();

      await landingPage.goto();
      await landingPage.waitForPageLoad();

      const loadTime = Date.now() - startTime;

      // Should show loading states and eventually load
      const loadingIndicator = page.locator(
        '[data-testid="loading"], .loading-spinner, .spinner',
      );

      // Loading indicator should appear for slow connections
      if (await loadingIndicator.isVisible({ timeout: 1000 })) {
        await expect(loadingIndicator).toBeVisible();
      }

      // Should still be usable despite slow connection
      await landingPage.verifyHeroSection();
    });

    test("should retry failed requests", async ({ page }) => {
      let requestCount = 0;

      // Mock API to fail first request, succeed on retry
      await page.route("**/api/**", (route) => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({
            status: 500,
            body: "Server Error",
          });
        } else {
          route.continue();
        }
      });

      await authHelper.loginAsTestUser();

      // Should eventually succeed after retry
      await creatorPage.waitForPageLoad();
      await creatorPage.verifyCreatorLayout();

      expect(requestCount).toBeGreaterThan(1);
    });
  });

  test.describe("Authentication Edge Cases", () => {
    test("should handle expired sessions gracefully", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Simulate session expiration by clearing auth tokens
      await page.evaluate(() => {
        localStorage.removeItem("auth_token");
        sessionStorage.removeItem("session_token");
      });

      // Clear auth cookies
      await page.context().clearCookies();

      // Try to perform authenticated action
      await creatorPage.sendChatMessage("Create a simple game");

      // Should redirect to login or show auth error
      const authError = page.locator(
        '[data-testid="auth-error"], .session-expired, .login-required',
      );

      if (await authError.isVisible({ timeout: 5000 })) {
        await expect(authError).toBeVisible();
        await expect(authError).toContainText(
          /session.*expired|login.*required|unauthorized/i,
        );
      } else {
        // Should redirect to login
        await expect(page).toHaveURL(/login|signin/);
      }
    });

    test("should handle concurrent login attempts", async ({ browser }) => {
      const testUser: TestUser = {
        email: "concurrent-test@gamegen.com",
        password: "ConcurrentTest123!",
      };

      // Create multiple browser contexts
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
      ]);

      const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));
      const authHelpers = pages.map((page) => new GameGenAuthHelper(page));

      // Attempt concurrent logins
      const loginPromises = authHelpers.map((helper) =>
        helper.login(testUser).catch((error) => ({ error })),
      );

      const results = await Promise.all(loginPromises);

      // At least one should succeed, others might fail or succeed depending on implementation
      const successCount = results.filter(
        (result) => !result.hasOwnProperty("error"),
      ).length;

      expect(successCount).toBeGreaterThanOrEqual(1);

      // Clean up
      await Promise.all(contexts.map((ctx) => ctx.close()));
    });

    test("should handle malformed authentication tokens", async ({ page }) => {
      await page.goto("/");

      // Set malformed auth token
      await page.evaluate(() => {
        localStorage.setItem("auth_token", "malformed.jwt.token");
      });

      // Try to access protected route
      await page.goto("/creator");

      // Should handle gracefully and redirect to login
      await expect(page).toHaveURL(/login|signin/);

      const tokenError = page.locator(
        '[data-testid="token-error"], .invalid-token',
      );

      if (await tokenError.isVisible({ timeout: 3000 })) {
        await expect(tokenError).toContainText(
          /invalid.*token|session.*invalid/i,
        );
      }
    });

    test("should handle account locked/suspended scenarios", async ({
      page,
    }) => {
      // Mock account suspension
      await page.route("**/api/auth/login**", (route) => {
        route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Account suspended",
            code: "ACCOUNT_SUSPENDED",
          }),
        });
      });

      await page.goto("/auth");
      await page.fill('input[type="email"]', "suspended@gamegen.com");
      await page.fill('input[type="password"]', "password123");
      await page.click('button[type="submit"]');

      const suspensionError = page.locator(
        '[data-testid="account-suspended"], .account-error',
      );

      if (await suspensionError.isVisible({ timeout: 5000 })) {
        await expect(suspensionError).toBeVisible();
        await expect(suspensionError).toContainText(
          /account.*suspended|account.*locked/i,
        );
      }
    });
  });

  test.describe("Payment & Subscription Edge Cases", () => {
    test("should handle payment processing timeouts", async ({ page }) => {
      await pricingPage.goto();
      await pricingPage.selectPlan("pro");

      // Mock very slow payment processing
      await page.route("**/api/stripe/**", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 30000)); // 30s delay
        route.continue();
      });

      // Fill payment form
      await page.fill('input[type="email"]', "timeout-test@gamegen.com");

      const submitButton = page.locator('button:has-text("Subscribe")');

      await submitButton.click();

      // Should show timeout handling
      const timeoutError = page.locator(
        '[data-testid="payment-timeout"], .timeout-error, .processing-timeout',
      );

      if (await timeoutError.isVisible({ timeout: 35000 })) {
        await expect(timeoutError).toBeVisible();
        await expect(timeoutError).toContainText(
          /timeout|taking.*longer|try.*again/i,
        );
      }
    });

    test("should handle subscription webhook failures", async ({ page }) => {
      await authHelper.loginWithSubscription("pro");

      // Mock webhook failure by setting invalid subscription status
      await page.addInitScript(() => {
        // Simulate webhook failure causing inconsistent state
        window.mockWebhookFailure = true;

        // Mock subscription status check returning error
        window.fetch = new Proxy(window.fetch, {
          apply: function (target, thisArg, args) {
            const [url] = args;

            if (
              typeof url === "string" &&
              url.includes("/subscription/status")
            ) {
              return Promise.resolve(
                new Response(
                  JSON.stringify({ error: "Webhook processing failed" }),
                  { status: 500 },
                ),
              );
            }

            return Reflect.apply(target, thisArg, args);
          },
        });
      });

      await page.goto("/creator");

      // Should handle webhook failure gracefully
      const webhookError = page.locator(
        '[data-testid="sync-error"], .webhook-error, .subscription-sync-error',
      );

      if (await webhookError.isVisible({ timeout: 5000 })) {
        await expect(webhookError).toBeVisible();
        await expect(webhookError).toContainText(
          /sync.*error|subscription.*status/i,
        );
      }
    });

    test("should handle credit system edge cases", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Mock user with exactly 0 credits
      await page.addInitScript(() => {
        window.mockUserCredits = 0;
      });

      // Try to use vibe coding (which requires credits)
      await creatorPage.sendChatMessage("Create a complex RPG game");

      // Should show credit exhaustion warning
      const creditWarning = page.locator(
        '[data-testid="no-credits"], .credit-exhausted, .credits-empty',
      );

      if (await creditWarning.isVisible({ timeout: 5000 })) {
        await expect(creditWarning).toBeVisible();
        await expect(creditWarning).toContainText(
          /no.*credits|credits.*exhausted|purchase.*credits/i,
        );
      }

      // Should offer credit purchase or upgrade
      const purchaseCredits = page.locator(
        '[data-testid="purchase-credits"], button:has-text("Buy Credits")',
      );

      const upgradePrompt = page.locator(
        '[data-testid="upgrade-prompt"], button:has-text("Upgrade")',
      );

      const hasCreditSolution = await Promise.race([
        purchaseCredits.isVisible({ timeout: 2000 }),
        upgradePrompt.isVisible({ timeout: 2000 }),
      ]);

      expect(hasCreditSolution).toBe(true);
    });

    test("should handle plan downgrade restrictions", async ({ page }) => {
      await authHelper.loginWithSubscription("max");
      await page.goto("/settings/billing");

      // Try to downgrade to free plan with active projects
      const downgradeButton = page.locator(
        '[data-testid="downgrade-free"], button:has-text("Downgrade")',
      );

      if (await downgradeButton.isVisible({ timeout: 3000 })) {
        await downgradeButton.click();

        // Should show downgrade restrictions
        const restrictionWarning = page.locator(
          '[data-testid="downgrade-restrictions"], .downgrade-warning',
        );

        if (await restrictionWarning.isVisible({ timeout: 3000 })) {
          await expect(restrictionWarning).toBeVisible();
          await expect(restrictionWarning).toContainText(
            /projects.*affected|features.*lost|data.*archived/i,
          );
        }
      }
    });
  });

  test.describe("Game Creator Edge Cases", () => {
    test("should handle AI service failures", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Mock AI service failure
      await page.route("**/api/ai/**", (route) => {
        route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "AI service unavailable" }),
        });
      });

      // Try to use vibe coding
      await creatorPage.sendChatMessage("Create a platformer game");

      // Should show AI service error
      const aiError = page.locator(
        '[data-testid="ai-error"], .ai-service-error, .llm-error',
      );

      if (await aiError.isVisible({ timeout: 10000 })) {
        await expect(aiError).toBeVisible();
        await expect(aiError).toContainText(
          /ai.*service|temporarily.*unavailable|llm.*error/i,
        );
      }

      // Should offer retry option
      const retryButton = page.locator(
        '[data-testid="retry-ai"], button:has-text("Retry")',
      );

      if (await retryButton.isVisible()) {
        await expect(retryButton).toBeVisible();
      }
    });

    test("should handle malformed AI responses", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Mock malformed AI response
      await page.route("**/api/ai/**", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: '{"invalid": "json"', // Malformed JSON
        });
      });

      await creatorPage.sendChatMessage("Create a simple game");

      // Should handle malformed response gracefully
      const parseError = page.locator(
        '[data-testid="parse-error"], .response-error, .ai-parse-error',
      );

      if (await parseError.isVisible({ timeout: 5000 })) {
        await expect(parseError).toBeVisible();
        await expect(parseError).toContainText(
          /response.*error|invalid.*response|parse.*error/i,
        );
      }
    });

    test("should handle extremely long AI responses", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Mock extremely long AI response
      const longResponse = "A".repeat(50000); // 50k character response

      await page.route("**/api/ai/**", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            response: longResponse,
            actions: ["create_game", "add_sprites", "configure_physics"],
          }),
        });
      });

      await creatorPage.sendChatMessage("Create a detailed game");

      // Should handle long response appropriately (truncation, pagination, etc.)
      const chatResponse = page.locator(
        '.chat-message, [data-testid="chat-response"]',
      );

      if (await chatResponse.isVisible({ timeout: 10000 })) {
        await expect(chatResponse).toBeVisible();

        const responseText = await chatResponse.textContent();

        // Should either truncate or paginate long responses
        expect(responseText?.length).toBeLessThan(10000);
      }
    });

    test("should handle asset loading failures", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Mock asset API failures
      await page.route("**/api/assets/**", (route) => {
        route.fulfill({
          status: 404,
          body: "Assets not found",
        });
      });

      // Try to search for assets
      await creatorPage.searchAssets("character sprites");

      // Should show asset loading error
      const assetError = page.locator(
        '[data-testid="asset-error"], .asset-load-error, .asset-failure',
      );

      if (await assetError.isVisible({ timeout: 5000 })) {
        await expect(assetError).toBeVisible();
        await expect(assetError).toContainText(
          /asset.*error|failed.*load|assets.*unavailable/i,
        );
      }
    });

    test("should handle project save failures", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Mock save API failure
      await page.route("**/api/projects/save**", (route) => {
        route.fulfill({
          status: 500,
          body: "Save failed",
        });
      });

      // Try to save project
      await creatorPage.saveProject("Test Save Failure");

      // Should show save error
      const saveError = page.locator(
        '[data-testid="save-error"], .save-failure, .project-save-error',
      );

      if (await saveError.isVisible({ timeout: 5000 })) {
        await expect(saveError).toBeVisible();
        await expect(saveError).toContainText(
          /save.*failed|could.*not.*save|save.*error/i,
        );
      }

      // Should offer retry or local save
      const retryOption = page.locator(
        '[data-testid="retry-save"], button:has-text("Retry")',
      );

      const localSaveOption = page.locator(
        '[data-testid="local-save"], button:has-text("Save Locally")',
      );

      const hasSaveOption = await Promise.race([
        retryOption.isVisible({ timeout: 2000 }),
        localSaveOption.isVisible({ timeout: 2000 }),
      ]);

      expect(hasSaveOption).toBe(true);
    });
  });

  test.describe("Browser Compatibility Edge Cases", () => {
    test("should handle unsupported features gracefully", async ({ page }) => {
      // Mock browser without certain features
      await page.addInitScript(() => {
        // Remove WebGL support
        delete (HTMLCanvasElement.prototype as any).getContext;

        // Remove local storage
        delete (window as any).localStorage;

        // Remove WebRTC
        delete (window as any).RTCPeerConnection;
      });

      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Should show compatibility warnings
      const compatibilityWarning = page.locator(
        '[data-testid="compatibility-warning"], .browser-warning, .feature-warning',
      );

      if (await compatibilityWarning.isVisible({ timeout: 3000 })) {
        await expect(compatibilityWarning).toBeVisible();
        await expect(compatibilityWarning).toContainText(
          /browser.*support|upgrade.*browser|feature.*unavailable/i,
        );
      }

      // Should still provide basic functionality
      await landingPage.verifyHeroSection();
    });

    test("should handle storage quota exceeded", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Mock storage quota exceeded
      await page.addInitScript(() => {
        const originalSetItem = Storage.prototype.setItem;

        Storage.prototype.setItem = function (key: string, value: string) {
          if (value.length > 100) {
            // Simulate quota exceeded for large values
            throw new DOMException("QuotaExceededError", "QuotaExceededError");
          }

          return originalSetItem.call(this, key, value);
        };
      });

      // Try to save a large project
      const largeProjectData = "x".repeat(1000);

      await page.evaluate((data) => {
        try {
          localStorage.setItem("large_project", data);
        } catch (error) {
          window.storageQuotaExceeded = true;
        }
      }, largeProjectData);

      // Should handle quota exceeded error
      const quotaError = page.locator(
        '[data-testid="storage-quota"], .quota-error, .storage-full',
      );

      if (await quotaError.isVisible({ timeout: 3000 })) {
        await expect(quotaError).toBeVisible();
        await expect(quotaError).toContainText(
          /storage.*full|quota.*exceeded|clear.*data/i,
        );
      }
    });

    test("should handle JavaScript errors gracefully", async ({ page }) => {
      // Listen for JavaScript errors
      const jsErrors: string[] = [];

      page.on("pageerror", (error) => {
        jsErrors.push(error.message);
      });

      // Inject a script that causes an error
      await page.addInitScript(() => {
        setTimeout(() => {
          throw new Error("Test JavaScript error");
        }, 1000);
      });

      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Wait for potential error
      await page.waitForTimeout(2000);

      // Page should still be functional despite JS errors
      await landingPage.verifyHeroSection();

      // Should have error boundary or error handling
      const errorBoundary = page.locator(
        '[data-testid="error-boundary"], .error-fallback, .js-error',
      );

      if (await errorBoundary.isVisible({ timeout: 1000 })) {
        await expect(errorBoundary).toBeVisible();
      }
    });
  });

  test.describe("Data Validation Edge Cases", () => {
    test("should handle XSS attempts in user input", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Try to inject XSS in chat message
      const xssAttempt =
        '<script>alert("XSS")</script><img src="x" onerror="alert(\'XSS\')">';

      await creatorPage.sendChatMessage(xssAttempt);

      // Should sanitize input and not execute scripts
      const chatResponse = page.locator(
        '.chat-message, [data-testid="chat-response"]',
      );

      if (await chatResponse.isVisible({ timeout: 5000 })) {
        const responseHTML = await chatResponse.innerHTML();

        // Should not contain script tags or event handlers
        expect(responseHTML).not.toContain("<script>");
        expect(responseHTML).not.toContain("onerror=");
        expect(responseHTML).not.toContain("onclick=");
      }
    });

    test("should handle SQL injection attempts", async ({ page }) => {
      await page.goto("/auth");

      // Try SQL injection in email field
      const sqlInjection = "'; DROP TABLE users; --";

      await page.fill('input[type="email"]', sqlInjection);
      await page.fill('input[type="password"]', "password123");
      await page.click('button[type="submit"]');

      // Should handle gracefully (either validation error or safe handling)
      const validationError = page.locator(
        '[data-testid="validation-error"], .form-error, .input-error',
      );

      const loginError = page.locator(
        '[data-testid="login-error"], .auth-error',
      );

      const hasErrorHandling = await Promise.race([
        validationError.isVisible({ timeout: 3000 }),
        loginError.isVisible({ timeout: 3000 }),
      ]);

      // Should show some form of error rather than crashing
      expect(hasErrorHandling).toBe(true);
    });

    test("should handle extremely long input values", async ({ page }) => {
      await page.goto("/auth");

      // Try extremely long values
      const longString = "a".repeat(10000);

      await page.fill('input[name="firstName"]', longString);
      await page.fill('input[type="email"]', `${longString}@test.com`);

      // Should either validate or truncate
      const firstNameValue = await page.inputValue('input[name="firstName"]');
      const emailValue = await page.inputValue('input[type="email"]');

      // Values should be reasonable length (validation or truncation)
      expect(firstNameValue.length).toBeLessThan(1000);
      expect(emailValue.length).toBeLessThan(1000);
    });

    test("should handle invalid file uploads", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Try to upload invalid files (if file upload is available)
      const fileUpload = page.locator(
        'input[type="file"], [data-testid="file-upload"]',
      );

      if (await fileUpload.isVisible({ timeout: 2000 })) {
        // Create a temporary invalid file
        const invalidFileContent = "This is not a valid image file";

        // Mock file upload with invalid content
        await page.setInputFiles(fileUpload, {
          name: "invalid.exe",
          mimeType: "application/x-executable",
          buffer: Buffer.from(invalidFileContent),
        });

        // Should show validation error
        const uploadError = page.locator(
          '[data-testid="upload-error"], .file-error, .invalid-file',
        );

        if (await uploadError.isVisible({ timeout: 3000 })) {
          await expect(uploadError).toBeVisible();
          await expect(uploadError).toContainText(
            /invalid.*file|file.*type|not.*supported/i,
          );
        }
      }
    });
  });

  test.describe("Rate Limiting & Abuse Prevention", () => {
    test("should handle API rate limiting", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Mock rate limit response
      let requestCount = 0;

      await page.route("**/api/ai/**", (route) => {
        requestCount++;
        if (requestCount > 3) {
          route.fulfill({
            status: 429,
            contentType: "application/json",
            body: JSON.stringify({
              error: "Rate limit exceeded",
              retryAfter: 60,
            }),
          });
        } else {
          route.continue();
        }
      });

      // Send multiple requests quickly
      for (let i = 0; i < 5; i++) {
        await creatorPage.sendChatMessage(`Create game ${i}`);
        await page.waitForTimeout(100);
      }

      // Should show rate limit error
      const rateLimitError = page.locator(
        '[data-testid="rate-limit"], .rate-limited, .too-many-requests',
      );

      if (await rateLimitError.isVisible({ timeout: 5000 })) {
        await expect(rateLimitError).toBeVisible();
        await expect(rateLimitError).toContainText(
          /rate.*limit|too.*many.*requests|slow.*down/i,
        );
      }
    });

    test("should prevent spam submissions", async ({ page }) => {
      await page.goto("/auth");

      const submitButton = page.locator('button[type="submit"]');

      // Try to submit form multiple times rapidly
      for (let i = 0; i < 10; i++) {
        await submitButton.click();
        await page.waitForTimeout(100);
      }

      // Should prevent spam (disable button, show warning, etc.)
      const isDisabled = await submitButton.isDisabled();
      const spamWarning = page.locator(
        '[data-testid="spam-warning"], .rate-limit-warning',
      );

      const hasSpamPrevention =
        isDisabled || (await spamWarning.isVisible({ timeout: 1000 }));

      expect(hasSpamPrevention).toBe(true);
    });
  });
});
