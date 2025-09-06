import { Page, expect } from "@playwright/test";

export interface TestUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export class GameGenAuthHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Default test user credentials for GameGen
   */
  private getDefaultTestUser(): TestUser {
    return {
      email: process.env.E2E_TEST_EMAIL || "test@gamegen.com",
      password: process.env.E2E_TEST_PASSWORD || "GameGenTest123!",
      firstName: "Game",
      lastName: "Creator"
    };
  }

  /**
   * Login using the default test user
   */
  async loginAsTestUser(): Promise<void> {
    const testUser = this.getDefaultTestUser();
    await this.login(testUser);
  }

  /**
   * Login with specific user credentials
   */
  async login(user: TestUser): Promise<void> {
    // Check if already logged in
    if (await this.isLoggedIn()) {
      return;
    }

    // Navigate to auth page
    await this.page.goto("/auth");
    
    // Wait for auth page to load and ensure we're in login mode
    await this.page.waitForSelector('[data-testid="login-form"], [data-testid="register-form"], form', { timeout: 10000 });
    
    // Check if we need to switch to login mode
    const registerForm = this.page.locator('[data-testid="register-form"]');
    if (await registerForm.isVisible()) {
      // Click the sign in toggle button using data-testid
      const signInToggle = this.page.locator('[data-testid="switch-to-login"]');
      await signInToggle.click();
      await this.page.waitForSelector('[data-testid="login-form"]', { timeout: 5000 });
    }

    // Fill login form
    await this.page.fill('[data-testid="email-input"]', user.email);
    await this.page.fill('[data-testid="password-input"]', user.password);

    // Submit login form
    const loginButton = this.page.locator('[data-testid="login-button"]');
    await loginButton.click();

    // Wait for successful login (redirect to dashboard or game creator)
    await this.page.waitForURL(/\/(dashboard|creator|games)/, { timeout: 15000 });
    
    // Verify login was successful
    await this.verifyLoggedIn();
  }

  /**
   * Register a new test user for GameGen
   */
  async registerTestUser(user: TestUser): Promise<void> {
    await this.page.goto("/auth");
    
    // Wait for auth page to load and ensure we're in registration mode
    await this.page.waitForSelector('[data-testid="login-form"], [data-testid="register-form"], form', { timeout: 10000 });
    
    // Check if we need to switch to registration mode
    const loginForm = this.page.locator('[data-testid="login-form"]');
    if (await loginForm.isVisible()) {
      // Click the sign up toggle button using data-testid
      const signUpToggle = this.page.locator('[data-testid="switch-to-register"]');
      await signUpToggle.click();
      await this.page.waitForSelector('[data-testid="register-form"]', { timeout: 5000 });
    }

    // Fill registration form (Note: Current auth form doesn't have first/last name fields)
    await this.page.fill('[data-testid="email-input"]', user.email);
    await this.page.fill('[data-testid="password-input"]', user.password);
    await this.page.fill('[data-testid="confirm-password-input"]', user.password);

    // Accept terms if checkbox exists
    const termsCheckbox = this.page.locator(
      '[data-testid="terms-checkbox"], input[type="checkbox"], input[name="terms"]'
    );
    if (await termsCheckbox.isVisible({ timeout: 2000 })) {
      await termsCheckbox.check();
    }

    // Submit registration
    const registerButton = this.page.locator('[data-testid="register-button"]');
    await registerButton.click();

    // Wait for successful registration (may redirect to email verification or dashboard)
    await this.page.waitForLoadState("networkidle", { timeout: 15000 });
    
    // Handle potential email verification step
    if (this.page.url().includes("/verify")) {
      console.log("Email verification required - handling for GameGen test user");
      // In test environment, we might auto-verify or skip this step
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    // Look for user menu or logout button
    const userMenu = this.page.locator(
      '[data-testid="user-menu"], [data-testid="profile-dropdown"], .user-menu, .profile-menu'
    );
    
    if (await userMenu.isVisible({ timeout: 3000 })) {
      await userMenu.click();
      
      // Click logout option
      const logoutButton = this.page.locator(
        '[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign Out")'
      );
      await logoutButton.click();
    } else {
      // Fallback: direct navigation to logout endpoint
      await this.page.goto("/api/auth/logout");
    }

    // Wait for redirect to login or home page
    await this.page.waitForURL(/\/(login|register|$)/, { timeout: 10000 });
  }

  /**
   * Check if user is currently logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      // Look for authenticated user indicators specific to GameGen
      const userIndicators = [
        '[data-testid="user-menu"]',
        '[data-testid="profile-dropdown"]',
        '[data-testid="user-avatar"]',
        '.user-menu',
        '[href="/dashboard"]',
        '[href="/creator"]',
        '[href="/games"]'
      ];

      for (const selector of userIndicators) {
        if (await this.page.locator(selector).isVisible({ timeout: 1000 })) {
          return true;
        }
      }

      // Check if on authenticated routes specific to GameGen
      const authenticatedRoutes = ['/dashboard', '/creator', '/games', '/projects', '/settings'];
      const currentUrl = this.page.url();
      
      return authenticatedRoutes.some(route => currentUrl.includes(route));
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify that user is logged in (with assertions)
   */
  async verifyLoggedIn(): Promise<void> {
    // Should be on an authenticated page
    await expect(this.page).not.toHaveURL(/\/(login|register)/);
    
    // Should see user-specific elements
    const userElements = [
      '[data-testid="user-menu"]',
      '[data-testid="user-avatar"]',
      '[href="/dashboard"]',
      '[href="/creator"]'
    ];

    let foundUserElement = false;
    for (const selector of userElements) {
      if (await this.page.locator(selector).isVisible({ timeout: 1000 })) {
        foundUserElement = true;
        break;
      }
    }

    expect(foundUserElement).toBeTruthy();
  }

  /**
   * Verify that user is logged out (with assertions)
   */
  async verifyLoggedOut(): Promise<void> {
    // Should be on login, register, or home page
    await expect(this.page).toHaveURL(/\/(login|register|$)/);
    
    // Should not see user-specific elements
    const userElements = [
      '[data-testid="user-menu"]',
      '[data-testid="user-avatar"]'
    ];

    for (const selector of userElements) {
      await expect(this.page.locator(selector)).not.toBeVisible({ timeout: 1000 });
    }
  }

  /**
   * Get current user information from the page
   */
  async getCurrentUserInfo(): Promise<{ email?: string; name?: string }> {
    const userInfo: { email?: string; name?: string } = {};

    try {
      // Try to extract user info from various page elements
      const emailElement = this.page.locator('[data-testid="user-email"]');
      if (await emailElement.isVisible({ timeout: 1000 })) {
        userInfo.email = await emailElement.textContent() || undefined;
      }

      const nameElement = this.page.locator(
        '[data-testid="user-name"], [data-testid="user-display-name"]'
      );
      if (await nameElement.isVisible({ timeout: 1000 })) {
        userInfo.name = await nameElement.textContent() || undefined;
      }

      // Try to get info from user menu
      const userMenu = this.page.locator('[data-testid="user-menu"]');
      if (await userMenu.isVisible({ timeout: 1000 })) {
        await userMenu.click();
        
        const profileInfo = this.page.locator('[data-testid="profile-info"]');
        if (await profileInfo.isVisible({ timeout: 1000 })) {
          const text = await profileInfo.textContent();
          if (text) {
            // Extract email pattern
            const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
            if (emailMatch) {
              userInfo.email = emailMatch[0];
            }
          }
        }
        
        // Close menu
        await this.page.keyboard.press('Escape');
      }
    } catch (error) {
      console.warn("Could not extract GameGen user info:", error);
    }

    return userInfo;
  }

  /**
   * Login with subscription tier for GameGen (free, pro, max)
   */
  async loginWithSubscription(tier: "free" | "pro" | "max"): Promise<void> {
    const subscriptionUsers: Record<string, TestUser> = {
      free: {
        email: process.env.E2E_FREE_USER_EMAIL || "free@test.gamegen.com",
        password: process.env.E2E_FREE_USER_PASSWORD || "FreeGameGen123!"
      },
      pro: {
        email: process.env.E2E_PRO_USER_EMAIL || "pro@test.gamegen.com",
        password: process.env.E2E_PRO_USER_PASSWORD || "ProGameGen123!"
      },
      max: {
        email: process.env.E2E_MAX_USER_EMAIL || "max@test.gamegen.com",
        password: process.env.E2E_MAX_USER_PASSWORD || "MaxGameGen123!"
      }
    };

    const user = subscriptionUsers[tier];
    await this.login(user);
  }

  /**
   * Create and login with a temporary test user
   */
  async createAndLoginTempUser(): Promise<TestUser> {
    const timestamp = Date.now();
    const tempUser: TestUser = {
      email: `temp-game-creator-${timestamp}@test.gamegen.com`,
      password: "TempGameGen123!",
      firstName: "Temp",
      lastName: "Creator"
    };

    try {
      await this.registerTestUser(tempUser);
    } catch (error) {
      // If registration fails, try to login (user might already exist)
      console.log("Registration failed, attempting login:", error);
      await this.login(tempUser);
    }

    return tempUser;
  }

  /**
   * Setup authentication state for tests that don't need to test the login flow
   */
  async setupAuthState(): Promise<void> {
    await this.loginAsTestUser();
    
    // Save authentication state for reuse
    const storageState = await this.page.context().storageState();
    
    // Store in context for potential reuse
    (this.page.context() as any)._authState = storageState;
  }

  /**
   * Handle authentication errors gracefully
   */
  async handleAuthError(): Promise<void> {
    // Check for common authentication error scenarios
    const errorSelectors = [
      '[data-testid="auth-error"]',
      '[data-testid="login-error"]',
      '.error-message',
      '[role="alert"]',
      '.alert-error'
    ];

    for (const selector of errorSelectors) {
      const errorElement = this.page.locator(selector);
      if (await errorElement.isVisible({ timeout: 1000 })) {
        const errorText = await errorElement.textContent();
        console.error("GameGen authentication error detected:", errorText);
        
        // Take screenshot for debugging
        await this.page.screenshot({
          path: `test-results/gamegen-auth-error-${Date.now()}.png`,
          fullPage: true
        });
        
        throw new Error(`GameGen Authentication failed: ${errorText}`);
      }
    }
  }
}