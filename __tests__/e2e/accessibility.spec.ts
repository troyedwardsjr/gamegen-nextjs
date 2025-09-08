/**
 * Comprehensive Accessibility Testing Suite
 * Tests WCAG 2.1 AA compliance across all major pages and components
 */

import { test, expect, Page } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from '@axe-core/playwright';

class AccessibilityHelper {
  constructor(private page: Page) {}

  /**
   * Run accessibility scan with custom rules
   */
  async runAccessibilityScan(
    context?: string,
    options?: {
      include?: string[];
      exclude?: string[];
      tags?: string[];
      rules?: Record<string, { enabled: boolean }>;
    }
  ) {
    await injectAxe(this.page);
    
    const axeOptions = {
      tags: options?.tags || ['wcag2a', 'wcag2aa', 'wcag21aa'],
      include: options?.include,
      exclude: options?.exclude,
      rules: {
        // Configure specific rules
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'aria-labels': { enabled: true },
        'focus-management': { enabled: true },
        ...options?.rules,
      },
    };

    try {
      await checkA11y(this.page, undefined, axeOptions);
    } catch (error) {
      const violations = await getViolations(this.page, undefined, axeOptions);
      
      if (violations.length > 0) {
        console.error(`Accessibility violations found${context ? ` on ${context}` : ''}:`);
        violations.forEach((violation, index) => {
          console.error(`\n${index + 1}. ${violation.id}: ${violation.description}`);
          console.error(`   Impact: ${violation.impact}`);
          console.error(`   Help: ${violation.helpUrl}`);
          
          violation.nodes.forEach((node, nodeIndex) => {
            console.error(`   Element ${nodeIndex + 1}: ${node.html.substring(0, 100)}...`);
            if (node.failureSummary) {
              console.error(`   Issue: ${node.failureSummary}`);
            }
          });
        });
        
        throw new Error(`${violations.length} accessibility violations found${context ? ` on ${context}` : ''}`);
      }
    }
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(
    focusableSelectors: string[],
    context?: string
  ) {
    console.log(`Testing keyboard navigation${context ? ` for ${context}` : ''}`);
    
    // Start from first focusable element
    await this.page.keyboard.press('Tab');
    
    for (let i = 0; i < focusableSelectors.length; i++) {
      const selector = focusableSelectors[i];
      const element = this.page.locator(selector);
      
      await expect(element, `Element ${selector} should be focusable`).toBeFocused();
      
      // Test activation with keyboard
      if (await element.getAttribute('role') === 'button' || 
          await element.evaluate(el => el.tagName.toLowerCase() === 'button')) {
        // Test space and enter activation
        await this.page.keyboard.press('Space');
        await this.page.waitForTimeout(100);
        
        // Navigate back to element and test enter
        await element.focus();
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(100);
      }
      
      if (i < focusableSelectors.length - 1) {
        await this.page.keyboard.press('Tab');
      }
    }
  }

  /**
   * Test screen reader compatibility
   */
  async testScreenReaderLabels(elements: Array<{ selector: string; expectedLabel?: string; role?: string }>) {
    for (const element of elements) {
      const locator = this.page.locator(element.selector);
      
      // Check if element exists
      await expect(locator, `Element ${element.selector} should exist`).toBeVisible();
      
      // Check aria-label or accessible name
      const ariaLabel = await locator.getAttribute('aria-label');
      const ariaLabelledBy = await locator.getAttribute('aria-labelledby');
      
      if (element.expectedLabel) {
        const accessibleName = await locator.evaluate(el => {
          // Get computed accessible name (simplified version)
          return el.getAttribute('aria-label') || 
                 el.textContent?.trim() || 
                 el.getAttribute('title') || 
                 el.getAttribute('alt') || '';
        });
        
        expect(accessibleName.toLowerCase(), 
          `Element ${element.selector} should have accessible name containing "${element.expectedLabel}"`
        ).toContain(element.expectedLabel.toLowerCase());
      }
      
      // Check role if specified
      if (element.role) {
        const role = await locator.getAttribute('role');
        expect(role, `Element ${element.selector} should have role "${element.role}"`).toBe(element.role);
      }
      
      // Ensure interactive elements are properly labeled
      const tagName = await locator.evaluate(el => el.tagName.toLowerCase());
      const isInteractive = ['button', 'input', 'select', 'textarea', 'a'].includes(tagName) ||
                           await locator.getAttribute('role') === 'button' ||
                           await locator.getAttribute('tabindex') !== null;
      
      if (isInteractive && !ariaLabel && !ariaLabelledBy) {
        const textContent = await locator.textContent();
        const hasVisibleText = textContent && textContent.trim().length > 0;
        
        expect(hasVisibleText || ariaLabel || ariaLabelledBy, 
          `Interactive element ${element.selector} must have accessible label`
        ).toBeTruthy();
      }
    }
  }

  /**
   * Test color contrast
   */
  async testColorContrast(elements: string[]) {
    for (const selector of elements) {
      const element = this.page.locator(selector);
      
      if (await element.isVisible()) {
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
          };
        });
        
        // This is a simplified check - in practice, you'd use a more sophisticated
        // color contrast calculation or let axe-core handle it
        console.log(`Color contrast for ${selector}:`, styles);
      }
    }
  }
}

test.describe('Accessibility Tests', () => {
  let accessibilityHelper: AccessibilityHelper;

  test.beforeEach(async ({ page }) => {
    accessibilityHelper = new AccessibilityHelper(page);
    
    // Set up page for accessibility testing
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Disable animations to prevent timing issues
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test('Homepage accessibility compliance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Run comprehensive accessibility scan
    await accessibilityHelper.runAccessibilityScan('homepage');
    
    // Test keyboard navigation
    const focusableElements = [
      'nav a[href="/"]', // Home link
      'nav a[href="/features"]', // Features link
      'nav a[href="/auth"]', // Auth link
      'main .hero-section button', // CTA button
    ];
    
    await accessibilityHelper.testKeyboardNavigation(focusableElements, 'homepage');
    
    // Test screen reader labels
    await accessibilityHelper.testScreenReaderLabels([
      { selector: 'nav[role="navigation"]', expectedLabel: 'Main navigation' },
      { selector: 'main .hero-section h1', expectedLabel: 'GameGen' },
      { selector: 'main .hero-section button', expectedLabel: 'Get Started' },
      { selector: 'footer', role: 'contentinfo' },
    ]);
  });

  test('Authentication page accessibility', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Run accessibility scan
    await accessibilityHelper.runAccessibilityScan('authentication page');
    
    // Test form accessibility
    await accessibilityHelper.testScreenReaderLabels([
      { selector: 'input[type="email"]', expectedLabel: 'email' },
      { selector: 'input[type="password"]', expectedLabel: 'password' },
      { selector: 'button[type="submit"]', expectedLabel: 'sign in' },
      { selector: 'form', role: 'form' },
    ]);
    
    // Test error handling accessibility
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', '123'); // Too short
    await page.click('button[type="submit"]');
    
    // Wait for error messages
    await page.waitForSelector('[aria-invalid="true"], .error-message, [data-testid*="error"]');
    
    // Check that errors are properly announced
    const errorElements = await page.$$('[aria-invalid="true"]');
    for (const element of errorElements) {
      const ariaDescribedBy = await element.getAttribute('aria-describedby');
      if (ariaDescribedBy) {
        const errorMessage = page.locator(`#${ariaDescribedBy}`);
        await expect(errorMessage).toBeVisible();
      }
    }
    
    // Run accessibility scan after error state
    await accessibilityHelper.runAccessibilityScan('authentication page with errors');
  });

  test('Game Creator accessibility', async ({ page }) => {
    // First login (mock auth for testing)
    await page.goto('/auth');
    await page.evaluate(() => {
      localStorage.setItem('mock-auth', 'true');
    });
    
    await page.goto('/game-creator');
    await page.waitForLoadState('networkidle');
    
    // Run accessibility scan
    await accessibilityHelper.runAccessibilityScan('game creator');
    
    // Test complex interface accessibility
    const interactiveElements = [
      { selector: 'button[aria-label*="New Game"], button:has-text("New Game")', expectedLabel: 'new game' },
      { selector: 'nav[role="tablist"] button', role: 'tab' },
      { selector: 'textarea[placeholder*="prompt"], textarea[aria-label*="prompt"]', expectedLabel: 'prompt' },
      { selector: 'button[aria-label*="Generate"], button:has-text("Generate")', expectedLabel: 'generate' },
    ];
    
    await accessibilityHelper.testScreenReaderLabels(interactiveElements);
    
    // Test tab navigation (ARIA tabs pattern)
    const tabElements = await page.$$('nav[role="tablist"] button[role="tab"]');
    if (tabElements.length > 0) {
      await tabElements[0].focus();
      
      // Test arrow key navigation for tabs
      await page.keyboard.press('ArrowRight');
      const secondTab = page.locator('nav[role="tablist"] button[role="tab"]:nth-child(2)');
      if (await secondTab.count() > 0) {
        await expect(secondTab).toBeFocused();
        
        // Check that corresponding tabpanel is displayed
        const tabId = await secondTab.getAttribute('aria-controls');
        if (tabId) {
          const tabPanel = page.locator(`#${tabId}`);
          await expect(tabPanel).toBeVisible();
          await expect(tabPanel).toHaveAttribute('role', 'tabpanel');
        }
      }
    }
  });

  test('Modal and dialog accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Look for modal trigger
    const modalTrigger = page.locator('button:has-text("Settings"), button[aria-haspopup="dialog"]');
    
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      
      // Wait for modal to appear
      const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]');
      await expect(modal).toBeVisible();
      
      // Test modal accessibility
      await accessibilityHelper.runAccessibilityScan('modal dialog');
      
      // Test focus trap
      await accessibilityHelper.testKeyboardNavigation([
        '[role="dialog"] button:first-of-type',
        '[role="dialog"] input, [role="dialog"] button',
        '[role="dialog"] button:last-of-type',
      ], 'modal dialog');
      
      // Test escape key to close
      await page.keyboard.press('Escape');
      await expect(modal).toBeHidden();
      
      // Ensure focus returns to trigger
      await expect(modalTrigger).toBeFocused();
    }
  });

  test('Form validation accessibility', async ({ page }) => {
    await page.goto('/auth');
    
    // Test live validation
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid');
    await emailInput.blur();
    
    // Check for validation message
    const errorMessage = page.locator('[data-testid*="error"], .error-message, [role="alert"]');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage).toBeVisible();
      
      // Ensure error is associated with input
      const errorId = await errorMessage.getAttribute('id');
      const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
      
      expect(ariaDescribedBy?.includes(errorId || ''), 
        'Error message should be associated with input via aria-describedby'
      ).toBeTruthy();
      
      // Ensure input is marked invalid
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    }
    
    // Run accessibility scan with errors present
    await accessibilityHelper.runAccessibilityScan('form with validation errors');
  });

  test('Loading states accessibility', async ({ page }) => {
    await page.goto('/game-creator');
    
    // Trigger loading state (if possible)
    const generateButton = page.locator('button:has-text("Generate")');
    if (await generateButton.count() > 0) {
      await generateButton.click();
      
      // Check for loading indicators
      const loadingIndicators = page.locator('[role="status"], .loading, [aria-live]');
      
      if (await loadingIndicators.count() > 0) {
        const firstIndicator = loadingIndicators.first();
        await expect(firstIndicator).toBeVisible();
        
        // Ensure loading state is announced to screen readers
        const ariaLive = await firstIndicator.getAttribute('aria-live');
        const role = await firstIndicator.getAttribute('role');
        
        expect(ariaLive === 'polite' || ariaLive === 'assertive' || role === 'status', 
          'Loading indicators should have appropriate aria-live or role for screen readers'
        ).toBeTruthy();
      }
    }
  });

  test('Responsive design accessibility', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1440, height: 900, name: 'Desktop' },
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Run accessibility scan for each viewport
      await accessibilityHelper.runAccessibilityScan(`homepage - ${viewport.name}`);
      
      // Ensure touch targets are adequate on mobile
      if (viewport.width <= 768) {
        const touchTargets = await page.$$('button, a, input, [role="button"]');
        
        for (const target of touchTargets) {
          const boundingBox = await target.boundingBox();
          if (boundingBox) {
            expect(boundingBox.width >= 44 && boundingBox.height >= 44,
              `Touch target should be at least 44x44px on ${viewport.name}`
            ).toBeTruthy();
          }
        }
      }
    }
  });

  test('Dark mode accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Toggle to dark mode if available
    const themeToggle = page.locator('button[aria-label*="theme"], button:has-text("Dark")');
    
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(500); // Allow theme transition
      
      // Run accessibility scan in dark mode
      await accessibilityHelper.runAccessibilityScan('homepage - dark mode', {
        rules: {
          'color-contrast': { enabled: true }, // Especially important in dark mode
        }
      });
      
      // Test that theme preference is persistent
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify dark mode is still active
      const bodyClass = await page.locator('body').getAttribute('class');
      expect(bodyClass?.includes('dark') || 
             await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark'),
        'Dark mode should persist across page reloads'
      ).toBeTruthy();
    }
  });

  test('Animation and motion preferences', async ({ page }) => {
    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    
    // Run accessibility scan with reduced motion
    await accessibilityHelper.runAccessibilityScan('homepage - reduced motion');
    
    // Verify animations are disabled or reduced
    const animatedElements = await page.$$('[style*="animation"], .animate-');
    
    for (const element of animatedElements) {
      const computedStyle = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          animationDuration: styles.animationDuration,
          transitionDuration: styles.transitionDuration,
        };
      });
      
      // Animations should be disabled or significantly reduced
      const animationDisabled = computedStyle.animationDuration === '0s' ||
                               computedStyle.animationDuration === 'none' ||
                               parseFloat(computedStyle.animationDuration) < 0.1;
      
      expect(animationDisabled,
        'Animations should be disabled or reduced when user prefers reduced motion'
      ).toBeTruthy();
    }
  });
});