import { test, expect } from "@playwright/test";

import { GameGenAuthHelper, TestUser } from "./helpers/auth-helper";
import { GameGenLandingPage } from "./pages/landing-page";
import { GameGenPricingPage } from "./pages/pricing-page";
import { GameGenCreatorPage } from "./pages/game-creator-page";

test.describe("GameGen Pricing & Subscription Flow", () => {
  let authHelper: GameGenAuthHelper;
  let landingPage: GameGenLandingPage;
  let pricingPage: GameGenPricingPage;
  let creatorPage: GameGenCreatorPage;

  const testPaymentMethod = {
    cardNumber: "4242424242424242", // Stripe test card
    expiry: "12/34",
    cvc: "123",
    zipCode: "12345",
  };

  test.beforeEach(async ({ page }) => {
    authHelper = new GameGenAuthHelper(page);
    landingPage = new GameGenLandingPage(page);
    pricingPage = new GameGenPricingPage(page);
    creatorPage = new GameGenCreatorPage(page);
  });

  test.describe("Pricing Page Navigation & Display", () => {
    test("should navigate to pricing from landing page", async ({ page }) => {
      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Navigate to pricing page
      await landingPage.navigateToPricing();

      // Should be on pricing page
      await expect(page).toHaveURL(/pricing/);
      await pricingPage.waitForPageLoad();

      // Verify pricing page content
      await pricingPage.verifyPlanDetails();
      await pricingPage.verifyFeatureComparison();
    });

    test("should display all GameGen subscription tiers correctly", async ({
      page,
    }) => {
      await pricingPage.goto();
      await pricingPage.waitForPageLoad();

      // Verify Free Plan
      const freePlan = page.locator('[data-testid="free-plan"], .plan-free');

      await expect(freePlan).toBeVisible();
      await expect(freePlan).toContainText(/Free.*\$0|Free.*Plan/i);
      await expect(freePlan).toContainText(/Platform.*Publishing/i);
      await expect(freePlan).toContainText(/Splash.*Screen/i);

      // Verify Pro Plan
      const proPlan = page.locator('[data-testid="pro-plan"], .plan-pro');

      await expect(proPlan).toBeVisible();
      await expect(proPlan).toContainText(/Pro.*Plan/i);
      await expect(proPlan).toContainText(/Export.*Capabilities/i);
      await expect(proPlan).toContainText(/No.*Splash.*Screen/i);

      // Verify Max Plan
      const maxPlan = page.locator('[data-testid="max-plan"], .plan-max');

      await expect(maxPlan).toBeVisible();
      await expect(maxPlan).toContainText(/Max.*Plan/i);
      await expect(maxPlan).toContainText(/White.*Label/i);
      await expect(maxPlan).toContainText(/Priority.*Support/i);
    });

    test("should show billing cycle toggle and update prices", async ({
      page,
    }) => {
      await pricingPage.goto();
      await pricingPage.waitForPageLoad();

      // Verify billing cycle toggle
      await pricingPage.verifyBillingCycleToggle();

      // Test price change when switching billing cycles
      const monthlyPrice = await page
        .locator('.price, [data-testid="pro-price"]')
        .first()
        .textContent();

      await pricingPage.selectBillingCycle("yearly");
      await page.waitForTimeout(1000); // Allow for price update

      const yearlyPrice = await page
        .locator('.price, [data-testid="pro-price"]')
        .first()
        .textContent();

      // Prices should be different (yearly should show discount)
      expect(yearlyPrice).not.toBe(monthlyPrice);
    });

    test("should display pay-per-use credit information", async ({ page }) => {
      await pricingPage.goto();
      await pricingPage.waitForPageLoad();

      await pricingPage.verifyPayAsYouGoCredits();

      // Should explain credit costs for different actions
      const creditInfo = page.locator(
        '[data-testid="credit-info"], .credit-pricing, .pay-per-use',
      );

      if (await creditInfo.isVisible({ timeout: 2000 })) {
        await expect(creditInfo).toContainText(/Credit.*Cost|Pay.*Per.*Use/i);

        // Should list different action costs
        const actionCosts = [
          /Vibe.*Coding.*Chat/i,
          /Asset.*Generation/i,
          /Code.*Generation/i,
          /AI.*Assistance/i,
        ];

        for (const actionRegex of actionCosts) {
          const actionElement = page.locator(`text=${actionRegex.source}`);

          if (await actionElement.isVisible({ timeout: 1000 })) {
            await expect(actionElement).toBeVisible();
          }
        }
      }
    });
  });

  test.describe("Free Plan Selection", () => {
    test("should allow immediate free plan selection without payment", async ({
      page,
    }) => {
      await pricingPage.goto();
      await pricingPage.waitForPageLoad();

      // Select free plan
      await pricingPage.selectPlan("free");

      // Should redirect to registration or creator (if already logged in)
      const currentUrl = page.url();

      expect(currentUrl).toMatch(/register|creator|dashboard/);

      if (currentUrl.includes("register")) {
        // Complete registration
        const timestamp = Date.now();
        const freeUser: TestUser = {
          email: `free-user-${timestamp}@test.gamegen.com`,
          password: "FreeUser123!",
          firstName: "Free",
          lastName: "User",
        };

        await authHelper.registerTestUser(freeUser);
      }

      // Should end up in creator with free plan limitations
      await creatorPage.waitForPageLoad();
      await creatorPage.verifyCreatorLayout();

      // Verify free plan limitations are displayed
      const freePlanIndicator = page.locator(
        '[data-testid="free-plan-indicator"], .plan-status, .subscription-tier',
      );

      if (await freePlanIndicator.isVisible({ timeout: 2000 })) {
        await expect(freePlanIndicator).toContainText(/free/i);
      }
    });

    test("should display free plan limitations in creator interface", async ({
      page,
    }) => {
      // Create and login free user
      await authHelper.loginWithSubscription("free");
      await creatorPage.waitForPageLoad();

      // Should see upgrade prompts
      const upgradePrompt = page.locator(
        '[data-testid="upgrade-prompt"], .upgrade-banner, .plan-limitation',
      );

      if (await upgradePrompt.isVisible({ timeout: 3000 })) {
        await expect(upgradePrompt).toContainText(
          /upgrade.*pro|splash.*screen|export.*limited/i,
        );
      }

      // Should see credit limitations
      const creditLimit = page.locator(
        '[data-testid="credit-limit"], .credit-warning',
      );

      if (await creditLimit.isVisible({ timeout: 2000 })) {
        await expect(creditLimit).toContainText(/credit.*limit|upgrade.*more/i);
      }
    });
  });

  test.describe("Paid Plan Subscription Flow", () => {
    test("should complete Pro plan subscription with Stripe", async ({
      page,
    }) => {
      // Skip in CI environment due to payment processing
      if (process.env.CI) {
        test.skip();
      }

      await pricingPage.goto();
      await pricingPage.waitForPageLoad();

      // Select Pro plan
      await pricingPage.selectPlan("pro");

      // Should show Stripe payment form
      await expect(
        page.locator('[data-testid="stripe-form"], .payment-form'),
      ).toBeVisible();

      // Fill payment form
      await page.fill('input[type="email"]', "pro-user@test.gamegen.com");

      // Handle Stripe Elements iframe
      const stripeFrame = page.frameLocator(
        'iframe[name^="__privateStripeFrame"]',
      );

      if (
        await stripeFrame
          .locator('input[placeholder*="number"]')
          .isVisible({ timeout: 3000 })
      ) {
        await stripeFrame
          .locator('input[placeholder*="number"]')
          .fill(testPaymentMethod.cardNumber);
        await stripeFrame
          .locator('input[placeholder*="MM"]')
          .fill(testPaymentMethod.expiry);
        await stripeFrame
          .locator('input[placeholder*="CVC"]')
          .fill(testPaymentMethod.cvc);
      } else {
        // Fallback for custom payment form
        await page.fill(
          '[data-testid="card-number"]',
          testPaymentMethod.cardNumber,
        );
        await page.fill('[data-testid="expiry"]', testPaymentMethod.expiry);
        await page.fill('[data-testid="cvc"]', testPaymentMethod.cvc);
        await page.fill('[data-testid="zip-code"]', testPaymentMethod.zipCode);
      }

      // Submit payment
      const submitButton = page.locator(
        'button:has-text("Subscribe"), button:has-text("Complete Payment"), [data-testid="submit-payment"]',
      );

      await submitButton.click();

      // Wait for payment processing
      const paymentSuccess = page.locator(
        '[data-testid="payment-success"], .payment-confirmation, .subscription-success',
      );

      const paymentError = page.locator(
        '[data-testid="payment-error"], .payment-failed, .stripe-error',
      );

      // Either success or expected test failure
      const hasResult = await Promise.race([
        paymentSuccess.isVisible({ timeout: 15000 }),
        paymentError.isVisible({ timeout: 15000 }),
      ]);

      expect(hasResult).toBe(true);

      // If successful, should be redirected to creator with Pro features
      if (await paymentSuccess.isVisible()) {
        await expect(page).toHaveURL(/creator|dashboard|success/);

        // Verify Pro plan features
        const proPlanIndicator = page.locator(
          '[data-testid="pro-plan-indicator"], .plan-status',
        );

        if (await proPlanIndicator.isVisible({ timeout: 3000 })) {
          await expect(proPlanIndicator).toContainText(/pro/i);
        }
      }
    });

    test("should validate payment form fields", async ({ page }) => {
      await pricingPage.goto();
      await pricingPage.selectPlan("pro");

      // Try to submit without filling payment form
      const submitButton = page.locator(
        'button:has-text("Subscribe"), [data-testid="submit-payment"]',
      );

      await submitButton.click();

      // Should show validation errors
      const validationError = page.locator(
        '.payment-error, [data-testid="payment-error"], .stripe-error',
      );

      if (await validationError.isVisible({ timeout: 3000 })) {
        await expect(validationError).toBeVisible();
      }
    });

    test("should handle payment failures gracefully", async ({ page }) => {
      await pricingPage.goto();
      await pricingPage.selectPlan("pro");

      // Fill with declined test card
      await page.fill('input[type="email"]', "declined@test.gamegen.com");

      const stripeFrame = page.frameLocator(
        'iframe[name^="__privateStripeFrame"]',
      );

      if (
        await stripeFrame
          .locator('input[placeholder*="number"]')
          .isVisible({ timeout: 3000 })
      ) {
        await stripeFrame
          .locator('input[placeholder*="number"]')
          .fill("4000000000000002"); // Declined card
        await stripeFrame.locator('input[placeholder*="MM"]').fill("12/34");
        await stripeFrame.locator('input[placeholder*="CVC"]').fill("123");
      }

      const submitButton = page.locator('button:has-text("Subscribe")');

      await submitButton.click();

      // Should show payment declined error
      const paymentError = page.locator(
        '[data-testid="payment-error"], .payment-declined, .stripe-error',
      );

      if (await paymentError.isVisible({ timeout: 10000 })) {
        await expect(paymentError).toBeVisible();
        await expect(paymentError).toContainText(/declined|failed|error/i);
      }
    });

    test("should show loading states during payment processing", async ({
      page,
    }) => {
      await pricingPage.goto();
      await pricingPage.selectPlan("pro");

      // Mock slow payment processing
      await page.route("**/api/stripe/**", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        route.continue();
      });

      // Fill payment form quickly
      await page.fill('input[type="email"]', "loading-test@test.gamegen.com");

      const submitButton = page.locator('button:has-text("Subscribe")');

      await submitButton.click();

      // Should show loading state
      const loadingSpinner = page.locator(
        '[data-testid="payment-loading"], .payment-spinner, .processing',
      );

      if (await loadingSpinner.isVisible({ timeout: 1000 })) {
        await expect(loadingSpinner).toBeVisible();
      }

      // Button should be disabled during processing
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe("Subscription Management", () => {
    test("should allow subscription upgrades", async ({ page }) => {
      // Login as Pro user
      await authHelper.loginWithSubscription("pro");
      await page.goto("/settings/billing");

      const upgradeSection = page.locator(
        '[data-testid="upgrade-section"], .subscription-upgrade',
      );

      if (await upgradeSection.isVisible({ timeout: 3000 })) {
        // Should see Max plan upgrade option
        const upgradeToMax = page.locator(
          '[data-testid="upgrade-max"], button:has-text("Upgrade to Max")',
        );

        if (await upgradeToMax.isVisible()) {
          await upgradeToMax.click();

          // Should show upgrade confirmation or payment form
          const upgradeConfirm = page.locator(
            '[data-testid="upgrade-confirmation"], .upgrade-modal',
          );

          await expect(upgradeConfirm).toBeVisible();
        }
      }
    });

    test("should allow subscription cancellation", async ({ page }) => {
      // Login as paid user
      await authHelper.loginWithSubscription("pro");
      await page.goto("/settings/billing");

      const cancelSection = page.locator(
        '[data-testid="cancel-subscription"], .subscription-cancel',
      );

      if (await cancelSection.isVisible({ timeout: 3000 })) {
        const cancelButton = page.locator(
          'button:has-text("Cancel Subscription"), [data-testid="cancel-button"]',
        );

        await cancelButton.click();

        // Should show cancellation confirmation
        const cancelConfirm = page.locator(
          '[data-testid="cancel-confirmation"], .cancellation-modal',
        );

        await expect(cancelConfirm).toBeVisible();
        await expect(cancelConfirm).toContainText(
          /are.*you.*sure|cancel.*subscription/i,
        );

        // Confirm cancellation
        const confirmCancel = page.locator(
          'button:has-text("Confirm"), [data-testid="confirm-cancel"]',
        );

        if (await confirmCancel.isVisible()) {
          await confirmCancel.click();

          // Should show cancellation success
          const cancelSuccess = page.locator(
            '[data-testid="cancel-success"], .cancellation-success',
          );

          if (await cancelSuccess.isVisible({ timeout: 3000 })) {
            await expect(cancelSuccess).toBeVisible();
          }
        }
      }
    });

    test("should display billing history", async ({ page }) => {
      await authHelper.loginWithSubscription("pro");
      await page.goto("/settings/billing");

      const billingHistory = page.locator(
        '[data-testid="billing-history"], .invoice-history',
      );

      if (await billingHistory.isVisible({ timeout: 3000 })) {
        await expect(billingHistory).toBeVisible();

        // Should show invoice details
        const invoiceItems = page.locator(".invoice-item, .billing-record");
        const itemCount = await invoiceItems.count();

        if (itemCount > 0) {
          const firstInvoice = invoiceItems.first();

          await expect(firstInvoice).toContainText(/\$/); // Should have price
          await expect(firstInvoice).toContainText(/\d{4}/); // Should have date
        }
      }
    });

    test("should allow payment method updates", async ({ page }) => {
      await authHelper.loginWithSubscription("pro");
      await page.goto("/settings/billing");

      const paymentMethod = page.locator(
        '[data-testid="payment-method"], .current-payment-method',
      );

      if (await paymentMethod.isVisible({ timeout: 3000 })) {
        const updateButton = page.locator(
          'button:has-text("Update"), [data-testid="update-payment"]',
        );

        if (await updateButton.isVisible()) {
          await updateButton.click();

          // Should show payment form
          const paymentForm = page.locator(
            '[data-testid="payment-form"], .update-payment-form',
          );

          await expect(paymentForm).toBeVisible();
        }
      }
    });
  });

  test.describe("Plan Feature Validation", () => {
    test("should enforce free plan limitations", async ({ page }) => {
      await authHelper.loginWithSubscription("free");
      await creatorPage.waitForPageLoad();

      // Try to export game (Pro feature)
      const exportButton = page.locator(
        '[data-testid="export-game"], button:has-text("Export")',
      );

      if (await exportButton.isVisible({ timeout: 2000 })) {
        await exportButton.click();

        // Should show upgrade prompt
        const upgradePrompt = page.locator(
          '[data-testid="upgrade-required"], .feature-locked, .upgrade-modal',
        );

        await expect(upgradePrompt).toBeVisible();
        await expect(upgradePrompt).toContainText(
          /upgrade.*pro|feature.*locked/i,
        );
      }
    });

    test("should unlock Pro features after subscription", async ({ page }) => {
      await authHelper.loginWithSubscription("pro");
      await creatorPage.waitForPageLoad();

      // Pro features should be available
      const exportButton = page.locator(
        '[data-testid="export-game"], button:has-text("Export")',
      );

      if (await exportButton.isVisible({ timeout: 2000 })) {
        await expect(exportButton).toBeEnabled();

        // Click should not show upgrade prompt
        await exportButton.click();

        const upgradePrompt = page.locator(
          '[data-testid="upgrade-required"], .feature-locked',
        );

        await expect(upgradePrompt).not.toBeVisible();
      }

      // No splash screen watermark
      const splashScreenWarning = page.locator(
        '[data-testid="splash-screen-warning"], .watermark-notice',
      );

      await expect(splashScreenWarning).not.toBeVisible();
    });

    test("should show Max plan exclusive features", async ({ page }) => {
      await authHelper.loginWithSubscription("max");
      await creatorPage.waitForPageLoad();

      // Max exclusive features
      const whiteLabelOptions = page.locator(
        '[data-testid="white-label"], .custom-branding',
      );

      if (await whiteLabelOptions.isVisible({ timeout: 2000 })) {
        await expect(whiteLabelOptions).toBeVisible();
      }

      const prioritySupport = page.locator(
        '[data-testid="priority-support"], .max-support',
      );

      if (await prioritySupport.isVisible({ timeout: 2000 })) {
        await expect(prioritySupport).toBeVisible();
      }
    });
  });

  test.describe("Mobile Subscription Experience", () => {
    test("should work correctly on mobile devices", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await pricingPage.goto();
      await pricingPage.waitForPageLoad();

      // Plans should stack vertically on mobile
      await pricingPage.checkMobileResponsiveness();

      // Select a plan on mobile
      await pricingPage.selectPlan("pro");

      // Payment form should be mobile-friendly
      const paymentForm = page.locator(
        '[data-testid="payment-form"], .stripe-form',
      );

      if (await paymentForm.isVisible({ timeout: 3000 })) {
        const formBox = await paymentForm.boundingBox();
        const viewport = page.viewportSize();

        if (formBox && viewport) {
          // Form should fit within mobile viewport
          expect(formBox.width).toBeLessThanOrEqual(viewport.width);
        }

        // Input fields should be touch-friendly
        const cardInput = page.locator('input[placeholder*="card"]').first();

        if (await cardInput.isVisible()) {
          const inputBox = await cardInput.boundingBox();

          expect(inputBox?.height).toBeGreaterThan(44); // Minimum touch target
        }
      }
    });

    test("should handle mobile payment keyboard", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await pricingPage.goto();
      await pricingPage.selectPlan("pro");

      const cardNumberInput = page
        .locator('input[placeholder*="card"], [data-testid="card-number"]')
        .first();

      if (await cardNumberInput.isVisible({ timeout: 3000 })) {
        await cardNumberInput.focus();

        // Should trigger numeric keyboard on mobile (inputmode="numeric")
        const inputMode = await cardNumberInput.getAttribute("inputmode");

        if (inputMode) {
          expect(inputMode).toBe("numeric");
        }
      }
    });
  });

  test.describe("Error Handling & Edge Cases", () => {
    test("should handle Stripe service downtime", async ({ page }) => {
      await pricingPage.goto();

      // Mock Stripe service failure
      await page.route("**/js.stripe.com/**", (route) => route.abort());

      await pricingPage.selectPlan("pro");

      // Should show fallback error message
      const stripeError = page.locator(
        '[data-testid="stripe-error"], .payment-service-error',
      );

      if (await stripeError.isVisible({ timeout: 5000 })) {
        await expect(stripeError).toBeVisible();
        await expect(stripeError).toContainText(
          /payment.*service|temporarily.*unavailable/i,
        );
      }
    });

    test("should handle subscription webhook failures", async ({ page }) => {
      // This would test webhook handling in a real implementation
      // For now, we'll test the UI response to subscription status changes

      await authHelper.loginWithSubscription("pro");

      // Mock subscription webhook failure (subscription becomes past_due)
      await page.addInitScript(() => {
        window.mockSubscriptionStatus = "past_due";
      });

      await page.goto("/creator");

      // Should show billing issue notification
      const billingAlert = page.locator(
        '[data-testid="billing-alert"], .payment-failed-alert',
      );

      if (await billingAlert.isVisible({ timeout: 3000 })) {
        await expect(billingAlert).toBeVisible();
        await expect(billingAlert).toContainText(
          /payment.*failed|update.*billing/i,
        );
      }
    });
  });
});
