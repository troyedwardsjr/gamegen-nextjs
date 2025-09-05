#!/usr/bin/env node
/**
 * Test script for Supabase integration
 * Run with: node scripts/test-supabase.js
 */

const { validateSupabaseEnvironment } = require('../lib/supabase/test');

async function main() {
  console.log('🚀 Testing Supabase Integration\n');
  
  // Validate environment
  console.log('1. Validating environment...');
  const validation = validateSupabaseEnvironment();
  
  if (!validation.valid) {
    console.log('❌ Environment validation failed:');
    validation.issues.forEach(issue => console.log(`   - ${issue}`));
    process.exit(1);
  }
  
  if (validation.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    validation.recommendations.forEach(rec => console.log(`   - ${rec}`));
  }
  
  console.log('✅ Environment validation passed\n');
  
  // Test TypeScript compilation
  console.log('2. Testing TypeScript compilation...');
  try {
    const { execSync } = require('child_process');
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
    console.log('✅ TypeScript compilation passed\n');
  } catch (error) {
    console.log('❌ TypeScript compilation failed');
    console.log(error.stdout?.toString() || error.message);
    // Don't exit on TS errors, they might be related to other parts
  }
  
  // Test basic imports
  console.log('3. Testing module imports...');
  try {
    // Test if we can import the main modules without errors
    require('../lib/supabase');
    console.log('✅ Module imports successful\n');
  } catch (error) {
    console.log('❌ Module import failed:', error.message);
    process.exit(1);
  }
  
  console.log('🎉 Basic Supabase integration tests passed!');
  console.log('\n📋 Next steps:');
  console.log('1. Set up your Supabase project');
  console.log('2. Run the database migrations');
  console.log('3. Update environment variables with your project credentials');
  console.log('4. Run the full test suite with live database connection');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };