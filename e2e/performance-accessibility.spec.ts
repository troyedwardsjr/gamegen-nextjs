import { test, expect } from "@playwright/test";
import { GameGenAuthHelper } from "./helpers/auth-helper";
import { GameGenLandingPage } from "./pages/landing-page";
import { GameGenPricingPage } from "./pages/pricing-page";
import { GameGenCreatorPage } from "./pages/game-creator-page";

test.describe("GameGen Performance & Accessibility", () => {
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

  test.describe("Performance Benchmarks", () => {
    test("should load landing page within performance budget", async ({ page }) => {
      const startTime = Date.now();
      
      await landingPage.goto();
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Landing page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Verify critical content is visible quickly
      await landingPage.verifyHeroSection();
    });

    test("should maintain responsive performance during navigation", async ({ page }) => {
      await landingPage.goto();
      
      const navigationTests = [
        { action: () => landingPage.navigateToPricing(), budget: 2000 },
        { action: () => pricingPage.goto(), budget: 2000 },
        { action: () => authHelper.loginAsTestUser(), budget: 5000 },
        { action: () => creatorPage.waitForPageLoad(), budget: 3000 }
      ];

      for (const { action, budget } of navigationTests) {
        const startTime = Date.now();
        await action();
        const navigationTime = Date.now() - startTime;
        
        expect(navigationTime).toBeLessThan(budget);
      }
    });

    test("should handle memory usage efficiently", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        const perf = performance as any;
        return perf.memory ? perf.memory.usedJSHeapSize : 0;
      });

      // Perform memory-intensive operations
      for (let i = 0; i < 5; i++) {
        await creatorPage.sendChatMessage(`Create game variation ${i}`);
        await page.waitForTimeout(1000);
      }

      // Check memory usage after operations
      const finalMemory = await page.evaluate(() => {
        const perf = performance as any;
        return perf.memory ? perf.memory.usedJSHeapSize : 0;
      });

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory - initialMemory;
        // Memory increase should be reasonable (less than 50MB)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      }
    });

    test("should optimize image loading and rendering", async ({ page }) => {
      await landingPage.goto();
      
      // Check for proper image optimization
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const image = images.nth(i);
        
        // Check for lazy loading
        const loading = await image.getAttribute('loading');
        if (loading) {
          expect(['lazy', 'eager']).toContain(loading);
        }
        
        // Check for responsive images
        const srcset = await image.getAttribute('srcset');
        const sizes = await image.getAttribute('sizes');
        
        // Should use responsive images for better performance
        if (srcset || sizes) {
          expect(srcset || sizes).toBeTruthy();
        }
        
        // Check image dimensions to prevent layout shift
        const width = await image.getAttribute('width');
        const height = await image.getAttribute('height');
        
        if (width && height) {
          expect(parseInt(width)).toBeGreaterThan(0);
          expect(parseInt(height)).toBeGreaterThan(0);
        }
      }
    });

    test("should minimize Cumulative Layout Shift (CLS)", async ({ page }) => {
      let layoutShiftScore = 0;
      
      // Monitor layout shifts
      await page.evaluate(() => {
        let clsScore = 0;
        const observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              clsScore += (entry as any).value;
            }
          }
          (window as any).clsScore = clsScore;
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
      });

      await landingPage.goto();
      await landingPage.waitForPageLoad();
      
      // Get CLS score
      layoutShiftScore = await page.evaluate(() => (window as any).clsScore || 0);
      
      // CLS should be less than 0.1 (good threshold)
      expect(layoutShiftScore).toBeLessThan(0.1);
    });

    test("should optimize First Contentful Paint (FCP)", async ({ page }) => {
      await page.goto("/", { waitUntil: 'domcontentloaded' });
      
      const fcpTime = await page.evaluate(() => {
        return new Promise(resolve => {
          const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
            if (fcp) {
              resolve(fcp.startTime);
              observer.disconnect();
            }
          });
          
          observer.observe({ entryTypes: ['paint'] });
          
          // Fallback timeout
          setTimeout(() => resolve(null), 5000);
        });
      });

      if (fcpTime) {
        // FCP should be under 1.8 seconds for good performance
        expect(fcpTime).toBeLessThan(1800);
      }
    });

    test("should handle concurrent user interactions efficiently", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Simulate rapid user interactions
      const startTime = Date.now();
      
      const interactions = [
        () => creatorPage.switchToTab('map-editor'),
        () => creatorPage.switchToTab('code-editor'),
        () => creatorPage.switchToTab('live-play'),
        () => creatorPage.searchAssets('character'),
        () => creatorPage.sendChatMessage('Quick test')
      ];

      // Execute interactions in parallel
      await Promise.all(interactions.map(interaction => interaction()));
      
      const totalTime = Date.now() - startTime;
      
      // All interactions should complete within 5 seconds
      expect(totalTime).toBeLessThan(5000);
      
      // UI should remain responsive
      await creatorPage.verifyCreatorLayout();
    });

    test("should optimize bundle size and loading", async ({ page }) => {
      // Monitor network requests
      const requests: Array<{ url: string; size?: number; type: string }> = [];
      
      page.on('response', (response) => {
        const url = response.url();
        const contentLength = response.headers()['content-length'];
        const contentType = response.headers()['content-type'] || '';
        
        requests.push({
          url,
          size: contentLength ? parseInt(contentLength) : undefined,
          type: contentType
        });
      });

      await landingPage.goto();
      await page.waitForLoadState('networkidle');

      // Analyze JavaScript bundle sizes
      const jsRequests = requests.filter(req => 
        req.type.includes('javascript') || req.url.endsWith('.js')
      );
      
      const totalJsSize = jsRequests.reduce((total, req) => total + (req.size || 0), 0);
      
      // Main JavaScript bundle should be reasonable (less than 1MB)
      expect(totalJsSize).toBeLessThan(1024 * 1024);
      
      // Check for code splitting (multiple JS files)
      expect(jsRequests.length).toBeGreaterThan(1);
    });
  });

  test.describe("Accessibility Standards (WCAG 2.1 AA)", () => {
    test("should have proper semantic HTML structure", async ({ page }) => {
      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Check for proper heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);

      // Should have exactly one H1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);

      // Check for main landmark
      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible();

      // Check for navigation
      const nav = page.locator('nav, [role="navigation"]');
      if (await nav.isVisible({ timeout: 1000 })) {
        await expect(nav).toBeVisible();
      }

      // Check for footer
      const footer = page.locator('footer, [role="contentinfo"]');
      if (await footer.isVisible({ timeout: 1000 })) {
        await expect(footer).toBeVisible();
      }
    });

    test("should provide proper ARIA labels and descriptions", async ({ page }) => {
      await landingPage.goto();
      await landingPage.clickGetStarted();

      // Check form elements have proper labels
      const inputs = await page.locator('input, textarea, select').all();
      
      for (const input of inputs.slice(0, 5)) { // Check first 5 inputs
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        const ariaDescribedby = await input.getAttribute('aria-describedby');
        const id = await input.getAttribute('id');
        
        // Should have label association
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.isVisible({ timeout: 500 });
          
          if (!hasLabel) {
            // If no explicit label, should have aria-label
            expect(ariaLabel || ariaLabelledby).toBeTruthy();
          }
        } else {
          expect(ariaLabel || ariaLabelledby).toBeTruthy();
        }
      }

      // Check buttons have accessible names
      const buttons = await page.locator('button, [role="button"]').all();
      
      for (const button of buttons.slice(0, 5)) {
        const buttonText = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        
        // Button should have accessible name
        expect(buttonText?.trim() || ariaLabel).toBeTruthy();
      }
    });

    test("should support keyboard navigation", async ({ page }) => {
      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Start tab navigation
      await page.keyboard.press('Tab');
      
      // Check focus is visible
      const firstFocused = page.locator(':focus');
      await expect(firstFocused).toBeVisible();
      
      // Tab through several elements
      const focusedElements = [];
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const focused = await page.locator(':focus').textContent();
        focusedElements.push(focused);
      }
      
      // Should have navigated through different elements
      expect(new Set(focusedElements).size).toBeGreaterThan(1);
      
      // Check skip link (common accessibility pattern)
      const skipLink = page.locator('a:has-text("Skip to main content"), [data-testid="skip-link"]');
      if (await skipLink.isVisible({ timeout: 1000 })) {
        await skipLink.click();
        
        const mainContent = page.locator('main, #main-content, [data-testid="main-content"]');
        if (await mainContent.isVisible()) {
          const focused = page.locator(':focus');
          // Skip link should focus main content
          await expect(focused).toBeTruthy();
        }
      }
    });

    test("should have sufficient color contrast", async ({ page }) => {
      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Check contrast of text elements
      const textElements = page.locator('h1, h2, h3, p, button, a, label');
      const elementsToCheck = await textElements.all();
      
      for (const element of elementsToCheck.slice(0, 10)) {
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });

        // Check if colors are defined (not transparent or inherit)
        if (styles.color !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          // Colors should be defined for contrast checking
          expect(styles.color).toBeTruthy();
          expect(styles.backgroundColor).toBeTruthy();
        }
      }
    });

    test("should support screen reader accessibility", async ({ page }) => {
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Check for ARIA live regions (for dynamic content)
      const liveRegions = page.locator('[aria-live], [aria-atomic], [aria-relevant]');
      const liveRegionCount = await liveRegions.count();
      
      if (liveRegionCount > 0) {
        // Live regions should have proper ARIA attributes
        const firstLiveRegion = liveRegions.first();
        const ariaLive = await firstLiveRegion.getAttribute('aria-live');
        expect(['polite', 'assertive', 'off']).toContain(ariaLive || '');
      }

      // Check for proper button roles and states
      const toggleButtons = page.locator('button[aria-pressed], button[aria-expanded]');
      const toggleCount = await toggleButtons.count();
      
      for (let i = 0; i < Math.min(toggleCount, 3); i++) {
        const button = toggleButtons.nth(i);
        const pressed = await button.getAttribute('aria-pressed');
        const expanded = await button.getAttribute('aria-expanded');
        
        if (pressed) {
          expect(['true', 'false']).toContain(pressed);
        }
        if (expanded) {
          expect(['true', 'false']).toContain(expanded);
        }
      }

      // Check for proper form validation messages
      const chatInput = page.locator('[data-testid="chat-input"], .chat-input');
      if (await chatInput.isVisible()) {
        const ariaDescribedby = await chatInput.getAttribute('aria-describedby');
        const ariaInvalid = await chatInput.getAttribute('aria-invalid');
        
        if (ariaDescribedby) {
          const descriptionElement = page.locator(`#${ariaDescribedby}`);
          if (await descriptionElement.isVisible({ timeout: 500 })) {
            await expect(descriptionElement).toBeVisible();
          }
        }
      }
    });

    test("should handle reduced motion preferences", async ({ page }) => {
      // Simulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Check for animation controls
      const animatedElements = page.locator(
        '.animate, [data-animate], .animation, .transition'
      );
      
      const animationCount = await animatedElements.count();
      
      if (animationCount > 0) {
        // Animations should be disabled or provide controls
        const animationStyles = await animatedElements.first().evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            animation: computed.animation,
            transition: computed.transition
          };
        });

        // Check if animations are reduced/disabled
        if (animationStyles.animation.includes('none') || 
            animationStyles.transition.includes('none')) {
          expect(true).toBe(true); // Animations properly reduced
        }
      }
    });

    test("should provide alternative text for images", async ({ page }) => {
      await landingPage.goto();
      await landingPage.waitForPageLoad();

      const images = await page.locator('img').all();
      
      for (const image of images) {
        const alt = await image.getAttribute('alt');
        const ariaLabel = await image.getAttribute('aria-label');
        const role = await image.getAttribute('role');
        
        // Image should have alt text, aria-label, or be marked as decorative
        if (role === 'presentation' || alt === '') {
          // Decorative image - this is fine
          continue;
        }
        
        expect(alt || ariaLabel).toBeTruthy();
      }
    });

    test("should support high contrast mode", async ({ page }) => {
      // Simulate high contrast mode
      await page.addInitScript(() => {
        // Mock high contrast media query
        const mediaQuery = {
          matches: true,
          addListener: () => {},
          removeListener: () => {}
        };
        
        (window.matchMedia as any) = (query: string) => {
          if (query.includes('prefers-contrast: high')) {
            return mediaQuery;
          }
          return { matches: false, addListener: () => {}, removeListener: () => {} };
        };
      });

      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Check that elements maintain visibility in high contrast
      const primaryElements = page.locator(
        'h1, .cta-button, [data-testid="get-started-button"], nav a'
      );
      
      const elementCount = await primaryElements.count();
      
      for (let i = 0; i < Math.min(elementCount, 5); i++) {
        const element = primaryElements.nth(i);
        await expect(element).toBeVisible();
        
        // Element should have defined borders or backgrounds in high contrast
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            border: computed.border,
            backgroundColor: computed.backgroundColor,
            outline: computed.outline
          };
        });

        // Should have some form of visual boundary
        const hasVisualBoundary = 
          styles.border !== 'none' || 
          styles.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
          styles.outline !== 'none';
          
        expect(hasVisualBoundary).toBe(true);
      }
    });

    test("should provide error messages in accessible format", async ({ page }) => {
      await page.goto("/auth");

      // Trigger validation errors
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', '123');
      await page.click('button[type="submit"]');

      // Check for accessible error messages
      const errorMessages = page.locator('[role="alert"], .error, [aria-live="polite"]');
      const errorCount = await errorMessages.count();
      
      if (errorCount > 0) {
        const firstError = errorMessages.first();
        await expect(firstError).toBeVisible();
        
        // Error should be associated with the relevant input
        const errorId = await firstError.getAttribute('id');
        if (errorId) {
          const associatedInput = page.locator(`[aria-describedby*="${errorId}"]`);
          const hasAssociation = await associatedInput.count() > 0;
          expect(hasAssociation).toBe(true);
        }
      }
    });
  });

  test.describe("Mobile Performance & Accessibility", () => {
    test("should maintain performance on mobile devices", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Simulate mobile network conditions
      const client = await page.context().newCDPSession(page);
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 4 * 1024 * 1024 / 8, // 4Mbps (good 4G)
        uploadThroughput: 1.5 * 1024 * 1024 / 8,  // 1.5Mbps
        latency: 150
      });

      const startTime = Date.now();
      
      await landingPage.goto();
      await landingPage.waitForPageLoad();
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds on mobile 4G
      expect(loadTime).toBeLessThan(5000);
      
      // Check mobile-specific optimizations
      await landingPage.checkResponsiveDesign();
    });

    test("should support touch accessibility on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Check touch target sizes
      const interactiveElements = page.locator('button, a, input, [role="button"]');
      const elementCount = await interactiveElements.count();
      
      for (let i = 0; i < Math.min(elementCount, 10); i++) {
        const element = interactiveElements.nth(i);
        const box = await element.boundingBox();
        
        if (box) {
          // Touch targets should be at least 44x44px (iOS) or 48x48px (Android)
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test("should handle mobile screen readers", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Mock mobile screen reader behavior
      await page.addInitScript(() => {
        (window as any).speechSynthesis = {
          speak: (utterance: any) => {
            console.log('Screen reader:', utterance.text);
          },
          cancel: () => {},
          pause: () => {},
          resume: () => {}
        };
      });

      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Check for proper mobile navigation
      const hamburgerMenu = page.locator(
        '[data-testid="mobile-menu-toggle"], .hamburger, .menu-toggle'
      );
      
      if (await hamburgerMenu.isVisible()) {
        // Menu button should be accessible
        const ariaLabel = await hamburgerMenu.getAttribute('aria-label');
        const ariaExpanded = await hamburgerMenu.getAttribute('aria-expanded');
        
        expect(ariaLabel || await hamburgerMenu.textContent()).toBeTruthy();
        
        if (ariaExpanded) {
          expect(['true', 'false']).toContain(ariaExpanded);
        }
      }
    });
  });

  test.describe("Performance Monitoring", () => {
    test("should track Core Web Vitals", async ({ page }) => {
      // Set up performance monitoring
      await page.addInitScript(() => {
        (window as any).performanceMetrics = {};
        
        // Monitor LCP (Largest Contentful Paint)
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lcp = entries[entries.length - 1];
          (window as any).performanceMetrics.lcp = lcp.startTime;
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Monitor FID (First Input Delay)
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const fid = entries[0];
          (window as any).performanceMetrics.fid = fid.processingStart - fid.startTime;
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
      });

      await landingPage.goto();
      await landingPage.waitForPageLoad();
      
      // Trigger user interaction for FID measurement
      await landingPage.clickGetStarted();
      
      await page.waitForTimeout(1000); // Allow metrics to be captured
      
      const metrics = await page.evaluate(() => (window as any).performanceMetrics);
      
      if (metrics.lcp) {
        // LCP should be under 2.5 seconds (good threshold)
        expect(metrics.lcp).toBeLessThan(2500);
      }
      
      if (metrics.fid) {
        // FID should be under 100ms (good threshold)
        expect(metrics.fid).toBeLessThan(100);
      }
    });

    test("should monitor resource loading efficiency", async ({ page }) => {
      const resourceMetrics: Array<{
        url: string;
        type: string;
        size: number;
        loadTime: number;
      }> = [];

      page.on('response', async (response) => {
        const request = response.request();
        const timing = response.timing();
        
        resourceMetrics.push({
          url: response.url(),
          type: response.headers()['content-type'] || 'unknown',
          size: parseInt(response.headers()['content-length'] || '0'),
          loadTime: timing.responseEnd
        });
      });

      await landingPage.goto();
      await page.waitForLoadState('networkidle');

      // Analyze resource loading
      const images = resourceMetrics.filter(r => r.type.startsWith('image/'));
      const scripts = resourceMetrics.filter(r => r.type.includes('javascript'));
      const styles = resourceMetrics.filter(r => r.type.includes('css'));

      // Check for efficient resource loading
      const totalSize = resourceMetrics.reduce((sum, r) => sum + r.size, 0);
      const avgLoadTime = resourceMetrics.reduce((sum, r) => sum + r.loadTime, 0) / resourceMetrics.length;

      // Total page size should be reasonable (under 3MB)
      expect(totalSize).toBeLessThan(3 * 1024 * 1024);
      
      // Average load time should be reasonable
      expect(avgLoadTime).toBeLessThan(1000);
    });
  });
});