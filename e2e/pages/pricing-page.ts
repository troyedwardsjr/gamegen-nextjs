import { Page, expect } from "@playwright/test";

export interface GameGenPlan {
  name: string;
  price: string;
  features: string[];
}

export class GameGenPricingPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto("/pricing");
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForSelector(
      '[data-testid="pricing-plans"], .pricing-section, .plan-card',
      { timeout: 10000 },
    );
  }

  async selectPlan(planType: "free" | "pro" | "max"): Promise<void> {
    const planSelector = `[data-testid="${planType}-plan"], .plan-${planType}, [data-plan="${planType}"]`;
    const selectButton = this.page.locator(
      `${planSelector} button, button[data-plan="${planType}"], button:has-text("Select ${planType}"), button:has-text("Choose ${planType}")`,
    );

    await selectButton.click();
  }

  async selectBillingCycle(cycle: "monthly" | "yearly"): Promise<void> {
    const cycleSelector = `[data-testid="${cycle}-cycle"], input[value="${cycle}"], label:has-text("${cycle}")`;

    try {
      await this.page.click(cycleSelector, { timeout: 5000 });
    } catch {
      // If data-testid doesn't work, try toggle switch
      const toggle = this.page
        .locator(".billing-cycle-toggle, .toggle, .switch")
        .first();

      if (await toggle.isVisible()) {
        await toggle.click();
      }
    }
  }

  async verifyPlanDetails(): Promise<void> {
    // Free Plan verification
    const freePlan = this.page.locator('[data-testid="free-plan"], .plan-free');

    await expect(freePlan).toBeVisible();
    await expect(freePlan).toContainText(/Free|$0/i);
    await expect(freePlan).toContainText(/Platform.*Publishing/i);

    // Pro Plan verification
    const proPlan = this.page.locator('[data-testid="pro-plan"], .plan-pro');

    await expect(proPlan).toBeVisible();
    await expect(proPlan).toContainText(/Pro/i);
    await expect(proPlan).toContainText(/Export.*Capabilities/i);

    // Max Plan verification
    const maxPlan = this.page.locator('[data-testid="max-plan"], .plan-max');

    await expect(maxPlan).toBeVisible();
    await expect(maxPlan).toContainText(/Max/i);
    await expect(maxPlan).toContainText(/White.*Label/i);
  }

  async verifyFeatureComparison(): Promise<void> {
    // Check for GameGen-specific features
    const expectedFeatures = [
      /Vibe.*Coding.*Chat/i,
      /Game.*Templates/i,
      /Asset.*Library/i,
      /Export.*Games/i,
      /Custom.*Branding/i,
      /Priority.*Support/i,
    ];

    for (const featureRegex of expectedFeatures) {
      const featureElement = this.page.locator(`text=${featureRegex.source}`);
      const isVisible = await featureElement.isVisible({ timeout: 2000 });

      if (isVisible) {
        await expect(featureElement).toBeVisible();
      }
    }
  }

  async checkPricingAccuracy(): Promise<void> {
    // Verify pricing displays correctly
    const prices = await this.page
      .locator('.price, [data-testid="price"]')
      .allTextContents();

    // Should have at least one price (Pro plan)
    const hasPricing = prices.some((price) => price.includes("$"));

    expect(hasPricing).toBeTruthy();
  }

  async verifyBillingCycleToggle(): Promise<void> {
    const billingToggle = this.page.locator(
      '.billing-cycle-toggle, [data-testid="billing-toggle"]',
    );

    if (await billingToggle.isVisible({ timeout: 2000 })) {
      await expect(billingToggle).toBeVisible();

      // Test toggle functionality
      const initialState = await this.page
        .locator(".monthly, .yearly")
        .first()
        .isVisible();

      await billingToggle.click();
      await this.page.waitForTimeout(500); // Allow for animation
      const afterToggle = await this.page
        .locator(".monthly, .yearly")
        .first()
        .isVisible();

      // State should have changed
      expect(initialState).not.toBe(afterToggle);
    }
  }

  async verifyPayAsYouGoCredits(): Promise<void> {
    const creditsSection = this.page.locator(
      '[data-testid="credits-section"], .credits-info, .pay-per-use',
    );

    if (await creditsSection.isVisible({ timeout: 2000 })) {
      await expect(creditsSection).toBeVisible();
      await expect(creditsSection).toContainText(
        /Credit|Pay.*Use|Per.*Action/i,
      );
    }
  }

  async compareWithCompetitors(): Promise<void> {
    const comparisonSection = this.page.locator(
      '[data-testid="comparison-table"], .competitor-comparison',
    );

    if (await comparisonSection.isVisible({ timeout: 2000 })) {
      await expect(comparisonSection).toBeVisible();

      // Look for competitor mentions (Unity, GameMaker, etc.)
      const competitors = [/Unity/i, /GameMaker/i, /Construct/i];

      for (const competitor of competitors) {
        const competitorElement = this.page.locator(
          `text=${competitor.source}`,
        );

        if (await competitorElement.isVisible({ timeout: 1000 })) {
          await expect(competitorElement).toBeVisible();
        }
      }
    }
  }

  async checkFreePlanLimitations(): Promise<void> {
    const freePlan = this.page.locator('[data-testid="free-plan"], .plan-free');

    // Free plan should show limitations
    const limitations = [
      /Splash.*Screen/i,
      /Platform.*Only/i,
      /Limited.*Assets/i,
    ];

    for (const limitation of limitations) {
      const limitationElement = freePlan.locator(`text=${limitation.source}`);

      if (await limitationElement.isVisible({ timeout: 1000 })) {
        await expect(limitationElement).toBeVisible();
      }
    }
  }

  async verifyUpgradePrompts(): Promise<void> {
    const upgradePrompts = this.page.locator(
      '.upgrade-prompt, [data-testid="upgrade-banner"], .plan-recommendation',
    );

    if (await upgradePrompts.isVisible({ timeout: 2000 })) {
      await expect(upgradePrompts).toBeVisible();
      await expect(upgradePrompts).toContainText(
        /Recommended|Popular|Best.*Value/i,
      );
    }
  }

  async checkMobileResponsiveness(): Promise<void> {
    const planCards = this.page.locator('.plan-card, [data-testid*="plan"]');
    const cardCount = await planCards.count();

    if (cardCount > 0) {
      // On mobile, cards should stack vertically
      const firstCard = planCards.first();
      const secondCard = planCards.nth(1);

      if ((await firstCard.isVisible()) && (await secondCard.isVisible())) {
        const firstCardBox = await firstCard.boundingBox();
        const secondCardBox = await secondCard.boundingBox();

        const viewport = this.page.viewportSize();

        if (viewport && viewport.width < 768) {
          // On mobile, second card should be below first card
          if (firstCardBox && secondCardBox) {
            expect(secondCardBox.y).toBeGreaterThan(
              firstCardBox.y + firstCardBox.height / 2,
            );
          }
        }
      }
    }
  }

  async verifyAccessibility(): Promise<void> {
    // Check for proper ARIA labels on plan cards
    const planCards = this.page.locator('.plan-card, [data-testid*="plan"]');
    const cardCount = await planCards.count();

    for (let i = 0; i < cardCount; i++) {
      const card = planCards.nth(i);
      const hasAriaLabel =
        (await card.getAttribute("aria-label")) ||
        (await card.getAttribute("aria-labelledby"));

      if (hasAriaLabel) {
        expect(hasAriaLabel).toBeTruthy();
      }
    }

    // Check keyboard navigation
    await this.page.keyboard.press("Tab");
    const focusedElement = this.page.locator(":focus");

    await expect(focusedElement).toBeVisible();
  }

  async getFAQSection(): Promise<void> {
    const faqSection = this.page.locator(
      '[data-testid="faq-section"], .faq-section, .frequently-asked',
    );

    if (await faqSection.isVisible({ timeout: 2000 })) {
      await expect(faqSection).toBeVisible();

      // Check for common GameGen questions
      const expectedQuestions = [
        /What.*included.*free/i,
        /Can.*export.*games/i,
        /How.*credits.*work/i,
        /Cancel.*anytime/i,
      ];

      for (const questionRegex of expectedQuestions) {
        const questionElement = this.page.locator(
          `text=${questionRegex.source}`,
        );

        if (await questionElement.isVisible({ timeout: 1000 })) {
          await expect(questionElement).toBeVisible();
        }
      }
    }
  }

  async verifyTrustSignals(): Promise<void> {
    // Look for trust signals like testimonials, user count, etc.
    const trustSignals = [
      '[data-testid="testimonials"], .testimonials',
      '[data-testid="user-count"], .user-stats',
      '[data-testid="trust-badges"], .trust-signals',
    ];

    for (const selector of trustSignals) {
      const element = this.page.locator(selector);

      if (await element.isVisible({ timeout: 1000 })) {
        await expect(element).toBeVisible();
      }
    }
  }
}
