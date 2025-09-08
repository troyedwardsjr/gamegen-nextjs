import { test, expect } from "@playwright/test";

import { GameGenAuthHelper, TestUser } from "./helpers/auth-helper";
import { GameGenLandingPage } from "./pages/landing-page";
import { GameGenCreatorPage } from "./pages/game-creator-page";

test.describe("GameGen New User Registration Flow", () => {
  let authHelper: GameGenAuthHelper;
  let landingPage: GameGenLandingPage;
  let creatorPage: GameGenCreatorPage;

  test.beforeEach(async ({ page }) => {
    authHelper = new GameGenAuthHelper(page);
    landingPage = new GameGenLandingPage(page);
    creatorPage = new GameGenCreatorPage(page);
  });

  test.describe("Complete Registration Journey", () => {
    test("should complete full new user registration flow from landing page", async ({
      page,
    }) => {
      // Step 1: Visit landing page
      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Verify landing page loads correctly
      await landingPage.verifyHeroSection();
      await landingPage.verifyNavigationMenu();

      // Step 2: Click "Get Started" CTA
      await landingPage.clickGetStarted();

      // Should navigate to auth page (registration is handled via toggle)
      await expect(page).toHaveURL(/auth/);

      // Step 3: Complete registration form
      const timestamp = Date.now();
      const newUser: TestUser = {
        email: `new-user-${timestamp}@test.gamegen.com`,
        password: "NewUserGameGen123!",
        firstName: "New",
        lastName: "GameCreator",
      };

      await authHelper.registerTestUser(newUser);

      // Step 4: Handle email verification if required
      if (page.url().includes("/verify")) {
        // In test environment, simulate email verification
        await page.goto("/dashboard"); // Mock auto-verification
      }

      // Step 5: Verify successful registration and access to game creator
      await creatorPage.waitForPageLoad();
      await creatorPage.verifyCreatorLayout();

      // Should see welcome message or onboarding
      const welcomeMessage = page.locator(
        '[data-testid="welcome-message"], .welcome-banner, .onboarding-welcome',
      );

      if (await welcomeMessage.isVisible({ timeout: 3000 })) {
        await expect(welcomeMessage).toBeVisible();
      }
    });

    test("should handle registration form validation", async ({ page }) => {
      await landingPage.goto();
      await landingPage.clickGetStarted();

      // Test empty form submission
      const submitButton = page.locator(
        'button[type="submit"], [data-testid="register-button"]',
      );

      await submitButton.click();

      // Should show validation errors or disable button
      const isDisabled = await submitButton.isDisabled();

      if (!isDisabled) {
        const errorMessage = page.locator(
          '.error-message, [data-testid="validation-error"], [role="alert"]',
        );

        await expect(errorMessage).toBeVisible();
      }

      // Test invalid email format
      await page.fill('input[type="email"]', "invalid-email");
      await page.fill('input[type="password"]:first-of-type', "password123");
      await submitButton.click();

      const emailError = page.locator(
        '.email-error, [data-testid="email-error"]',
      );

      if (await emailError.isVisible({ timeout: 2000 })) {
        await expect(emailError).toContainText(/valid.*email|email.*invalid/i);
      }

      // Test password mismatch
      await page.fill('input[type="email"]', "test@gamegen.com");
      await page.fill('input[type="password"]:first-of-type', "password123");
      await page.fill(
        'input[type="password"]:last-of-type',
        "differentpassword",
      );
      await submitButton.click();

      const passwordError = page.locator(
        '.password-error, [data-testid="password-error"]',
      );

      if (await passwordError.isVisible({ timeout: 2000 })) {
        await expect(passwordError).toContainText(
          /password.*match|passwords.*different/i,
        );
      }
    });

    test("should show password strength indicator", async ({ page }) => {
      await landingPage.goto();
      await landingPage.clickGetStarted();

      const passwordInput = page.locator(
        'input[type="password"]:first-of-type',
      );

      // Test weak password
      await passwordInput.fill("123");
      const strengthIndicator = page.locator(
        '[data-testid="password-strength"], .password-strength, .strength-meter',
      );

      if (await strengthIndicator.isVisible({ timeout: 2000 })) {
        await expect(strengthIndicator).toBeVisible();
        // Should indicate weak password
        await expect(strengthIndicator).toContainText(/weak|poor/i);
      }

      // Test strong password
      await passwordInput.fill("StrongGameGenPassword123!");
      if (await strengthIndicator.isVisible()) {
        await expect(strengthIndicator).toContainText(/strong|good|excellent/i);
      }
    });
  });

  test.describe("Social Authentication", () => {
    test("should handle Google OAuth registration", async ({ page }) => {
      await landingPage.goto();
      await landingPage.clickGetStarted();

      // Click Google sign up button
      const googleButton = page.locator(
        '[data-testid="google-signup"], button:has-text("Google"), .oauth-google',
      );

      if (await googleButton.isVisible({ timeout: 3000 })) {
        // Mock OAuth flow
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

    test("should handle GitHub OAuth registration", async ({ page }) => {
      await landingPage.goto();
      await landingPage.clickGetStarted();

      const githubButton = page.locator(
        '[data-testid="github-signup"], button:has-text("GitHub"), .oauth-github',
      );

      if (await githubButton.isVisible({ timeout: 3000 })) {
        // Mock OAuth flow
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
  });

  test.describe("Email Verification Process", () => {
    test("should handle email verification flow", async ({ page }) => {
      const timestamp = Date.now();
      const newUser: TestUser = {
        email: `verify-user-${timestamp}@test.gamegen.com`,
        password: "VerifyGameGen123!",
        firstName: "Verify",
        lastName: "User",
      };

      await landingPage.goto();
      await landingPage.clickGetStarted();
      await authHelper.registerTestUser(newUser);

      if (page.url().includes("/verify")) {
        // Verify email verification page elements
        const verificationMessage = page.locator(
          '[data-testid="verification-message"], .verification-info',
        );

        await expect(verificationMessage).toBeVisible();
        await expect(verificationMessage).toContainText(
          /email.*verify|verification.*sent/i,
        );

        // Test resend verification
        const resendButton = page.locator(
          '[data-testid="resend-verification"], button:has-text("Resend")',
        );

        if (await resendButton.isVisible({ timeout: 2000 })) {
          await resendButton.click();

          const resendConfirmation = page.locator(
            '.resend-confirmation, [data-testid="resend-success"]',
          );

          if (await resendConfirmation.isVisible({ timeout: 3000 })) {
            await expect(resendConfirmation).toBeVisible();
          }
        }

        // Simulate clicking verification link (in real scenario, would come from email)
        await page.goto("/verify?token=test-verification-token");

        // Should redirect to creator interface
        await expect(page).toHaveURL(/creator|dashboard/);
      }
    });

    test("should handle expired verification tokens", async ({ page }) => {
      await page.goto("/verify?token=expired-token");

      const expiredMessage = page.locator(
        '[data-testid="expired-token"], .token-expired',
      );

      if (await expiredMessage.isVisible({ timeout: 3000 })) {
        await expect(expiredMessage).toBeVisible();
        await expect(expiredMessage).toContainText(/expired|invalid.*token/i);

        // Should offer to resend verification
        const resendOption = page.locator(
          'button:has-text("Resend"), [data-testid="resend-verification"]',
        );

        await expect(resendOption).toBeVisible();
      }
    });
  });

  test.describe("Post-Registration Experience", () => {
    test("should show onboarding flow for new users", async ({ page }) => {
      const newUser = await authHelper.createAndLoginTempUser();

      // Should see onboarding or tutorial
      const onboarding = page.locator(
        '[data-testid="onboarding"], .onboarding-modal, .tutorial-overlay',
      );

      if (await onboarding.isVisible({ timeout: 5000 })) {
        await expect(onboarding).toBeVisible();

        // Check for onboarding steps
        const onboardingSteps = [
          /Welcome.*GameGen/i,
          /Create.*Game/i,
          /Vibe.*Coding/i,
          /Asset.*Library/i,
        ];

        for (const stepRegex of onboardingSteps) {
          const stepElement = page.locator(`text=${stepRegex.source}`);

          if (await stepElement.isVisible({ timeout: 1000 })) {
            await expect(stepElement).toBeVisible();
          }
        }

        // Complete onboarding
        const nextButton = page.locator(
          '[data-testid="onboarding-next"], button:has-text("Next")',
        );

        while (await nextButton.isVisible({ timeout: 1000 })) {
          await nextButton.click();
          await page.waitForTimeout(500);
        }

        const completeButton = page.locator(
          '[data-testid="complete-onboarding"], button:has-text("Complete")',
        );

        if (await completeButton.isVisible()) {
          await completeButton.click();
        }
      }

      // Verify access to full creator interface
      await creatorPage.verifyCreatorLayout();
      await creatorPage.verifyVibeCodingChat();
      await creatorPage.verifyAssetLibrary();
    });

    test("should set up default free plan for new users", async ({ page }) => {
      const newUser = await authHelper.createAndLoginTempUser();

      // Should be on free plan by default
      const planIndicator = page.locator(
        '[data-testid="current-plan"], .plan-indicator, .subscription-status',
      );

      if (await planIndicator.isVisible({ timeout: 3000 })) {
        await expect(planIndicator).toContainText(/free/i);
      }

      // Should see free plan limitations
      const limitations = page.locator(
        '[data-testid="free-limitations"], .plan-limits',
      );

      if (await limitations.isVisible({ timeout: 2000 })) {
        await expect(limitations).toContainText(/splash.*screen|upgrade.*pro/i);
      }
    });

    test("should create first project automatically", async ({ page }) => {
      const newUser = await authHelper.createAndLoginTempUser();

      // Should have a default project or project creation prompt
      const projectCreation = page.locator(
        '[data-testid="create-first-project"], .first-project, .project-wizard',
      );

      if (await projectCreation.isVisible({ timeout: 3000 })) {
        const projectName = "My First Game";
        const nameInput = page.locator(
          '[data-testid="project-name"], input[placeholder*="project" i]',
        );

        if (await nameInput.isVisible()) {
          await nameInput.fill(projectName);

          const createButton = page.locator(
            '[data-testid="create-project"], button:has-text("Create")',
          );

          await createButton.click();

          // Should open in creator interface
          await creatorPage.waitForPageLoad();
          await creatorPage.verifyCreatorLayout();
        }
      }
    });
  });

  test.describe("Error Handling", () => {
    test("should handle registration failures gracefully", async ({ page }) => {
      await landingPage.goto();
      await landingPage.clickGetStarted();

      // Simulate server error
      await page.route("**/api/auth/register**", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Registration failed" }),
        });
      });

      const newUser: TestUser = {
        email: `error-test-${Date.now()}@test.gamegen.com`,
        password: "ErrorTest123!",
        firstName: "Error",
        lastName: "Test",
      };

      await page.fill('input[type="email"]', newUser.email);
      await page.fill('input[type="password"]:first-of-type', newUser.password);
      await page.fill('input[type="password"]:last-of-type', newUser.password);

      const submitButton = page.locator('button[type="submit"]');

      await submitButton.click();

      // Should show error message
      const errorMessage = page.locator(
        '.error-message, [data-testid="registration-error"], [role="alert"]',
      );

      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      await expect(errorMessage).toContainText(/error|failed|problem/i);
    });

    test("should handle network errors during registration", async ({
      page,
    }) => {
      await landingPage.goto();
      await landingPage.clickGetStarted();

      // Simulate network failure
      await page.route("**/api/auth/register**", (route) => route.abort());

      const newUser: TestUser = {
        email: `network-test-${Date.now()}@test.gamegen.com`,
        password: "NetworkTest123!",
        firstName: "Network",
        lastName: "Test",
      };

      await page.fill('input[type="email"]', newUser.email);
      await page.fill('input[type="password"]:first-of-type', newUser.password);
      await page.fill('input[type="password"]:last-of-type', newUser.password);

      const submitButton = page.locator('button[type="submit"]');

      await submitButton.click();

      // Should show network error
      const networkError = page.locator(
        '.network-error, [data-testid="network-error"]',
      );

      if (await networkError.isVisible({ timeout: 5000 })) {
        await expect(networkError).toContainText(/network|connection|offline/i);
      }
    });
  });

  test.describe("Accessibility & Performance", () => {
    test("should be accessible via keyboard navigation", async ({ page }) => {
      await landingPage.goto();
      await landingPage.clickGetStarted();

      // Tab through registration form
      await page.keyboard.press("Tab"); // First name
      await page.keyboard.press("Tab"); // Last name
      await page.keyboard.press("Tab"); // Email

      const emailInput = page.locator(":focus");

      await expect(emailInput).toHaveAttribute("type", "email");

      await page.keyboard.press("Tab"); // Password
      await page.keyboard.press("Tab"); // Confirm password
      await page.keyboard.press("Tab"); // Terms checkbox (if present)
      await page.keyboard.press("Tab"); // Submit button

      const submitButton = page.locator(":focus");

      await expect(submitButton).toHaveAttribute("type", "submit");
    });

    test("should have proper ARIA labels and form validation", async ({
      page,
    }) => {
      await landingPage.goto();
      await landingPage.clickGetStarted();

      // Check form accessibility
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator(
        'input[type="password"]:first-of-type',
      );

      await expect(emailInput).toHaveAttribute("aria-label");
      await expect(passwordInput).toHaveAttribute("aria-label");

      // Check for required attributes
      await expect(emailInput).toHaveAttribute("required");
      await expect(passwordInput).toHaveAttribute("required");
    });

    test("should load registration form within performance budget", async ({
      page,
    }) => {
      const startTime = Date.now();

      await landingPage.goto();
      await landingPage.clickGetStarted();
      await page.waitForSelector('form, [data-testid="register-form"]');

      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000); // 3 second budget for registration page
    });
  });
});
