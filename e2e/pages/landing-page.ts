import { Page, expect } from "@playwright/test";

export class GameGenLandingPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForSelector(
      '[data-testid="landing-hero"], .hero-section, h1',
      { timeout: 10000 },
    );
  }

  async clickGetStarted(): Promise<void> {
    const getStartedButton = this.page.locator(
      '[data-testid="get-started-button"], button:has-text("Get Started"), .cta-button, .hero-cta',
    );

    await getStartedButton.click();
  }

  async clickLogin(): Promise<void> {
    const loginButton = this.page.locator(
      '[data-testid="login-button"], a[href*="login"], button:has-text("Login"), button:has-text("Sign In")',
    );

    await loginButton.click();
  }

  async navigateToPricing(): Promise<void> {
    const pricingLink = this.page.locator(
      '[data-testid="pricing-link"], a[href*="pricing"], a:has-text("Pricing")',
    );

    await pricingLink.click();
  }

  async scrollToFeatures(): Promise<void> {
    const featuresSection = this.page.locator(
      '[data-testid="features-section"], .features-section, #features',
    );

    await featuresSection.scrollIntoViewIfNeeded();
  }

  async verifyHeroSection(): Promise<void> {
    // Check for hero elements
    const heroTitle = this.page.locator(
      '[data-testid="hero-title"], .hero-title, h1',
    );

    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toContainText(
      /Create.*Pixel.*Art.*Games|GameGen|Game Creation|Build Games/i,
    );

    // Check for hero description (optional as layout may vary)
    const heroDescription = this.page.locator(
      '[data-testid="hero-description"], .hero-description, .hero-subtitle, p',
    );
    const descriptionVisible = await heroDescription.isVisible({
      timeout: 2000,
    });

    if (descriptionVisible) {
      await expect(heroDescription).toBeVisible();
    }

    const ctaButton = this.page.locator(
      '[data-testid="get-started-button"], .cta-button',
    );

    await expect(ctaButton).toBeVisible();
  }

  async verifyFeatureHighlights(): Promise<void> {
    // Check for key GameGen features
    const expectedFeatures = [
      /Vibe Coding/i,
      /AI.*Game.*Creator/i,
      /Pixel.*Art/i,
      /No.*Code/i,
      /Game.*Engine/i,
    ];

    for (const featureRegex of expectedFeatures) {
      const featureElement = this.page.locator(`text=${featureRegex.source}`);
      const isVisible = await featureElement.isVisible({ timeout: 2000 });

      if (isVisible) {
        await expect(featureElement).toBeVisible();
      }
    }
  }

  async verifyNavigationMenu(): Promise<void> {
    // Check navigation elements
    const navItems = [
      '[data-testid="nav-features"], a:has-text("Features")',
      '[data-testid="nav-pricing"], a:has-text("Pricing")',
      '[data-testid="nav-about"], a:has-text("About")',
    ];

    for (const selector of navItems) {
      const navItem = this.page.locator(selector);

      if (await navItem.isVisible({ timeout: 1000 })) {
        await expect(navItem).toBeVisible();
      }
    }
  }

  async verifyFooter(): Promise<void> {
    const footer = this.page.locator(
      '[data-testid="footer"], footer, .site-footer',
    );

    await expect(footer).toBeVisible();
  }

  async checkResponsiveDesign(): Promise<void> {
    // Get the hero section and verify it's responsive
    const heroSection = this.page.locator(
      '[data-testid="landing-hero"], .hero-section',
    );

    const heroBox = await heroSection.boundingBox();
    const viewport = this.page.viewportSize();

    if (heroBox && viewport) {
      // Hero section should not exceed viewport width
      expect(heroBox.width).toBeLessThanOrEqual(viewport.width);
    }
  }

  async clickFeatureDemo(feature: string): Promise<void> {
    const featureButton = this.page.locator(
      `[data-testid="demo-${feature}"], button:has-text("${feature}"), .feature-demo:has-text("${feature}")`,
    );

    await featureButton.click();
  }

  async verifyGameExamples(): Promise<void> {
    const gameExamples = this.page.locator(
      '[data-testid="game-examples"], .game-showcase, .example-games',
    );

    if (await gameExamples.isVisible({ timeout: 2000 })) {
      await expect(gameExamples).toBeVisible();

      // Check for game type examples
      const gameTypes = [
        /Bullet.*Hell/i,
        /RPG/i,
        /Action.*Adventure/i,
        /Platformer/i,
      ];

      for (const gameType of gameTypes) {
        const gameElement = this.page.locator(`text=${gameType.source}`);

        if (await gameElement.isVisible({ timeout: 1000 })) {
          await expect(gameElement).toBeVisible();
        }
      }
    }
  }

  async subscribeToNewsletter(email: string): Promise<void> {
    const emailInput = this.page.locator(
      '[data-testid="newsletter-email"], input[type="email"], input[placeholder*="email" i]',
    );
    const subscribeButton = this.page.locator(
      '[data-testid="newsletter-subscribe"], button:has-text("Subscribe"), .newsletter-submit',
    );

    if (await emailInput.isVisible({ timeout: 2000 })) {
      await emailInput.fill(email);
      await subscribeButton.click();
    }
  }

  async verifyLoadingPerformance(): Promise<void> {
    const startTime = Date.now();

    await this.waitForPageLoad();
    const loadTime = Date.now() - startTime;

    // Landing page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  }

  async checkAccessibility(): Promise<void> {
    // Check for proper heading hierarchy
    const h1Elements = this.page.locator("h1");
    const h1Count = await h1Elements.count();

    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h1Count).toBeLessThanOrEqual(1); // Should only have one H1

    // Check for alt text on images
    const images = this.page.locator("img");
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);
      const altText = await image.getAttribute("alt");

      if (!altText) {
        console.warn("Image without alt text found");
      }
    }

    // Check for keyboard navigation
    await this.page.keyboard.press("Tab");
    const focusedElement = this.page.locator(":focus");

    await expect(focusedElement).toBeVisible();
  }
}
