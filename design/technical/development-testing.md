# GameGen Platform: Development Workflow & Testing Strategy

**Version**: 1.0  
**Date**: 2025-09-05  
**Development Methodology**: Agile with continuous integration  
**Testing Philosophy**: Test-driven development with comprehensive coverage  
**Timeline**: 3-month MVP with iterative improvements  

## Development Workflow

### Git Strategy & Branching Model

GameGen follows a modified GitFlow approach optimized for rapid development and continuous deployment while maintaining code quality and stability.

#### Branch Structure
```
main (production)
├── develop (integration)
│   ├── feature/game-creation-ui
│   ├── feature/ai-generation-pipeline
│   ├── feature/collaboration-system
│   └── feature/asset-library
├── release/v1.0.0 (release preparation)
├── hotfix/critical-auth-fix (emergency fixes)
└── experimental/new-engine-integration (R&D)
```

#### Branch Naming Conventions
```bash
# Feature branches
feature/component-name-description
feature/auth-social-login
feature/creator-chat-interface

# Bug fixes
bugfix/issue-description
bugfix/asset-upload-validation

# Hotfixes (critical production issues)
hotfix/critical-description
hotfix/security-vulnerability-fix

# Releases
release/v1.0.0
release/v1.1.0-beta

# Experimental work
experimental/description
experimental/toxoid-v2-integration
```

### Development Environment Setup

#### Local Development Configuration
```typescript
// scripts/setup-dev.ts
import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';

class DevEnvironmentSetup {
  async initialize(): Promise<void> {
    console.log('🚀 Setting up GameGen development environment...');
    
    // Check prerequisites
    await this.checkPrerequisites();
    
    // Install dependencies
    await this.installDependencies();
    
    // Setup environment variables
    await this.setupEnvironmentVariables();
    
    // Initialize database
    await this.initializeDatabase();
    
    // Setup Git hooks
    await this.setupGitHooks();
    
    console.log('✅ Development environment ready!');
  }
  
  private async checkPrerequisites(): Promise<void> {
    const requirements = [
      { command: 'node --version', name: 'Node.js 18+' },
      { command: 'npm --version', name: 'npm' },
      { command: 'git --version', name: 'Git' }
    ];
    
    for (const req of requirements) {
      try {
        execSync(req.command, { stdio: 'ignore' });
        console.log(`✅ ${req.name} found`);
      } catch {
        throw new Error(`❌ ${req.name} is required but not found`);
      }
    }
  }
  
  private async setupEnvironmentVariables(): Promise<void> {
    const envTemplate = `
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/gamegen_dev"
SUPABASE_URL="http://localhost:54321"
SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_KEY="your_supabase_service_key"

# AI Services
ANTHROPIC_API_KEY="your_anthropic_api_key"

# Payment Processing
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# Development
NODE_ENV="development"
NEXTAUTH_SECRET="dev_secret_key_change_in_production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
`;
    
    if (!existsSync('.env.local')) {
      writeFileSync('.env.local', envTemplate);
      console.log('📝 Created .env.local template - please update with your keys');
    }
  }
  
  private async setupGitHooks(): Promise<void> {
    const preCommitHook = `#!/bin/sh
# Pre-commit hook for GameGen

echo "🔍 Running pre-commit checks..."

# Lint staged files
npm run lint:staged
if [ $? -ne 0 ]; then
  echo "❌ Linting failed. Please fix errors before committing."
  exit 1
fi

# Type check
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ Type checking failed. Please fix errors before committing."
  exit 1
fi

# Run unit tests for changed files
npm run test:changed
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Please fix tests before committing."
  exit 1
fi

echo "✅ Pre-commit checks passed!"
`;

    writeFileSync('.git/hooks/pre-commit', preCommitHook);
    execSync('chmod +x .git/hooks/pre-commit');
  }
}

// Run setup
new DevEnvironmentSetup().initialize().catch(console.error);
```

#### Docker Development Environment
```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose development port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
```

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  gamegen-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NODE_ENV=development
    depends_on:
      - postgres
      - redis
      
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: gamegen_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data

volumes:
  postgres_dev_data:
  redis_dev_data:
```

## Testing Strategy

### Testing Pyramid

GameGen implements a comprehensive testing strategy following the testing pyramid pattern, ensuring high coverage with fast feedback loops.

```
                    🔺
                   /   \
                  /  E2E \
                 /  Tests \
                /_________\
               /           \
              / Integration \
             /    Tests     \
            /_______________\
           /                 \
          /   Unit Tests     \
         /   (70% coverage)   \
        /___________________\
```

### Unit Testing

#### Testing Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'html', 'json'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        'next.config.js',
        '.next/',
        'coverage/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': '/app',
      '@/components': '/app/components',
      '@/lib': '/app/lib'
    }
  }
});
```

#### Unit Test Examples
```typescript
// tests/lib/ai/promptEngineer.test.ts
import { describe, it, expect, vi } from 'vitest';
import { PromptEngineer } from '@/lib/ai/promptEngineer';
import { GameGenreType } from '@/types';

describe('PromptEngineer', () => {
  let promptEngineer: PromptEngineer;

  beforeEach(() => {
    promptEngineer = new PromptEngineer();
  });

  describe('buildGameCreationPrompt', () => {
    it('should create a valid prompt for platformer games', async () => {
      const userRequest = 'Create a platformer where you collect coins and avoid enemies';
      const context = [
        {
          title: 'Basic Platformer Pattern',
          description: 'Jump mechanics with gravity and collision detection',
          tags: ['platformer', 'physics', 'movement']
        }
      ];

      const prompt = await promptEngineer.buildGameCreationPrompt(userRequest, context);

      expect(prompt.system_prompt).toContain('GameGen AI');
      expect(prompt.system_prompt).toContain('pixel art games');
      expect(prompt.user_message).toContain(userRequest);
      expect(prompt.retrieved_context).toEqual(context);
      expect(prompt.constraints.platform_compatibility).toContain('web');
    });

    it('should handle empty context gracefully', async () => {
      const userRequest = 'Simple puzzle game';
      const context: any[] = [];

      const prompt = await promptEngineer.buildGameCreationPrompt(userRequest, context);

      expect(prompt).toBeDefined();
      expect(prompt.retrieved_context).toEqual([]);
      expect(prompt.user_message).toContain(userRequest);
    });

    it('should sanitize malicious input', async () => {
      const maliciousRequest = 'Create a game <script>alert("xss")</script>';
      const context: any[] = [];

      const prompt = await promptEngineer.buildGameCreationPrompt(maliciousRequest, context);

      expect(prompt.user_message).not.toContain('<script>');
      expect(prompt.user_message).not.toContain('alert');
    });
  });

  describe('formatContext', () => {
    it('should format context correctly', () => {
      const context = [
        {
          title: 'Platformer Mechanics',
          description: 'Basic jumping and gravity',
          tags: ['platformer', 'physics']
        },
        {
          title: 'Collectible System',
          description: 'Items that increase score',
          tags: ['collectibles', 'scoring']
        }
      ];

      const formatted = promptEngineer.formatContext(context);

      expect(formatted).toContain('Platformer Mechanics');
      expect(formatted).toContain('Basic jumping and gravity');
      expect(formatted).toContain('platformer, physics');
      expect(formatted).toContain('Collectible System');
    });
  });
});

// tests/components/creator/ChatInterface.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ChatInterface } from '@/components/creator/ChatInterface';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn()
  })
}));

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      insert: vi.fn(() => Promise.resolve({ data: {}, error: null }))
    }))
  }
}));

describe('ChatInterface', () => {
  it('should render chat input and send button', () => {
    render(<ChatInterface />);
    
    expect(screen.getByPlaceholderText('Describe your game idea...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('should display credit count', () => {
    render(<ChatInterface />);
    
    expect(screen.getByText(/credits/i)).toBeInTheDocument();
  });

  it('should disable send button when input is empty', () => {
    render(<ChatInterface />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('should enable send button when input has text', async () => {
    render(<ChatInterface />);
    
    const textarea = screen.getByPlaceholderText('Describe your game idea...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(textarea, { target: { value: 'Create a simple platformer' } });

    await waitFor(() => {
      expect(sendButton).not.toBeDisabled();
    });
  });

  it('should show generating indicator when AI is processing', async () => {
    render(<ChatInterface />);
    
    const textarea = screen.getByPlaceholderText('Describe your game idea...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(textarea, { target: { value: 'Create a puzzle game' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/generating/i)).toBeInTheDocument();
    });
  });
});
```

### Integration Testing

#### API Route Testing
```typescript
// tests/api/games.test.ts
import { createMocks } from 'node-mocks-http';
import { POST, GET } from '@/app/api/games/route';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase');
vi.mock('@/lib/auth');

describe('/api/games', () => {
  describe('POST /api/games', () => {
    it('should create a new game', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Game',
          description: 'A test game',
          genre: 'platformer'
        },
        headers: {
          'content-type': 'application/json',
          'authorization': 'Bearer valid-token'
        }
      });

      // Mock authentication
      vi.mocked(authService.verifyRequest).mockResolvedValue({
        success: true,
        user: { id: 'user-123', email: 'test@example.com', tier: 'free' }
      });

      // Mock database insert
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: { id: 'game-123', title: 'Test Game' },
          error: null
        })
      } as any);

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Test Game');
    });

    it('should reject unauthorized requests', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: { title: 'Test Game' }
      });

      vi.mocked(authService.verifyRequest).mockResolvedValue({
        success: false,
        error: 'No authentication token provided'
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should validate input data', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: { title: '' }, // Invalid empty title
        headers: { 'authorization': 'Bearer valid-token' }
      });

      vi.mocked(authService.verifyRequest).mockResolvedValue({
        success: true,
        user: { id: 'user-123', email: 'test@example.com', tier: 'free' }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('title');
    });
  });
});

// tests/integration/gameCreation.test.ts
describe('Game Creation Flow', () => {
  it('should complete full game creation workflow', async () => {
    // Mock user authentication
    const mockUser = {
      id: 'user-123',
      email: 'creator@example.com',
      tier: 'pro'
    };

    // Create game via API
    const gameResponse = await fetch('/api/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      },
      body: JSON.stringify({
        title: 'Integration Test Game',
        genre: 'platformer'
      })
    });

    expect(gameResponse.ok).toBe(true);
    const gameData = await gameResponse.json();
    const gameId = gameData.data.id;

    // Generate game content via AI API
    const generationResponse = await fetch('/api/ai/generate/game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      },
      body: JSON.stringify({
        gameId,
        prompt: 'Create a simple platformer with jumping and coin collection'
      })
    });

    expect(generationResponse.ok).toBe(true);
    const generationData = await generationResponse.json();

    // Poll for completion
    let generationComplete = false;
    let attempts = 0;

    while (!generationComplete && attempts < 10) {
      const statusResponse = await fetch(`/api/ai/generate/${generationData.data.generation_id}/status`);
      const statusData = await statusResponse.json();

      if (statusData.data.status === 'completed') {
        generationComplete = true;
      } else if (statusData.data.status === 'failed') {
        throw new Error('Generation failed');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    expect(generationComplete).toBe(true);

    // Verify game was updated with generated content
    const updatedGameResponse = await fetch(`/api/games/${gameId}`);
    const updatedGameData = await updatedGameResponse.json();

    expect(updatedGameData.data.game_data).toBeDefined();
    expect(updatedGameData.data.assets).toHaveLength.greaterThan(0);
  });
});
```

### End-to-End Testing

#### E2E Test Setup with Playwright
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'Chrome',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'Firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'Safari',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

#### E2E Test Examples
```typescript
// tests/e2e/gameCreation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Game Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('/api/auth/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 'test-user', email: 'test@example.com', tier: 'pro' }
        })
      });
    });

    await page.goto('/dashboard');
  });

  test('should create game through natural language', async ({ page }) => {
    // Navigate to game creator
    await page.click('[data-testid="create-game-btn"]');
    
    // Wait for creator interface to load
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    
    // Type game description
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('Create a platformer game where the player collects coins and avoids enemies');
    
    // Send message
    await page.click('[data-testid="send-message-btn"]');
    
    // Wait for AI processing indicator
    await expect(page.locator('[data-testid="generating-indicator"]')).toBeVisible();
    
    // Mock AI generation completion
    await page.route('/api/ai/generate/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            status: 'completed',
            game_id: 'generated-game-123'
          }
        })
      });
    });
    
    // Wait for game to be generated
    await expect(page.locator('[data-testid="game-preview"]')).toBeVisible({ timeout: 30000 });
    
    // Test play mode
    await page.click('[data-testid="play-tab"]');
    await expect(page.locator('[data-testid="game-canvas"]')).toBeVisible();
    
    // Test that game loads and is interactive
    const gameCanvas = page.locator('[data-testid="game-canvas"]');
    await expect(gameCanvas).toBeVisible();
    
    // Simulate game interaction
    await gameCanvas.press('ArrowRight'); // Move right
    await gameCanvas.press('Space'); // Jump
    
    // Verify game responds to input (this would require game engine integration)
  });

  test('should switch between editor tabs', async ({ page }) => {
    await page.goto('/creator/test-game');
    
    // Default should be play tab
    await expect(page.locator('[data-testid="play-tab"]')).toHaveClass(/active/);
    
    // Switch to map editor
    await page.click('[data-testid="map-tab"]');
    await expect(page.locator('[data-testid="map-editor"]')).toBeVisible();
    
    // Switch to code editor
    await page.click('[data-testid="code-tab"]');
    await expect(page.locator('[data-testid="code-editor"]')).toBeVisible();
    
    // Switch to settings
    await page.click('[data-testid="settings-tab"]');
    await expect(page.locator('[data-testid="game-settings"]')).toBeVisible();
  });

  test('should handle mobile layout', async ({ page, isMobile }) => {
    if (!isMobile) return;
    
    await page.goto('/creator/test-game');
    
    // Mobile should show navigation tabs
    await expect(page.locator('[data-testid="mobile-nav-tabs"]')).toBeVisible();
    
    // Test mobile panel switching
    await page.click('[data-testid="mobile-nav-chat"]');
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    
    await page.click('[data-testid="mobile-nav-editor"]');
    await expect(page.locator('[data-testid="editor-content"]')).toBeVisible();
    
    await page.click('[data-testid="mobile-nav-assets"]');
    await expect(page.locator('[data-testid="asset-library"]')).toBeVisible();
  });
});

// tests/e2e/collaboration.spec.ts
test.describe('Real-time Collaboration', () => {
  test('should support multiple users editing simultaneously', async ({ context }) => {
    // Create two browser contexts to simulate two users
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // User 1 creates and shares a game
    await page1.goto('/creator/shared-game');
    await page1.click('[data-testid="share-game-btn"]');
    
    // Get share link
    const shareLink = await page1.locator('[data-testid="share-link"]').textContent();
    
    // User 2 joins the session
    await page2.goto(shareLink!);
    
    // Verify both users see each other
    await expect(page1.locator('[data-testid="collaborator-list"]')).toContainText('2 users');
    await expect(page2.locator('[data-testid="collaborator-list"]')).toContainText('2 users');
    
    // User 1 makes changes
    await page1.locator('[data-testid="game-title-input"]').fill('Collaborative Game');
    
    // User 2 should see the changes
    await expect(page2.locator('[data-testid="game-title-input"]')).toHaveValue('Collaborative Game');
    
    // Test cursor synchronization
    await page1.locator('[data-testid="chat-input"]').click();
    await expect(page2.locator('[data-testid="user1-cursor"]')).toBeVisible();
  });
});
```

## Code Quality & Standards

### ESLint Configuration
```javascript
// eslint.config.mjs
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

const compat = new FlatCompat();

export default [
  js.configs.recommended,
  ...compat.config({
    extends: [
      'next/core-web-vitals',
      '@typescript-eslint/recommended',
      'prettier'
    ],
    plugins: ['@typescript-eslint', 'react-hooks', 'testing-library'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      project: './tsconfig.json'
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      
      // React
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'off',
      
      // General
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Testing
      'testing-library/await-async-query': 'error',
      'testing-library/no-await-sync-query': 'error'
    },
    overrides: [
      {
        files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
        env: { jest: true },
        rules: {
          '@typescript-eslint/no-explicit-any': 'off'
        }
      }
    ]
  })
];
```

### Code Formatting with Prettier
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

## Continuous Integration Pipeline

### GitHub Actions CI/CD
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit -- --coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
      
      - run: npm ci
      - run: npm audit --audit-level high
      - run: npx snyk test --severity-threshold=medium
```

## Performance Testing

### Load Testing with Artillery
```yaml
# tests/performance/load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 300
      arrivalRate: 10
      name: "Sustained load"
    - duration: 60
      arrivalRate: 20
      name: "Peak load"
  payload:
    path: "./test-data.csv"
    fields:
      - "email"
      - "password"

scenarios:
  - name: "Game Creation Flow"
    weight: 70
    flow:
      - post:
          url: "/api/auth/signin"
          json:
            email: "{{ email }}"
            password: "{{ password }}"
          capture:
            - json: "$.access_token"
              as: "token"
      
      - post:
          url: "/api/games"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            title: "Load Test Game"
            genre: "platformer"
          capture:
            - json: "$.data.id"
              as: "gameId"
      
      - post:
          url: "/api/ai/generate/game"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            gameId: "{{ gameId }}"
            prompt: "Simple platformer game"

  - name: "Browse Games"
    weight: 30
    flow:
      - get:
          url: "/api/games"
          qs:
            page: 1
            limit: 20
            visibility: "public"
```

This comprehensive development and testing strategy ensures GameGen maintains high quality, reliability, and performance throughout the development lifecycle while enabling rapid iteration and deployment.