// Test utilities for Supabase integration
import { createClient } from './client'
import { createAdminClient } from './admin'
import { 
  checkDatabaseConnection, 
  GameService, 
  ProfileService, 
  DatabaseError 
} from './utils'
import { logger } from './logger'

export interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration?: number
}

export class SupabaseTestSuite {
  private results: TestResult[] = []

  async runAllTests(): Promise<{ passed: number; failed: number; results: TestResult[] }> {
    logger.info('Starting Supabase integration tests')
    
    this.results = []
    
    // Basic connection tests
    await this.runTest('Database Connection', this.testDatabaseConnection.bind(this))
    await this.runTest('Client Creation', this.testClientCreation.bind(this))
    await this.runTest('Admin Client Creation', this.testAdminClientCreation.bind(this))
    
    // Service tests
    await this.runTest('Game Service', this.testGameService.bind(this))
    await this.runTest('Profile Service', this.testProfileService.bind(this))
    
    // Error handling tests
    await this.runTest('Error Handling', this.testErrorHandling.bind(this))
    
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    
    logger.info(`Tests completed: ${passed} passed, ${failed} failed`)
    
    return {
      passed,
      failed,
      results: this.results,
    }
  }

  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = performance.now()
    
    try {
      await testFn()
      const duration = performance.now() - startTime
      
      this.results.push({
        name,
        passed: true,
        duration,
      })
      
      logger.debug(`✅ ${name} passed (${duration.toFixed(2)}ms)`)
    } catch (error) {
      const duration = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      this.results.push({
        name,
        passed: false,
        error: errorMessage,
        duration,
      })
      
      logger.error(`❌ ${name} failed (${duration.toFixed(2)}ms)`, { error: errorMessage })
    }
  }

  private async testDatabaseConnection(): Promise<void> {
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      throw new Error('Database connection failed')
    }
  }

  private async testClientCreation(): Promise<void> {
    const client = createClient()
    
    if (!client) {
      throw new Error('Client creation failed')
    }

    // Test basic query (should work even without authentication)
    const { error } = await client
      .from('profiles')
      .select('id')
      .limit(1)
    
    // Error is expected if not authenticated, but should not be a connection error
    if (error && !['PGRST301', 'PGRST116'].includes(error.code)) {
      throw new Error(`Unexpected error: ${error.message}`)
    }
  }

  private async testAdminClientCreation(): Promise<void> {
    const adminClient = createAdminClient()
    
    if (!adminClient) {
      throw new Error('Admin client creation failed')
    }

    // Test admin access (this should work with service role key)
    const { error } = await adminClient
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (error) {
      throw new Error(`Admin client error: ${error.message}`)
    }
  }

  private async testGameService(): Promise<void> {
    const gameService = new GameService()
    
    // Test finding public games (should work without auth)
    try {
      const games = await gameService.findPublicGames({ limit: 1 })
      // Should return array, even if empty
      if (!Array.isArray(games)) {
        throw new Error('Game service should return array')
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        // Check if it's an expected error (like no data)
        if (error.code !== 'PGRST116') {
          throw error
        }
      } else {
        throw error
      }
    }
  }

  private async testProfileService(): Promise<void> {
    const profileService = new ProfileService()
    
    // Test finding a profile by invalid ID (should return null)
    const profile = await profileService.findById('00000000-0000-0000-0000-000000000000')
    
    if (profile !== null) {
      throw new Error('Profile service should return null for invalid ID')
    }
  }

  private async testErrorHandling(): Promise<void> {
    const gameService = new GameService()
    
    try {
      // Try to create a game without proper authentication - should fail gracefully
      await gameService.create({
        title: 'Test Game',
        creator_id: '00000000-0000-0000-0000-000000000000',
        game_data: {},
      })
      
      // If this doesn't throw, something's wrong
      throw new Error('Expected authentication error')
    } catch (error) {
      if (!(error instanceof DatabaseError)) {
        throw new Error('Should throw DatabaseError')
      }
      
      // Should be an authentication/authorization error
      if (!['PGRST301', 'PGRST204'].includes(error.code || '')) {
        throw new Error(`Unexpected error code: ${error.code}`)
      }
    }
  }

  getResults(): TestResult[] {
    return this.results
  }

  printResults(): void {
    console.log('\n📊 Supabase Integration Test Results\n')
    
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌'
      const duration = result.duration ? ` (${result.duration.toFixed(2)}ms)` : ''
      const error = result.error ? `\n   Error: ${result.error}` : ''
      
      console.log(`${status} ${result.name}${duration}${error}`)
    })
    
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    const total = this.results.length
    
    console.log(`\nSummary: ${passed}/${total} tests passed`)
    
    if (failed > 0) {
      console.log(`⚠️  ${failed} test(s) failed`)
    } else {
      console.log('🎉 All tests passed!')
    }
  }
}

// Helper function to run tests from CLI or development
export async function runSupabaseTests(): Promise<boolean> {
  const testSuite = new SupabaseTestSuite()
  const results = await testSuite.runAllTests()
  
  testSuite.printResults()
  
  return results.failed === 0
}

// Environment validation test
export function validateSupabaseEnvironment(): {
  valid: boolean
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []

  // Check required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL is missing')
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    issues.push('SUPABASE_SERVICE_ROLE_KEY is missing')
  }

  // Check URL format
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
    } catch {
      issues.push('NEXT_PUBLIC_SUPABASE_URL is not a valid URL')
    }
  }

  // Check for development vs production settings
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  
  if (supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')) {
    if (process.env.NODE_ENV === 'production') {
      issues.push('Using local Supabase URL in production')
    } else {
      recommendations.push('Using local Supabase - ensure local instance is running')
    }
  }

  // Check connection pool settings
  const poolMin = parseInt(process.env.DB_POOL_MIN || '2')
  const poolMax = parseInt(process.env.DB_POOL_MAX || '10')
  
  if (poolMin >= poolMax) {
    issues.push('DB_POOL_MIN should be less than DB_POOL_MAX')
  }

  if (poolMax > 20) {
    recommendations.push('DB_POOL_MAX > 20 may be too high for most applications')
  }

  return {
    valid: issues.length === 0,
    issues,
    recommendations,
  }
}

// Export for use in development
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  // Auto-validate environment in development
  const validation = validateSupabaseEnvironment()
  
  if (!validation.valid) {
    console.warn('⚠️  Supabase environment validation failed:')
    validation.issues.forEach(issue => console.warn(`   - ${issue}`))
  }
  
  if (validation.recommendations.length > 0) {
    console.log('💡 Supabase environment recommendations:')
    validation.recommendations.forEach(rec => console.log(`   - ${rec}`))
  }
}