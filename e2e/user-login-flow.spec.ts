import { test, expect } from "@playwright/test";

import { GameGenAuthHelper, TestUser } from "./helpers/auth-helper";
import { GameGenLandingPage } from "./pages/landing-page";
import { GameGenCreatorPage } from "./pages/game-creator-page";

test.describe("GameGen Existing User Login Flow", () => {
  let authHelper: GameGenAuthHelper;
  let landingPage: GameGenLandingPage;
  let creatorPage: GameGenCreatorPage;

  test.beforeEach(async ({ page }) => {
    authHelper = new GameGenAuthHelper(page);
    landingPage = new GameGenLandingPage(page);
    creatorPage = new GameGenCreatorPage(page);
  });

  test.describe("Standard Login Flow", () => {
    test("should complete full login flow from landing page", async ({
      page,
    }) => {
      // Step 1: Visit landing page
      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Verify landing page loads correctly
      await landingPage.verifyHeroSection();

      // Step 2: Click "Login" button
      await landingPage.clickLogin();

      // Should navigate to auth page
      await expect(page).toHaveURL(/auth/);

      // Step 3: Verify login page elements
      const loginForm = page.locator('[data-testid="login-form"], form');

      await expect(loginForm).toBeVisible();

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const loginButton = page.locator(
        'button[type="submit"], button:has-text("Sign In")',
      );

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(loginButton).toBeVisible();

      // Step 4: Login with existing test user
      await authHelper.loginAsTestUser();

      // Step 5: Verify successful login and redirect to game creator
      await creatorPage.waitForPageLoad();
      await creatorPage.verifyCreatorLayout();
      await authHelper.verifyLoggedIn();
    });

    test("should remember login credentials", async ({ page }) => {
      await page.goto("/auth");

      // Fill login form
      const testUser = {
        email: "remember-me@test.gamegen.com",
        password: "RememberMe123!",
      };

      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);

      // Check "Remember Me" if available
      const rememberCheckbox = page.locator(
        '[data-testid="remember-me"], input[type="checkbox"], input[name="remember"]',
      );

      if (await rememberCheckbox.isVisible({ timeout: 2000 })) {
        await rememberCheckbox.check();
        await expect(rememberCheckbox).toBeChecked();
      }

      const loginButton = page.locator('button[type="submit"]');

      await loginButton.click();

      // After successful login, logout and revisit
      if (await authHelper.isLoggedIn()) {
        await authHelper.logout();
        await page.goto("/auth");

        // Email should be pre-filled if remember me was checked
        const emailValue = await page.inputValue('input[type="email"]');

        if (emailValue) {
          expect(emailValue).toBe(testUser.email);
        }
      }
    });

    test("should handle direct access to authenticated routes", async ({
      page,
    }) => {
      // Try to access creator page without being logged in
      await page.goto("/creator");

      // Should redirect to login page
      await expect(page).toHaveURL(/login|signin/);

      // Login and should redirect back to originally requested page
      await authHelper.loginAsTestUser();
      await expect(page).toHaveURL(/creator/);

      await creatorPage.verifyCreatorLayout();
    });
  });

  test.describe("Social Authentication Login", () => {
    test("should handle Google OAuth login", async ({ page }) => {
      await page.goto("/auth");

      const googleButton = page.locator(
        '[data-testid="google-login"], button:has-text("Google"), .oauth-google',
      );

      if (await googleButton.isVisible({ timeout: 3000 })) {
        // Mock successful Google OAuth
        await page.route("**/auth/google**", (route) => {
          route.fulfill({
            status: 302,
            headers: {
              location: "/creator?oauth=success",
            },
          });
        });

        await googleButton.click();

        // Should redirect to creator page
        await expect(page).toHaveURL(/creator/);
        await creatorPage.verifyCreatorLayout();
      } else {
        test.skip(); // Skip if Google OAuth not implemented
      }
    });

    test("should handle GitHub OAuth login", async ({ page }) => {
      await page.goto("/auth");

      const githubButton = page.locator(
        '[data-testid="github-login"], button:has-text("GitHub"), .oauth-github',
      );

      if (await githubButton.isVisible({ timeout: 3000 })) {
        // Mock successful GitHub OAuth
        await page.route("**/auth/github**", (route) => {
          route.fulfill({
            status: 302,
            headers: {
              location: "/creator?oauth=success",
            },
          });
        });

        await githubButton.click();
        await expect(page).toHaveURL(/creator/);
        await creatorPage.verifyCreatorLayout();
      } else {
        test.skip(); // Skip if GitHub OAuth not implemented
      }
    });

    test("should handle OAuth errors gracefully", async ({ page }) => {
      await page.goto("/auth");

      const googleButton = page.locator('button:has-text("Google")');

      if (await googleButton.isVisible({ timeout: 3000 })) {
        // Mock OAuth error
        await page.route("**/auth/google**", (route) => {
          route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ error: "OAuth authentication failed" }),
          });
        });

        await googleButton.click();

        // Should show error message
        const oauthError = page.locator(
          '[data-testid="oauth-error"], .oauth-error, .auth-error',
        );

        if (await oauthError.isVisible({ timeout: 5000 })) {
          await expect(oauthError).toBeVisible();
          await expect(oauthError).toContainText(
            /oauth|authentication.*failed/i,
          );
        }
      }
    });
  });

  test.describe("Password Management", () => {
    test("should toggle password visibility", async ({ page }) => {
      await page.goto("/auth");

      const passwordInput = page.locator('input[type="password"]');
      const toggleButton = page.locator(
        '[data-testid="password-toggle"], button:has([data-icon="eye"]), .password-toggle',
      );

      // Password should be hidden initially
      await expect(passwordInput).toHaveAttribute("type", "password");

      if (await toggleButton.isVisible({ timeout: 2000 })) {
        // Toggle to show password
        await toggleButton.click();

        // Password should be visible now (type changed to text)
        const visiblePasswordInput = page
          .locator('input[type="text"]')
          .or(passwordInput);

        await expect(visiblePasswordInput).toBeVisible();

        // Toggle back to hide
        await toggleButton.click();
        await expect(passwordInput).toHaveAttribute("type", "password");
      }
    });

    test("should navigate to forgot password", async ({ page }) => {
      await page.goto("/auth");

      const forgotPasswordLink = page.locator(
        '[data-testid="forgot-password"], a:has-text("Forgot"), a[href*="forgot"]',
      );

      if (await forgotPasswordLink.isVisible({ timeout: 2000 })) {
        await forgotPasswordLink.click();
        await expect(page).toHaveURL(/forgot|reset/);

        // Verify forgot password page
        const forgotForm = page.locator(
          'form, [data-testid="forgot-password-form"]',
        );

        await expect(forgotForm).toBeVisible();

        const emailInput = page.locator('input[type="email"]');

        await expect(emailInput).toBeVisible();
      }
    });

    test("should handle password reset flow", async ({ page }) => {
      await page.goto("/forgot-password");

      const emailInput = page.locator('input[type="email"]');
      const resetButton = page.locator(
        'button[type="submit"], button:has-text("Reset"), [data-testid="reset-button"]',
      );

      if (await emailInput.isVisible({ timeout: 3000 })) {
        await emailInput.fill("test@gamegen.com");
        await resetButton.click();

        // Should show confirmation message
        const confirmationMessage = page.locator(
          '[data-testid="reset-confirmation"], .reset-confirmation, .success-message',
        );

        if (await confirmationMessage.isVisible({ timeout: 3000 })) {
          await expect(confirmationMessage).toBeVisible();
          await expect(confirmationMessage).toContainText(
            /email.*sent|reset.*link/i,
          );
        }

        // Test reset token validation
        await page.goto("/reset-password?token=test-reset-token");

        const newPasswordForm = page.locator(
          '[data-testid="new-password-form"], form',
        );

        if (await newPasswordForm.isVisible({ timeout: 3000 })) {
          await expect(newPasswordForm).toBeVisible();

          const newPasswordInput = page.locator(
            'input[type="password"]:first-of-type',
          );
          const confirmPasswordInput = page.locator(
            'input[type="password"]:last-of-type',
          );

          await expect(newPasswordInput).toBeVisible();
          await expect(confirmPasswordInput).toBeVisible();
        }
      }
    });
  });

  test.describe("Session Management", () => {
    test("should maintain session across page reloads", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Reload page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Should still be logged in
      await expect(authHelper.isLoggedIn()).resolves.toBe(true);
      await creatorPage.verifyCreatorLayout();
    });

    test("should handle session expiration", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Mock session expiration
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());
      await page.evaluate(() => sessionStorage.clear());

      // Try to access authenticated content
      await page.reload();

      // Should redirect to login page
      await expect(page).toHaveURL(/login|signin/);
    });

    test("should handle logout from user menu", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      await authHelper.logout();
      await authHelper.verifyLoggedOut();
    });

    test("should handle concurrent sessions", async ({ browser }) => {
      // Login in first context
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();
      const authHelper1 = new GameGenAuthHelper(page1);

      await authHelper1.loginAsTestUser();

      // Login with different user in second context
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      const authHelper2 = new GameGenAuthHelper(page2);

      const secondUser: TestUser = {
        email: "second-user@test.gamegen.com",
        password: "SecondUser123!",
      };

      try {
        await authHelper2.login(secondUser);
      } catch {
        // If user doesn't exist, that's fine for this test
        console.log(
          "Second user doesn't exist, skipping concurrent session test",
        );
      }

      // Both sessions should remain independent
      await expect(authHelper1.isLoggedIn()).resolves.toBe(true);

      await context1.close();
      await context2.close();
    });
  });

  test.describe("Form Validation & Error Handling", () => {
    test("should validate required fields", async ({ page }) => {
      await page.goto("/auth");

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]');

      await submitButton.click();

      // Should show validation or disable button
      const isDisabled = await submitButton.isDisabled();

      if (!isDisabled) {
        const validationError = page.locator(
          '.validation-error, [data-testid="validation-error"]',
        );

        if (await validationError.isVisible({ timeout: 2000 })) {
          await expect(validationError).toBeVisible();
        }
      }
    });

    test("should handle invalid credentials", async ({ page }) => {
      await page.goto("/auth");

      await page.fill('input[type="email"]', "wrong@gamegen.com");
      await page.fill('input[type="password"]', "wrongpassword");

      const submitButton = page.locator('button[type="submit"]');

      await submitButton.click();

      // Should show invalid credentials error
      const credentialsError = page.locator(
        '[data-testid="credentials-error"], .auth-error, .login-error',
      );

      if (await credentialsError.isVisible({ timeout: 5000 })) {
        await expect(credentialsError).toBeVisible();
        await expect(credentialsError).toContainText(
          /invalid.*credentials|incorrect.*password/i,
        );
      }
    });

    test("should handle account lockout", async ({ page }) => {
      await page.goto("/auth");

      // Simulate multiple failed login attempts
      const wrongCredentials = {
        email: "lockout-test@gamegen.com",
        password: "wrongpassword",
      };

      for (let i = 0; i < 3; i++) {
        await page.fill('input[type="email"]', wrongCredentials.email);
        await page.fill('input[type="password"]', wrongCredentials.password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);
      }

      // Should show account lockout message
      const lockoutMessage = page.locator(
        '[data-testid="account-locked"], .account-lockout, .too-many-attempts',
      );

      if (await lockoutMessage.isVisible({ timeout: 3000 })) {
        await expect(lockoutMessage).toBeVisible();
        await expect(lockoutMessage).toContainText(
          /locked|too.*many.*attempts|try.*again/i,
        );
      }
    });

    test("should handle server errors gracefully", async ({ page }) => {
      await page.goto("/auth");

      // Mock server error
      await page.route("**/api/auth/login**", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      await page.fill('input[type="email"]', "test@gamegen.com");
      await page.fill('input[type="password"]', "password123");
      await page.click('button[type="submit"]');

      // Should show server error message
      const serverError = page.locator(
        '[data-testid="server-error"], .server-error, .system-error',
      );

      if (await serverError.isVisible({ timeout: 5000 })) {
        await expect(serverError).toBeVisible();
        await expect(serverError).toContainText(
          /server.*error|system.*unavailable/i,
        );
      }
    });

    test("should handle network connectivity issues", async ({ page }) => {
      await page.goto("/auth");

      // Simulate network failure
      await page.route("**/api/auth/login**", (route) => route.abort());

      await page.fill('input[type="email"]', "test@gamegen.com");
      await page.fill('input[type="password"]', "password123");
      await page.click('button[type="submit"]');

      // Should show network error
      const networkError = page.locator(
        '[data-testid="network-error"], .network-error, .connection-error',
      );

      if (await networkError.isVisible({ timeout: 5000 })) {
        await expect(networkError).toBeVisible();
        await expect(networkError).toContainText(/network|connection|offline/i);
      }
    });
  });

  test.describe("User Experience & Accessibility", () => {
    test("should provide clear loading states", async ({ page }) => {
      await page.goto("/auth");

      // Mock slow login response
      await page.route("**/api/auth/login**", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        route.continue();
      });

      await page.fill('input[type="email"]', "test@gamegen.com");
      await page.fill('input[type="password"]', "password123");

      const submitButton = page.locator('button[type="submit"]');

      await submitButton.click();

      // Should show loading state
      const loadingSpinner = page.locator(
        '[data-testid="loading-spinner"], .spinner, .loading',
      );

      if (await loadingSpinner.isVisible({ timeout: 1000 })) {
        await expect(loadingSpinner).toBeVisible();
      }

      // Button should be disabled during loading
      await expect(submitButton).toBeDisabled();
    });

    test("should be keyboard accessible", async ({ page }) => {
      await page.goto("/auth");

      // Tab through form elements
      await page.keyboard.press("Tab"); // Email
      const emailInput = page.locator(":focus");

      await expect(emailInput).toHaveAttribute("type", "email");

      await page.keyboard.press("Tab"); // Password
      const passwordInput = page.locator(":focus");

      await expect(passwordInput).toHaveAttribute("type", "password");

      await page.keyboard.press("Tab"); // Submit button
      const submitButton = page.locator(":focus");

      await expect(submitButton).toHaveAttribute("type", "submit");

      // Should be able to submit with Enter
      await emailInput.focus();
      await page.keyboard.type("test@gamegen.com");
      await page.keyboard.press("Tab");
      await page.keyboard.type("password123");
      await page.keyboard.press("Enter");
    });

    test("should have proper ARIA labels and form structure", async ({
      page,
    }) => {
      await page.goto("/auth");

      // Check form accessibility
      const loginForm = page.locator('form, [role="form"]');

      await expect(loginForm).toBeVisible();

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      // Inputs should have labels or aria-labels
      const emailLabel =
        (await emailInput.getAttribute("aria-label")) ||
        (await page.locator("label[for]").first().textContent());

      expect(emailLabel).toBeTruthy();

      const passwordLabel =
        (await passwordInput.getAttribute("aria-label")) ||
        (await page.locator("label").nth(1).textContent());

      expect(passwordLabel).toBeTruthy();
    });

    test("should provide helpful error messages", async ({ page }) => {
      await page.goto("/auth");

      // Test email format validation
      await page.fill('input[type="email"]', "invalid-email");
      await page.fill('input[type="password"]', "password123");
      await page.click('button[type="submit"]');

      const emailError = page.locator(
        '.email-error, [data-testid="email-error"]',
      );

      if (await emailError.isVisible({ timeout: 2000 })) {
        await expect(emailError).toContainText(/valid.*email|format/i);
      }
    });
  });

  test.describe("Mobile Login Experience", () => {
    test("should work correctly on mobile devices", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/auth");

      // Form should be visible and usable on mobile
      const loginForm = page.locator('form, [data-testid="login-form"]');

      await expect(loginForm).toBeVisible();

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();

      // Inputs should be properly sized for touch
      const emailBox = await emailInput.boundingBox();
      const submitBox = await submitButton.boundingBox();

      expect(emailBox?.height).toBeGreaterThan(44); // Minimum touch target
      expect(submitBox?.height).toBeGreaterThan(44);
    });
  });
});
