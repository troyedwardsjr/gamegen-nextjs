const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  moduleNameMapper: {
    // Handle module aliases (this will match tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/styles/(.*)$': '<rootDir>/styles/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/config/(.*)$': '<rootDir>/config/$1',
    '^@/public/(.*)$': '<rootDir>/public/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    // Include source code for coverage
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'types/**/*.{js,jsx,ts,tsx}',
    'config/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    // Exclude non-source files
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!**/e2e/**',
    '!**/test-utils/**',
    '!**/coverage/**',
    '!**/.next/**',
    '!**/build/**',
    '!**/dist/**',
    '!**/public/**',
    '!**/styles/**',
    '!**/unrest_app/**', // Exclude legacy directory
    // Exclude specific files
    '!app/layout.tsx', // Layout files are hard to test meaningfully
    '!app/loading.tsx',
    '!app/error.tsx',
    '!app/not-found.tsx',
    '!app/global-error.tsx',
    '!**/index.ts', // Exclude barrel exports
    '!**/middleware.ts', // Middleware is tested in E2E
    '!next.config.js',
    '!tailwind.config.js',
    '!postcss.config.js',
    '!jest.config.js',
    '!playwright.config.ts',
  ],
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'json-summary',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Higher standards for critical components
    'lib/ai/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'lib/supabase/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'app/api/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/supabase/',
    '<rootDir>/e2e/',
    '<rootDir>/coverage/',
    '<rootDir>/test-results/',
    '<rootDir>/playwright-report/',
    '<rootDir>/unrest_app/',
    '<rootDir>/src-tauri/',
    // Exclude Playwright tests from Jest
    '<rootDir>/__tests__/e2e/',
    '\\.spec\\.(ts|tsx)$',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(openai|@anthropic-ai/sdk|@supabase/.*|@heroui/.*|msw/.*|p-retry/.*)/)/',
  ],
  testMatch: [
    '**/__tests__/**/*.(test).{js,jsx,ts,tsx}',
    '**/*.(test).{js,jsx,ts,tsx}',
  ],
  testTimeout: 15000, // 15 seconds for tests
  maxWorkers: process.env.CI ? 1 : '50%', // Optimize for CI
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  // Prevent haste collision with unrest_app
  haste: {
    forceNodeFilesystemAPI: true,
  },
  // Node.js environment setup for ES modules
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)