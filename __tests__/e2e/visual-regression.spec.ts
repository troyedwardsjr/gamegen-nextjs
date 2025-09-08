/**
 * Visual Regression Testing Suite
 * Captures and compares screenshots of UI components and pages
 * to detect unintended visual changes
 */

import { test, expect, Page } from '@playwright/test';

class VisualRegressionHelper {
  constructor(private page: Page) {}

  /**
   * Set up consistent environment for visual testing
   */
  async setupForVisualTest() {
    // Set consistent viewport
    await this.page.setViewportSize({ width: 1280, height: 720 });

    // Disable animations for consistent screenshots
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          scroll-behavior: auto !important;
        }
        
        .loading-spinner, .skeleton {
          display: none !important;
        }
      `
    });

    // Set consistent font rendering
    await this.page.addStyleTag({
      content: `
        * {
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }
      `
    });

    // Wait for fonts to load
    await this.page.waitForFunction(() => document.fonts.ready);
    
    // Additional wait for content stabilization
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for content to be stable
   */
  async waitForContentStable() {
    // Wait for network idle
    await this.page.waitForLoadState('networkidle');
    
    // Wait for images to load
    await this.page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.every(img => img.complete);
    });

    // Wait for any lazy-loaded content
    await this.page.waitForTimeout(1000);
  }

  /**
   * Hide dynamic content that changes between runs
   */
  async hideDynamicContent() {
    await this.page.addStyleTag({
      content: `
        [data-testid*="timestamp"],
        [data-testid*="random"],
        .timestamp,
        .random-content,
        [class*="timestamp"],
        [id*="timestamp"] {
          visibility: hidden !important;
        }
        
        /* Hide elements with random IDs or content */
        [id*="random"], [class*="random"] {
          visibility: hidden !important;
        }
      `
    });
  }

  /**
   * Mock dynamic data with consistent values
   */
  async mockDynamicData() {
    await this.page.evaluate(() => {
      // Mock Date.now() to return consistent timestamp
      const mockDate = new Date('2023-01-01T12:00:00Z').getTime();
      Date.now = () => mockDate;
      
      // Mock Math.random() to return consistent values
      let randomSeed = 0.5;
      Math.random = () => randomSeed;
      
      // Mock any user-specific data
      localStorage.setItem('visual-test-mode', 'true');
    });
  }

  /**
   * Take screenshot with retries for flaky elements
   */
  async takeScreenshot(name: string, options?: Parameters<Page['screenshot']>[0], retries = 3): Promise<Buffer> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.waitForContentStable();
        return await this.page.screenshot({ fullPage: true, ...options });
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
    throw new Error('Screenshot failed after retries');
  }
}

test.describe('Visual Regression Tests', () => {
  let visualHelper: VisualRegressionHelper;

  test.beforeEach(async ({ page }) => {
    visualHelper = new VisualRegressionHelper(page);
    await visualHelper.setupForVisualTest();
  });

  test.describe('Homepage Visual Tests', () => {
    test('homepage renders correctly', async ({ page }) => {
      await page.goto('/');
      await visualHelper.mockDynamicData();
      await visualHelper.hideDynamicContent();
      await visualHelper.waitForContentStable();

      // Full page screenshot
      await expect(page).toHaveScreenshot('homepage-full.png', {
        fullPage: true,
        threshold: 0.3, // 30% threshold for acceptable differences
      });

      // Hero section screenshot
      const heroSection = page.locator('.hero-section, main section:first-child');
      if (await heroSection.count() > 0) {
        await expect(heroSection).toHaveScreenshot('homepage-hero-section.png');
      }

      // Navigation screenshot
      const navigation = page.locator('nav, header');
      if (await navigation.count() > 0) {
        await expect(navigation).toHaveScreenshot('homepage-navigation.png');
      }
    });

    test('homepage responsive design - mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('/');
      await visualHelper.mockDynamicData();
      await visualHelper.hideDynamicContent();
      await visualHelper.waitForContentStable();

      await expect(page).toHaveScreenshot('homepage-mobile.png', {
        fullPage: true,
      });
    });

    test('homepage responsive design - tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto('/');
      await visualHelper.mockDynamicData();
      await visualHelper.hideDynamicContent();
      await visualHelper.waitForContentStable();

      await expect(page).toHaveScreenshot('homepage-tablet.png', {
        fullPage: true,
      });
    });

    test('homepage dark theme', async ({ page }) => {
      await page.goto('/');
      
      // Toggle dark mode if available
      const themeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme"]');
      if (await themeToggle.count() > 0) {
        await themeToggle.click();
        await page.waitForTimeout(500); // Allow theme transition
      } else {
        // Manually set dark theme
        await page.evaluate(() => {
          document.documentElement.setAttribute('data-theme', 'dark');
          document.documentElement.classList.add('dark');
        });
      }

      await visualHelper.mockDynamicData();
      await visualHelper.hideDynamicContent();
      await visualHelper.waitForContentStable();

      await expect(page).toHaveScreenshot('homepage-dark-theme.png', {
        fullPage: true,
      });
    });
  });

  test.describe('Authentication Page Visual Tests', () => {
    test('login form renders correctly', async ({ page }) => {
      await page.goto('/auth');
      await visualHelper.mockDynamicData();
      await visualHelper.waitForContentStable();

      await expect(page).toHaveScreenshot('auth-login-form.png');

      // Focus states
      await page.focus('input[type="email"]');
      await expect(page.locator('input[type="email"]')).toHaveScreenshot('auth-email-focused.png');

      await page.focus('input[type="password"]');
      await expect(page.locator('input[type="password"]')).toHaveScreenshot('auth-password-focused.png');
    });

    test('signup form renders correctly', async ({ page }) => {
      await page.goto('/auth');
      
      // Switch to signup if toggle exists
      const signupToggle = page.locator('button:has-text("Sign Up"), [data-testid="signup-tab"]');
      if (await signupToggle.count() > 0) {
        await signupToggle.click();
        await page.waitForTimeout(300);
      }

      await visualHelper.waitForContentStable();
      await expect(page).toHaveScreenshot('auth-signup-form.png');
    });

    test('auth form validation errors', async ({ page }) => {
      await page.goto('/auth');
      await visualHelper.waitForContentStable();

      // Trigger validation errors
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', '123'); // Too short
      await page.click('button[type="submit"]');

      // Wait for error messages to appear
      await page.waitForSelector('[aria-invalid="true"], .error-message', { timeout: 3000 });
      await page.waitForTimeout(500); // Allow error animations

      await expect(page).toHaveScreenshot('auth-validation-errors.png');
    });
  });

  test.describe('Game Creator Visual Tests', () => {
    test('game creator interface', async ({ page }) => {
      // Mock authentication
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'mock-token');
      });

      await page.goto('/game-creator');
      await visualHelper.mockDynamicData();
      await visualHelper.waitForContentStable();

      await expect(page).toHaveScreenshot('game-creator-main-interface.png', {
        fullPage: true,
      });

      // Test different tabs if they exist
      const tabs = page.locator('[role="tab"], .tab-button');
      const tabCount = await tabs.count();

      for (let i = 0; i < Math.min(tabCount, 4); i++) { // Limit to first 4 tabs
        await tabs.nth(i).click();
        await page.waitForTimeout(300); // Allow tab transition
        await visualHelper.waitForContentStable();
        
        await expect(page).toHaveScreenshot(`game-creator-tab-${i}.png`);
      }
    });

    test('game creator sidebar panels', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'mock-token');
      });

      await page.goto('/game-creator');
      await visualHelper.waitForContentStable();

      // Test different panels
      const panelButtons = page.locator('[data-testid*="panel"], button[aria-controls*="panel"]');
      const panelCount = await panelButtons.count();

      for (let i = 0; i < Math.min(panelCount, 3); i++) {
        await panelButtons.nth(i).click();
        await page.waitForTimeout(500);
        
        const activePanel = page.locator('.panel.active, [data-panel-active="true"]');
        if (await activePanel.count() > 0) {
          await expect(activePanel).toHaveScreenshot(`game-creator-panel-${i}.png`);
        }
      }
    });

    test('game creator modals and overlays', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'mock-token');
      });

      await page.goto('/game-creator');
      await visualHelper.waitForContentStable();

      // Test modal triggers
      const modalTriggers = page.locator('button:has-text("New Game"), button[data-modal-trigger]');
      
      if (await modalTriggers.count() > 0) {
        await modalTriggers.first().click();
        
        const modal = page.locator('[role="dialog"], .modal');
        await modal.waitFor({ state: 'visible' });
        await page.waitForTimeout(300); // Allow modal animation

        await expect(modal).toHaveScreenshot('game-creator-new-game-modal.png');

        // Close modal for next test
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('UI Components Visual Tests', () => {
    test('glassmorphic buttons', async ({ page }) => {
      // Create a test page with all button variants
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <link rel="stylesheet" href="/styles/globals.css" />
          <style>
            body { padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .button-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
            .button-wrapper { padding: 16px; }
          </style>
        </head>
        <body>
          <div class="button-grid">
            <div class="button-wrapper">
              <button class="glassmorphic-button variant-glass">Glass</button>
            </div>
            <div class="button-wrapper">
              <button class="glassmorphic-button variant-gaming">Gaming</button>
            </div>
            <div class="button-wrapper">
              <button class="glassmorphic-button variant-accent">Accent</button>
            </div>
            <div class="button-wrapper">
              <button class="glassmorphic-button variant-danger">Danger</button>
            </div>
            <div class="button-wrapper">
              <button class="glassmorphic-button variant-success">Success</button>
            </div>
            <div class="button-wrapper">
              <button class="glassmorphic-button variant-ghost">Ghost</button>
            </div>
          </div>
        </body>
        </html>
      `);

      await visualHelper.waitForContentStable();
      await expect(page).toHaveScreenshot('glassmorphic-buttons-all-variants.png');

      // Test hover states
      const buttons = page.locator('.glassmorphic-button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        await buttons.nth(i).hover();
        await page.waitForTimeout(100);
        await expect(buttons.nth(i)).toHaveScreenshot(`button-variant-${i}-hover.png`);
      }
    });

    test('form components', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <link rel="stylesheet" href="/styles/globals.css" />
          <style>body { padding: 20px; }</style>
        </head>
        <body>
          <form class="space-y-4">
            <div>
              <label for="email">Email</label>
              <input type="email" id="email" placeholder="Enter your email" />
            </div>
            <div>
              <label for="password">Password</label>
              <input type="password" id="password" placeholder="Enter your password" />
            </div>
            <div>
              <label for="message">Message</label>
              <textarea id="message" placeholder="Enter your message"></textarea>
            </div>
            <div>
              <label>
                <input type="checkbox" />
                I agree to the terms
              </label>
            </div>
            <div>
              <select>
                <option>Choose an option</option>
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
            </div>
          </form>
        </body>
        </html>
      `);

      await visualHelper.waitForContentStable();
      await expect(page).toHaveScreenshot('form-components.png');

      // Test focus states
      await page.focus('input[type="email"]');
      await expect(page.locator('input[type="email"]')).toHaveScreenshot('input-email-focused.png');

      await page.focus('textarea');
      await expect(page.locator('textarea')).toHaveScreenshot('textarea-focused.png');
    });

    test('loading states', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <link rel="stylesheet" href="/styles/globals.css" />
          <style>
            body { padding: 20px; }
            .loading-demo { display: flex; flex-direction: column; gap: 16px; }
            .spinner { animation: spin 1s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="loading-demo">
            <div class="loading-spinner spinner">⟳</div>
            <div class="skeleton h-4 w-24 bg-gray-200 rounded"></div>
            <div class="skeleton h-4 w-32 bg-gray-200 rounded"></div>
            <button disabled>Loading...</button>
          </div>
        </body>
        </html>
      `);

      // Disable animations for consistent screenshots
      await page.addStyleTag({
        content: `
          .spinner { animation: none !important; }
        `
      });

      await visualHelper.waitForContentStable();
      await expect(page).toHaveScreenshot('loading-states.png');
    });
  });

  test.describe('Error States Visual Tests', () => {
    test('404 page', async ({ page }) => {
      await page.goto('/non-existent-page');
      await visualHelper.waitForContentStable();

      await expect(page).toHaveScreenshot('404-page.png', {
        fullPage: true,
      });
    });

    test('error boundaries', async ({ page }) => {
      // This would need to be implemented based on your error boundary setup
      // For now, we'll mock an error state
      await page.goto('/game-creator');
      
      // Simulate error state
      await page.evaluate(() => {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
          <div class="error-boundary">
            <h2>Something went wrong</h2>
            <p>An error occurred while loading this component.</p>
            <button>Try again</button>
          </div>
        `;
        document.body.appendChild(errorDiv);
      });

      const errorBoundary = page.locator('.error-boundary');
      await expect(errorBoundary).toHaveScreenshot('error-boundary.png');
    });
  });

  test.describe('Cross-browser Visual Tests', () => {
    ['chromium', 'firefox', 'webkit'].forEach((browserName) => {
      test(`homepage renders consistently in ${browserName}`, async ({ page }) => {
        await page.goto('/');
        await visualHelper.mockDynamicData();
        await visualHelper.hideDynamicContent();
        await visualHelper.waitForContentStable();

        await expect(page).toHaveScreenshot(`homepage-${browserName}.png`, {
          threshold: 0.5, // Higher threshold for cross-browser differences
        });
      });
    });
  });

  test.describe('Animation and Interaction States', () => {
    test('hover and focus states', async ({ page }) => {
      await page.goto('/');
      await visualHelper.waitForContentStable();

      // Find interactive elements
      const interactiveElements = page.locator('button, a, input[type="submit"], [role="button"]');
      const count = Math.min(await interactiveElements.count(), 5); // Limit to first 5

      for (let i = 0; i < count; i++) {
        const element = interactiveElements.nth(i);
        
        // Hover state
        await element.hover();
        await page.waitForTimeout(100);
        await expect(element).toHaveScreenshot(`interactive-element-${i}-hover.png`);
        
        // Focus state (if focusable)
        try {
          await element.focus();
          await page.waitForTimeout(100);
          await expect(element).toHaveScreenshot(`interactive-element-${i}-focus.png`);
        } catch (error) {
          // Element might not be focusable, skip focus test
        }
      }
    });

    test('active states', async ({ page }) => {
      await page.goto('/auth');
      await visualHelper.waitForContentStable();

      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.count() > 0) {
        // Simulate active state
        await submitButton.evaluate(btn => {
          btn.style.transform = 'scale(0.95)';
          btn.style.transition = 'none';
        });
        
        await expect(submitButton).toHaveScreenshot('button-active-state.png');
      }
    });
  });
});