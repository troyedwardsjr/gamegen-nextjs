# GameGen End-to-End Testing Suite

This comprehensive E2E testing suite covers all critical user flows for the GameGen platform, ensuring robust functionality across desktop and mobile experiences.

## 🎯 Test Coverage

### 1. User Registration Flow (`user-registration-flow.spec.ts`)
- Complete new user registration from landing page
- Form validation and error handling
- Email verification process
- Social authentication (Google/GitHub OAuth)
- Post-registration onboarding
- Free plan setup and limitations

### 2. User Login Flow (`user-login-flow.spec.ts`)
- Standard login flow from landing page
- Remember me functionality
- Password management (visibility toggle, forgot password)
- Social authentication login
- Session management and concurrent sessions
- Direct access to protected routes

### 3. Pricing & Subscription Flow (`pricing-subscription-flow.spec.ts`)
- Pricing page navigation and display
- Plan comparison (Free, Pro, Max tiers)
- Stripe payment integration
- Subscription management (upgrades, cancellations, billing history)
- Credit system validation
- Plan feature enforcement

### 4. Mobile Experience (`mobile-experience-flow.spec.ts`)
- Mobile-responsive landing page
- Touch-friendly navigation and interactions
- Mobile game creator interface
- Performance optimization for mobile devices
- Mobile-specific accessibility features
- Platform-specific behaviors (iOS Safari, Android Chrome)

### 5. Error Handling & Edge Cases (`error-handling-edge-cases.spec.ts`)
- Network connectivity issues (offline, slow connections, intermittent)
- Authentication edge cases (session expiration, malformed tokens)
- Payment processing failures and timeouts
- AI service failures and malformed responses
- Data validation and security (XSS, SQL injection prevention)
- Rate limiting and abuse prevention

### 6. Performance & Accessibility (`performance-accessibility.spec.ts`)
- Core Web Vitals monitoring (LCP, FID, CLS)
- Memory usage optimization
- Bundle size analysis
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility

## 🛠 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- GameGen development server running
- Test environment variables configured

### Installation
```bash
# Install Playwright browsers
npm run playwright:install

# Install system dependencies (Linux/CI)
npm run playwright:install-deps
```

### Environment Configuration
Create a `.env.test` file with the following variables:
```env
# Test user credentials
E2E_TEST_EMAIL=test@gamegen.com
E2E_TEST_PASSWORD=GameGenTest123!

# Subscription tier test users
E2E_FREE_USER_EMAIL=free@test.gamegen.com
E2E_FREE_USER_PASSWORD=FreeGameGen123!
E2E_PRO_USER_EMAIL=pro@test.gamegen.com
E2E_PRO_USER_PASSWORD=ProGameGen123!
E2E_MAX_USER_EMAIL=max@test.gamegen.com
E2E_MAX_USER_PASSWORD=MaxGameGen123!

# Test environment
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

## 🚀 Running Tests

### All Tests
```bash
npm run test:e2e
```

### Specific Test Suites
```bash
# User flows
npm run test:e2e:registration
npm run test:e2e:login
npm run test:e2e:pricing

# Platform-specific
npm run test:e2e:mobile
npm run test:e2e:desktop

# Quality assurance
npm run test:e2e:errors
npm run test:e2e:performance
```

### Development & Debugging
```bash
# Interactive UI mode
npm run test:e2e:ui

# Debug mode (step through tests)
npm run test:e2e:debug

# Run with browser visible
npm run test:e2e:headed
```

## 📊 Test Reports

Playwright generates comprehensive test reports:

- **HTML Report**: `test-results/playwright-report/index.html`
- **JUnit XML**: `test-results/junit.xml` (for CI/CD integration)
- **JSON Results**: `test-results/results.json`

### Viewing Reports
```bash
npx playwright show-report
```

## 🧩 Test Architecture

### Page Object Model
Tests use the Page Object Model pattern for maintainability:

- `pages/landing-page.ts` - Landing page interactions
- `pages/pricing-page.ts` - Pricing page functionality
- `pages/game-creator-page.ts` - Game creator interface

### Helper Classes
- `helpers/auth-helper.ts` - Authentication utilities
- Reusable functions for common operations
- Centralized user management

### Configuration
- `playwright.config.ts` - Main Playwright configuration
- `global-setup.ts` - Global test setup
- `global-teardown.ts` - Global test cleanup

## 🔧 Browser Support

Tests run across multiple browsers and devices:

### Desktop Browsers
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)

### Mobile Devices
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## 📱 Mobile Testing Features

### Device Emulation
- Multiple device profiles (iPhone, Pixel, iPad)
- Touch gesture simulation
- Viewport size testing
- Network condition simulation

### Mobile-Specific Tests
- Touch target size validation
- Mobile navigation patterns
- Virtual keyboard handling
- Progressive Web App features

## 🔒 Security Testing

### Input Validation
- XSS prevention testing
- SQL injection attempts
- Malformed data handling
- File upload security

### Authentication Security
- Session management
- Token validation
- Rate limiting
- Concurrent session handling

## 📈 Performance Monitoring

### Metrics Tracked
- **Loading Performance**: First Contentful Paint, Largest Contentful Paint
- **Interactivity**: First Input Delay, Cumulative Layout Shift
- **Resource Efficiency**: Bundle sizes, image optimization
- **Memory Usage**: JavaScript heap monitoring

### Performance Budgets
- Landing page load: < 3 seconds
- Navigation response: < 2 seconds
- Memory usage: < 50MB
- Bundle size: < 1MB

## ♿ Accessibility Testing

### WCAG 2.1 AA Compliance
- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation
- Color contrast validation
- Screen reader support

### Accessibility Features Tested
- Focus management
- Alternative text for images
- Form validation messages
- High contrast mode support
- Reduced motion preferences

## 🚨 Error Scenarios

### Network Issues
- Complete offline functionality
- Slow connection handling
- Intermittent connectivity
- Request retry mechanisms

### Service Failures
- AI service unavailability
- Payment processing errors
- Database connection issues
- Third-party API failures

## 📋 Best Practices

### Test Organization
- Descriptive test names
- Logical grouping by feature
- Clear setup and teardown
- Proper error handling

### Data Management
- Isolated test data
- Cleanup after tests
- Mock external services
- Environment-specific configs

### Maintenance
- Regular test updates
- Browser version compatibility
- Performance baseline updates
- Accessibility standard compliance

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
- name: Run E2E Tests
  run: |
    npm run build
    npm run test:e2e
```

### Test Parallelization
- Tests run in parallel for speed
- Browser-specific test distribution
- Retry failed tests automatically

## 🐛 Troubleshooting

### Common Issues

**Browser Installation**
```bash
npx playwright install --with-deps
```

**Timeout Issues**
- Increase timeout in `playwright.config.ts`
- Check network connectivity
- Verify test environment setup

**Test Flakiness**
- Add proper wait conditions
- Use explicit waits instead of timeouts
- Mock external dependencies

### Debug Commands
```bash
# Debug specific test
npx playwright test --debug user-registration-flow.spec.ts

# Generate trace files
npx playwright test --trace on

# View trace files
npx playwright show-trace trace.zip
```

## 📝 Contributing

### Adding New Tests
1. Create test file in appropriate directory
2. Follow existing naming conventions
3. Use Page Object Model pattern
4. Include proper documentation
5. Add to package.json scripts

### Test Standards
- Comprehensive error handling
- Mobile-first approach
- Accessibility compliance
- Performance awareness
- Security considerations

## 🎯 Test Scenarios Covered

### Happy Path Testing
- ✅ New user complete registration and onboarding
- ✅ Existing user login and game creation
- ✅ Subscription upgrade and payment processing
- ✅ Mobile game creation workflow

### Edge Case Testing
- ✅ Network failures and recovery
- ✅ Payment processing errors
- ✅ Session expiration handling
- ✅ Malformed data inputs
- ✅ Browser compatibility issues

### Performance Testing
- ✅ Page load times under budget
- ✅ Memory usage optimization
- ✅ Mobile network conditions
- ✅ Core Web Vitals monitoring

### Accessibility Testing
- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ High contrast mode support

This comprehensive test suite ensures GameGen delivers a robust, accessible, and performant experience across all user journeys and edge cases.