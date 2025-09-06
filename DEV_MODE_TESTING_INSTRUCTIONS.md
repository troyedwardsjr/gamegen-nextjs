# GameGen Dev Mode Testing Instructions

## Overview

The GameGen NextJS application includes a comprehensive dev mode system that bypasses authentication for testing purposes. This allows QA testers, developers, and E2E tests to access protected routes like the game creator, dashboard, and profile without needing to authenticate.

## 🚨 SECURITY NOTICE

**Dev mode is ONLY available in development environments and includes multiple security safeguards:**

- Only works when `NODE_ENV=development`
- Only works on `localhost` or `.local` domains
- Requires both server and client environment flags to be enabled
- Displays prominent warning banners
- Automatically disabled in production
- All API routes respect dev mode bypass

## Quick Start for QA Testing

### 1. Enable Dev Mode

Choose one of these methods:

**Method A: Using Makefile**
```bash
make dev-mode-on
```

**Method B: Using npm scripts**
```bash
npm run dev-mode:on
```

**Method C: Using the toggle script directly**
```bash
node scripts/toggle-dev-mode.js on
```

### 2. Start the Development Server

```bash
npm run dev
# OR start with dev mode enabled automatically:
npm run dev:bypass
# OR via Makefile:
make dev-with-auth-bypass
```

The server will start on `http://localhost:3000`.

### 3. Access Protected Routes

With dev mode enabled, you can now access protected routes directly:

- **Dashboard**: http://localhost:3000/dashboard
- **Game Creator**: http://localhost:3000/game-creator
- **Profile**: http://localhost:3000/profile
- **Settings**: http://localhost:3000/settings
- **Analytics**: http://localhost:3000/analytics (if available)

### 4. Visual Indicators

When dev mode is active, you'll see:

- **Orange Banner**: A prominent "🚧 GAMEGEN DEV MODE" banner at the top of all pages
- **Mock User Data**: The app will show a mock developer user with:
  - Email: developer@gamegen.com
  - Username: dev_creator
  - Display Name: GameGen Developer
  - Subscription Tier: max (all features enabled)
  - Games Created: 15 (mock data)
  - Reputation Score: 850
  - Full feature access

### 5. Testing Features

The banner includes a settings icon (⚙️) that shows detailed dev mode information including:

- Mock user credentials and profile details
- Environment details and security warnings
- Feature flags and permissions status

## Detailed Testing Scenarios

### Authentication Bypass Testing

1. **Direct Route Access**:
   - Navigate directly to `http://localhost:3000/dashboard`
   - Should load immediately without redirect to auth page
   - Orange dev mode banner should be visible

2. **Auth Route Redirection**:
   - Navigate to `http://localhost:3000/auth`
   - Should automatically redirect to `/dashboard`
   - Should show dev mode banner

3. **Mock User Data**:
   - Dashboard should display mock user information
   - Profile pages should show mock data with GameGen-specific fields
   - All authentication-dependent features should work
   - Game creator should be accessible with full permissions

### Server-Side Testing

Monitor the server console for dev mode messages:

```
🚧 GAMEGEN DEV MODE ACTIVATED 🚧
Context: ConditionalAuthProvider - Using DevAuthProvider
⚠️  WARNING: Authentication is bypassed
⚠️  WARNING: Never enable in production
🔒 Environment checks passed: development + localhost
```

### API Route Testing

API routes also respect dev mode:

```
🚧 GAMEGEN DEV MODE: Bypassing authentication middleware for /api/games
🚧 GAMEGEN DEV MODE: Bypassing authentication middleware for /api/profile
```

## E2E Testing Integration

### Playwright Test Setup

For E2E tests that require authentication bypass:

```bash
# Enable dev mode before running tests
npm run test:e2e:dev
```

This command automatically:
1. Enables dev mode
2. Runs all Playwright tests with authentication bypassed

### Individual Test Scripts

```bash
# Enable dev mode then run specific test suites
npm run dev-mode:on
npm run test:e2e:registration  # Will skip actual registration
npm run test:e2e:login        # Will skip actual login
npm run test:e2e:performance  # Will test with mock data
```

### Manual E2E Test Setup

```typescript
// In your Playwright tests
import { test, expect } from '@playwright/test';

test.describe('GameGen Dashboard - Dev Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Dev mode should be enabled via environment
    await page.goto('http://localhost:3000/dashboard');
  });

  test('should show dev mode banner', async ({ page }) => {
    await expect(page.locator('text=🚧 GAMEGEN DEV MODE')).toBeVisible();
  });

  test('should display mock user data', async ({ page }) => {
    await expect(page.locator('text=GameGen Developer')).toBeVisible();
    await expect(page.locator('text=developer@gamegen.com')).toBeVisible();
  });
});
```

## Dev Mode Commands Reference

### Status Commands
```bash
make dev-mode-status     # Show current dev mode status
npm run dev-mode         # Show current dev mode status
node scripts/toggle-dev-mode.js  # Show status (no args)
```

### Enable Commands
```bash
make dev-mode-on         # Enable dev mode
npm run dev-mode:on      # Enable dev mode
node scripts/toggle-dev-mode.js on  # Enable dev mode
```

### Disable Commands
```bash
make dev-mode-off        # Disable dev mode
npm run dev-mode:off     # Disable dev mode
node scripts/toggle-dev-mode.js off  # Disable dev mode
```

### Development Server Commands
```bash
make dev-with-auth-bypass  # Enable dev mode and start server
npm run dev:bypass         # Enable dev mode and start server
```

## Testing Checklist

Use this checklist to verify dev mode is working correctly:

### Environment Setup
- [ ] `DEV_MODE_ENABLED=true` in .env.local
- [ ] `NEXT_PUBLIC_DEV_MODE_ENABLED=true` in .env.local
- [ ] `NODE_ENV=development` in .env.local
- [ ] Running on localhost or .local domain

### Authentication Bypass
- [ ] Dashboard accessible without login
- [ ] Game Creator accessible without login
- [ ] Profile page accessible without login
- [ ] Settings page accessible without login
- [ ] Auth routes redirect to dashboard
- [ ] No authentication error messages

### Visual Indicators
- [ ] Orange dev mode banner visible
- [ ] Banner shows "🚧 GAMEGEN DEV MODE"
- [ ] Banner can be expanded to show details
- [ ] Banner can be dismissed
- [ ] Mock user info displays correctly

### Server Logs
- [ ] "GAMEGEN DEV MODE ACTIVATED" messages
- [ ] "Bypassing authentication middleware" messages
- [ ] No authentication errors in server logs
- [ ] API routes show bypass messages

### Mock Data
- [ ] Dashboard shows mock user data
- [ ] Profile shows GameGen developer user
- [ ] Max subscription tier shown
- [ ] Mock game creation statistics
- [ ] All user-dependent features work

### API Routes
- [ ] Game creation API works without auth
- [ ] Profile API works without auth
- [ ] Community API works without auth
- [ ] Upload API works without auth

## Disabling Dev Mode

To disable dev mode for production-like testing:

1. **Set environment variables to `false`:**
   ```bash
   make dev-mode-off
   # OR
   npm run dev-mode:off
   ```

2. **Restart the server:**
   ```bash
   npm run dev
   ```

3. **Verify normal behavior:**
   - Authentication will be required normally
   - Protected routes will redirect to auth page
   - No dev mode banner visible

## Security Verification

To verify security measures are working:

1. **Production Environment**: Dev mode should never activate when `NODE_ENV=production`
2. **Hostname Restriction**: Dev mode should not work on production domains
3. **Visual Warnings**: Clear security warnings should be displayed
4. **Logging**: Appropriate warning messages in console
5. **API Security**: API routes should require real authentication in production

## GameGen-Specific Features in Dev Mode

### Mock Game Data
- 15 games created (mock data)
- 12 games published
- Various genres: platformer, puzzle, adventure
- Realistic game statistics

### Mock Community Data
- 8 community posts
- 247 likes received
- 89 followers, 34 following
- 850 reputation score

### Feature Flags
All advanced features are enabled in dev mode:
- Beta features access
- Advanced editor tools
- AI assistance
- Collaboration features
- Max tier subscription benefits

## Troubleshooting

### Common Issues

**Issue**: Dev mode not activating
**Solution**: 
1. Check environment variables are set correctly
2. Ensure running on localhost
3. Restart development server
4. Check console for error messages

**Issue**: Dev mode banner not showing
**Solution**:
1. Verify `NEXT_PUBLIC_DEV_MODE_ENABLED=true`
2. Clear browser cache
3. Check browser console for errors

**Issue**: API routes still require authentication
**Solution**:
1. Verify `DEV_MODE_ENABLED=true` (server-side)
2. Check middleware is updated
3. Restart development server

### Debug Commands

```bash
# Check current environment
node scripts/toggle-dev-mode.js status

# Verify environment variables
cat .env.local | grep DEV_MODE

# Check server logs
tail -f dev.log
```

## Support

If you encounter any issues with dev mode:

1. Check this documentation first
2. Verify environment setup using status commands
3. Check server console logs for error messages
4. Try clearing cache and restarting server
5. Verify you're running on localhost

---

**Last Updated**: September 6, 2025  
**Version**: 1.0  
**Environment**: NextJS 15.3.1 with Turbopack  
**Project**: GameGen Platform