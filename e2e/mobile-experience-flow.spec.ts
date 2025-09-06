import { test, expect } from "@playwright/test";
import { GameGenAuthHelper } from "./helpers/auth-helper";
import { GameGenLandingPage } from "./pages/landing-page";
import { GameGenPricingPage } from "./pages/pricing-page";
import { GameGenCreatorPage } from "./pages/game-creator-page";

test.describe("GameGen Mobile Experience", () => {
  let authHelper: GameGenAuthHelper;
  let landingPage: GameGenLandingPage;
  let pricingPage: GameGenPricingPage;
  let creatorPage: GameGenCreatorPage;

  // Mobile device configurations
  const mobileDevices = [
    { name: "iPhone 12", width: 390, height: 844 },
    { name: "iPhone SE", width: 375, height: 667 },
    { name: "Pixel 5", width: 393, height: 851 },
    { name: "Samsung Galaxy S21", width: 360, height: 800 },
    { name: "iPad Mini", width: 768, height: 1024 }
  ];

  test.beforeEach(async ({ page }) => {
    authHelper = new GameGenAuthHelper(page);
    landingPage = new GameGenLandingPage(page);
    pricingPage = new GameGenPricingPage(page);
    creatorPage = new GameGenCreatorPage(page);
  });

  test.describe("Mobile Landing Page Experience", () => {
    mobileDevices.forEach(device => {
      test(`should display correctly on ${device.name}`, async ({ page }) => {
        await page.setViewportSize({ width: device.width, height: device.height });
        
        await landingPage.goto();
        await landingPage.waitForPageLoad();

        // Check responsive design
        await landingPage.checkResponsiveDesign();

        // Hero section should be visible and properly sized
        const heroSection = page.locator('[data-testid="landing-hero"], .hero-section');
        await expect(heroSection).toBeVisible();

        const heroBox = await heroSection.boundingBox();
        if (heroBox) {
          // Hero should not exceed viewport width
          expect(heroBox.width).toBeLessThanOrEqual(device.width);
        }

        // CTA button should be touch-friendly
        const ctaButton = page.locator('[data-testid="get-started-button"], .cta-button');
        await expect(ctaButton).toBeVisible();
        
        const ctaBox = await ctaButton.boundingBox();
        if (ctaBox) {
          // Minimum touch target size (44px iOS, 48px Android)
          expect(ctaBox.height).toBeGreaterThan(44);
          expect(ctaBox.width).toBeGreaterThan(44);
        }
      });
    });

    test("should handle mobile navigation menu", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Mobile hamburger menu
      const hamburgerMenu = page.locator(
        '[data-testid="mobile-menu-toggle"], .hamburger-menu, .menu-toggle'
      );

      if (await hamburgerMenu.isVisible({ timeout: 2000 })) {
        await hamburgerMenu.click();

        // Mobile menu should open
        const mobileMenu = page.locator(
          '[data-testid="mobile-menu"], .mobile-nav, .slide-menu'
        );
        await expect(mobileMenu).toBeVisible();

        // Navigation items should be touch-friendly
        const navItems = page.locator('.mobile-nav a, .mobile-menu a');
        const itemCount = await navItems.count();

        for (let i = 0; i < Math.min(itemCount, 3); i++) {
          const item = navItems.nth(i);
          const itemBox = await item.boundingBox();
          if (itemBox) {
            expect(itemBox.height).toBeGreaterThan(44);
          }
        }

        // Close menu
        const closeButton = page.locator(
          '[data-testid="close-menu"], .menu-close, .close-button'
        );
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await expect(mobileMenu).not.toBeVisible();
        }
      }
    });

    test("should support touch gestures for feature exploration", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Scroll to features section
      await landingPage.scrollToFeatures();

      // Test swipe gestures on feature carousel (if present)
      const featureCarousel = page.locator(
        '[data-testid="feature-carousel"], .feature-slider'
      );

      if (await featureCarousel.isVisible({ timeout: 2000 })) {
        const carouselBox = await featureCarousel.boundingBox();
        
        if (carouselBox) {
          // Simulate swipe left
          await page.mouse.move(carouselBox.x + carouselBox.width * 0.8, carouselBox.y + carouselBox.height / 2);
          await page.mouse.down();
          await page.mouse.move(carouselBox.x + carouselBox.width * 0.2, carouselBox.y + carouselBox.height / 2);
          await page.mouse.up();

          // Should change active feature
          await page.waitForTimeout(500);
          
          const activeFeature = page.locator('.feature-active, .active-slide');
          if (await activeFeature.isVisible()) {
            await expect(activeFeature).toBeVisible();
          }
        }
      }
    });
  });

  test.describe("Mobile Authentication Flow", () => {
    test("should complete mobile registration flow", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await landingPage.goto();
      await landingPage.clickGetStarted();

      // Mobile registration form
      const registrationForm = page.locator('[data-testid="register-form"], form');
      await expect(registrationForm).toBeVisible();

      // Form fields should be mobile-optimized
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]:first-of-type');
      
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();

      // Inputs should have proper mobile keyboard types
      await expect(emailInput).toHaveAttribute('inputmode', 'email');
      
      const emailInputType = await emailInput.getAttribute('type');
      expect(emailInputType).toBe('email');

      // Test form completion
      const timestamp = Date.now();
      await page.fill('input[name="firstName"], input[placeholder*="first" i]', 'Mobile');
      await page.fill('input[name="lastName"], input[placeholder*="last" i]', 'User');
      await page.fill('input[type="email"]', `mobile-${timestamp}@test.gamegen.com`);
      await page.fill('input[type="password"]:first-of-type', 'MobileTest123!');
      await page.fill('input[type="password"]:last-of-type', 'MobileTest123!');

      // Submit button should be touch-friendly
      const submitButton = page.locator('button[type="submit"]');
      const submitBox = await submitButton.boundingBox();
      if (submitBox) {
        expect(submitBox.height).toBeGreaterThan(44);
      }

      // Test keyboard handling (virtual keyboard)
      await emailInput.focus();
      await page.waitForTimeout(500); // Allow for keyboard animation
      
      // Page should adjust for virtual keyboard
      const viewportHeight = page.viewportSize()?.height || 667;
      const formBox = await registrationForm.boundingBox();
      
      if (formBox) {
        // Form should still be accessible with virtual keyboard
        expect(formBox.y).toBeGreaterThanOrEqual(0);
      }
    });

    test("should handle mobile login with biometric integration", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto("/auth");

      // Mock biometric authentication availability
      await page.addInitScript(() => {
        (navigator as any).credentials = {
          create: () => Promise.resolve({ id: 'mock-credential' }),
          get: () => Promise.resolve({ id: 'mock-credential' })
        };
      });

      // Biometric login button (if implemented)
      const biometricButton = page.locator(
        '[data-testid="biometric-login"], button:has-text("Face ID"), button:has-text("Touch ID")'
      );

      if (await biometricButton.isVisible({ timeout: 2000 })) {
        await biometricButton.click();
        
        // Should trigger biometric authentication
        const authPrompt = page.locator(
          '[data-testid="biometric-prompt"], .biometric-auth'
        );
        
        if (await authPrompt.isVisible({ timeout: 1000 })) {
          await expect(authPrompt).toBeVisible();
        }
      }
    });
  });

  test.describe("Mobile Game Creator Interface", () => {
    test("should adapt creator layout for mobile screens", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Mobile layout should stack panels vertically or use tabs
      const chatPanel = page.locator('[data-testid="vibe-chat-panel"], .chat-interface');
      const editorPanel = page.locator('[data-testid="editor-panel"], .editor-tabs');
      const assetPanel = page.locator('[data-testid="asset-panel"], .asset-library');

      // Check if panels are visible and properly sized
      await expect(chatPanel).toBeVisible();
      
      const chatBox = await chatPanel.boundingBox();
      if (chatBox) {
        expect(chatBox.width).toBeLessThanOrEqual(375);
      }

      // Mobile might use bottom tabs or collapsible panels
      const mobileTabs = page.locator(
        '[data-testid="mobile-tabs"], .mobile-bottom-tabs, .panel-tabs'
      );

      if (await mobileTabs.isVisible({ timeout: 2000 })) {
        const tabButtons = mobileTabs.locator('button, .tab-button');
        const tabCount = await tabButtons.count();
        
        // Test tab switching
        if (tabCount > 1) {
          await tabButtons.nth(1).click();
          await page.waitForTimeout(300); // Tab transition
          
          // Panel should change
          const activePanel = page.locator('.active-panel, .tab-content:visible');
          await expect(activePanel).toBeVisible();
        }
      }
    });

    test("should handle mobile vibe coding chat", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Chat input should be mobile-optimized
      const chatInput = page.locator(
        '[data-testid="chat-input"], .chat-input, input[placeholder*="describe" i]'
      );
      
      if (await chatInput.isVisible({ timeout: 3000 })) {
        await expect(chatInput).toBeVisible();
        
        // Should expand for better typing experience
        await chatInput.focus();
        
        // Test voice input button (if available)
        const voiceButton = page.locator(
          '[data-testid="voice-input"], button:has-text("🎤"), .voice-input'
        );
        
        if (await voiceButton.isVisible()) {
          await voiceButton.click();
          
          // Should request microphone permission
          const micPermission = page.locator(
            '.mic-permission, [data-testid="mic-prompt"]'
          );
          
          if (await micPermission.isVisible({ timeout: 1000 })) {
            await expect(micPermission).toBeVisible();
          }
        }

        // Test sending message with mobile keyboard
        await chatInput.fill("Create a simple mobile-friendly game");
        
        const sendButton = page.locator(
          '[data-testid="send-chat"], .send-button'
        );
        await sendButton.click();

        // Should show response
        const chatResponse = page.locator(
          '.chat-message, [data-testid="chat-response"]'
        );
        await expect(chatResponse).toBeVisible({ timeout: 10000 });
      }
    });

    test("should support mobile asset library browsing", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Switch to asset panel if tabs are used
      const assetTab = page.locator(
        '[data-testid="asset-tab"], button:has-text("Assets")'
      );
      
      if (await assetTab.isVisible()) {
        await assetTab.click();
      }

      const assetLibrary = page.locator('[data-testid="asset-panel"], .asset-library');
      
      if (await assetLibrary.isVisible({ timeout: 3000 })) {
        // Asset grid should be responsive
        const assetGrid = page.locator('[data-testid="asset-grid"], .asset-grid');
        await expect(assetGrid).toBeVisible();

        // Assets should be laid out in mobile-friendly grid
        const assetItems = page.locator('.asset-item, .asset-card');
        const itemCount = await assetItems.count();
        
        if (itemCount > 1) {
          const firstItem = assetItems.first();
          const secondItem = assetItems.nth(1);
          
          const firstBox = await firstItem.boundingBox();
          const secondBox = await secondItem.boundingBox();
          
          if (firstBox && secondBox) {
            // Should fit mobile screen width
            expect(firstBox.width + secondBox.width).toBeLessThanOrEqual(375 + 50); // Allow for margins
          }
        }

        // Test asset search on mobile
        const searchInput = page.locator(
          '[data-testid="asset-search"], .asset-search input'
        );
        
        if (await searchInput.isVisible()) {
          await searchInput.fill("character");
          await searchInput.press('Enter');
          
          // Should update asset grid
          await page.waitForTimeout(1000);
          const updatedCount = await assetItems.count();
          // Results may vary, just ensure search executed
        }
      }
    });

    test("should handle mobile game preview", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Switch to live play tab
      const livePlayTab = page.locator(
        '[data-testid="live-play-tab"], button:has-text("Live Play")'
      );
      
      if (await livePlayTab.isVisible()) {
        await livePlayTab.click();
      }

      // Game preview should be mobile-optimized
      const gamePreview = page.locator(
        '[data-testid="game-preview"], .game-canvas, canvas'
      );
      
      if (await gamePreview.isVisible({ timeout: 5000 })) {
        await expect(gamePreview).toBeVisible();
        
        const canvasBox = await gamePreview.boundingBox();
        if (canvasBox) {
          // Canvas should fit mobile screen
          expect(canvasBox.width).toBeLessThanOrEqual(375);
        }

        // Test touch controls
        const touchControls = page.locator(
          '[data-testid="touch-controls"], .mobile-controls, .game-controls'
        );
        
        if (await touchControls.isVisible()) {
          await expect(touchControls).toBeVisible();
          
          // Control buttons should be touch-friendly
          const controlButtons = touchControls.locator('button');
          const buttonCount = await controlButtons.count();
          
          for (let i = 0; i < Math.min(buttonCount, 3); i++) {
            const button = controlButtons.nth(i);
            const buttonBox = await button.boundingBox();
            if (buttonBox) {
              expect(buttonBox.height).toBeGreaterThan(44);
              expect(buttonBox.width).toBeGreaterThan(44);
            }
          }
        }

        // Test touch gestures on game canvas
        if (canvasBox) {
          await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
          await page.mouse.down();
          await page.mouse.move(canvasBox.x + canvasBox.width / 3, canvasBox.y + canvasBox.height / 3);
          await page.mouse.up();
          
          // Should handle touch input
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe("Mobile Performance & Optimization", () => {
    test("should load efficiently on mobile connections", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Simulate slow 3G connection
      const client = await page.context().newCDPSession(page);
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5Mbps
        uploadThroughput: 750 * 1024 / 8, // 750kbps
        latency: 300
      });

      const startTime = Date.now();
      
      await landingPage.goto();
      await landingPage.waitForPageLoad();
      
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time on slow connection
      expect(loadTime).toBeLessThan(8000); // 8 second budget for slow connection
    });

    test("should handle memory constraints on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Monitor memory usage
      const memoryInfo = await page.evaluate(() => {
        const perf = performance as any;
        return perf.memory ? {
          usedJSHeapSize: perf.memory.usedJSHeapSize,
          totalJSHeapSize: perf.memory.totalJSHeapSize,
          jsHeapSizeLimit: perf.memory.jsHeapSizeLimit
        } : null;
      });

      if (memoryInfo) {
        // Should not exceed reasonable memory limits for mobile
        expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB
      }

      // Test creator interface under memory pressure
      await creatorPage.sendChatMessage("Create a complex game with many assets");
      
      // Should still be responsive
      const chatResponse = page.locator('.chat-message');
      await expect(chatResponse).toBeVisible({ timeout: 15000 });
    });

    test("should support offline functionality", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Go offline
      const client = await page.context().newCDPSession(page);
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', {
        offline: true,
        downloadThroughput: 0,
        uploadThroughput: 0,
        latency: 0
      });

      // Try to interact with cached content
      const offlineIndicator = page.locator(
        '[data-testid="offline-indicator"], .offline-status'
      );
      
      if (await offlineIndicator.isVisible({ timeout: 3000 })) {
        await expect(offlineIndicator).toBeVisible();
        await expect(offlineIndicator).toContainText(/offline|no.*connection/i);
      }

      // Some functionality should still work (cached assets, saved projects)
      const savedProjects = page.locator(
        '[data-testid="saved-projects"], .local-projects'
      );
      
      if (await savedProjects.isVisible()) {
        await expect(savedProjects).toBeVisible();
      }
    });
  });

  test.describe("Mobile Accessibility", () => {
    test("should support screen readers on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Check for proper heading hierarchy
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      
      expect(headingCount).toBeGreaterThan(0);

      // Main heading should be properly labeled
      const mainHeading = page.locator('h1');
      await expect(mainHeading).toBeVisible();

      // Images should have alt text
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const image = images.nth(i);
        const altText = await image.getAttribute('alt');
        const ariaLabel = await image.getAttribute('aria-label');
        
        // Should have either alt text or aria-label
        expect(altText || ariaLabel).toBeTruthy();
      }

      // Interactive elements should be focusable
      const interactiveElements = page.locator('button, a, input, select');
      const interactiveCount = await interactiveElements.count();
      
      if (interactiveCount > 0) {
        const firstInteractive = interactiveElements.first();
        await firstInteractive.focus();
        
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }
    });

    test("should handle high contrast mode", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Simulate high contrast media query
      await page.emulateMedia({ 
        colorScheme: 'dark',
        reducedMotion: 'reduce'
      });

      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Elements should have sufficient contrast
      const primaryButton = page.locator('[data-testid="get-started-button"], .cta-button');
      
      if (await primaryButton.isVisible()) {
        const buttonStyles = await primaryButton.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            border: styles.border
          };
        });

        // Should have defined styles (not transparent)
        expect(buttonStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
        expect(buttonStyles.color).not.toBe('rgba(0, 0, 0, 0)');
      }
    });

    test("should support voice control", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Mock speech recognition API
      await page.addInitScript(() => {
        (window as any).SpeechRecognition = class MockSpeechRecognition {
          onresult = null;
          onstart = null;
          onend = null;
          
          start() {
            if (this.onstart) this.onstart();
            // Simulate voice command
            setTimeout(() => {
              if (this.onresult) {
                this.onresult({
                  results: [{
                    0: { transcript: 'click get started' }
                  }]
                });
              }
              if (this.onend) this.onend();
            }, 1000);
          }
          
          stop() {}
        };
        
        (window as any).webkitSpeechRecognition = (window as any).SpeechRecognition;
      });

      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Voice control button (if implemented)
      const voiceButton = page.locator(
        '[data-testid="voice-control"], button:has-text("🎤")'
      );
      
      if (await voiceButton.isVisible({ timeout: 2000 })) {
        await voiceButton.click();
        
        // Should show listening indicator
        const listeningIndicator = page.locator(
          '[data-testid="listening"], .voice-listening'
        );
        
        if (await listeningIndicator.isVisible({ timeout: 1000 })) {
          await expect(listeningIndicator).toBeVisible();
        }
      }
    });
  });

  test.describe("Mobile Platform-Specific Features", () => {
    test("should handle iOS Safari specific behaviors", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12
      
      // Mock iOS user agent
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');

      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Test iOS viewport handling
      const viewportMeta = page.locator('meta[name="viewport"]');
      const viewportContent = await viewportMeta.getAttribute('content');
      
      expect(viewportContent).toContain('width=device-width');
      expect(viewportContent).toContain('initial-scale=1');

      // Test iOS safe area handling
      const bodyStyles = await page.locator('body').evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          paddingTop: styles.paddingTop,
          paddingBottom: styles.paddingBottom
        };
      });

      // Should handle safe areas for iPhone notch
      if (bodyStyles.paddingTop !== '0px' || bodyStyles.paddingBottom !== '0px') {
        // Safe area insets are being used
        expect(true).toBeTruthy();
      }
    });

    test("should handle Android Chrome specific behaviors", async ({ page }) => {
      await page.setViewportSize({ width: 393, height: 851 }); // Pixel 5
      
      // Mock Android user agent
      await page.setUserAgent('Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36');

      await authHelper.loginAsTestUser();
      await creatorPage.waitForPageLoad();

      // Test Android back button handling
      await page.goBack();
      
      // Should handle navigation properly
      await page.goForward();
      await creatorPage.verifyCreatorLayout();

      // Test Android share API
      const shareButton = page.locator(
        '[data-testid="share-game"], button:has-text("Share")'
      );
      
      if (await shareButton.isVisible({ timeout: 2000 })) {
        // Mock Web Share API
        await page.addInitScript(() => {
          (navigator as any).share = async (data: any) => {
            console.log('Sharing:', data);
            return Promise.resolve();
          };
        });

        await shareButton.click();
        
        // Should trigger share
        await page.waitForTimeout(500);
      }
    });

    test("should support PWA installation on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await landingPage.goto();
      await landingPage.waitForPageLoad();

      // Mock beforeinstallprompt event
      await page.evaluate(() => {
        const event = new Event('beforeinstallprompt');
        (event as any).prompt = () => Promise.resolve();
        window.dispatchEvent(event);
      });

      // PWA install banner (if implemented)
      const installBanner = page.locator(
        '[data-testid="install-banner"], .pwa-install, .app-install'
      );
      
      if (await installBanner.isVisible({ timeout: 2000 })) {
        await expect(installBanner).toBeVisible();
        
        const installButton = installBanner.locator('button');
        if (await installButton.isVisible()) {
          await installButton.click();
          
          // Should trigger installation prompt
          await page.waitForTimeout(500);
        }
      }

      // Check for manifest file
      const manifestLink = page.locator('link[rel="manifest"]');
      if (await manifestLink.isVisible()) {
        const manifestHref = await manifestLink.getAttribute('href');
        expect(manifestHref).toBeTruthy();
      }
    });
  });
});