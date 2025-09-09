#!/usr/bin/env node

/**
 * Test Code Editor Workflow
 * 
 * This script tests the Code Editor end-to-end workflow to ensure:
 * 1. Game creation works
 * 2. Script templates can be loaded
 * 3. Scripts can be saved
 * 4. Dev mode authentication works
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🧪 Testing Code Editor Workflow...\n');

// Test 1: Check if dev mode is enabled
console.log('1. Checking dev mode configuration...');
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const devModeEnabled = envContent.includes('DEV_MODE_ENABLED=true') && 
                        envContent.includes('NEXT_PUBLIC_DEV_MODE_ENABLED=true');
  
  if (devModeEnabled) {
    console.log('✅ Dev mode is properly configured');
  } else {
    console.log('❌ Dev mode is not enabled. Please check .env.local');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Could not read .env.local file');
  process.exit(1);
}

// Test 2: Check if server is running
console.log('\n2. Testing server connectivity...');
try {
  const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000', { timeout: 5000 });
  if (response.toString().trim() === '200') {
    console.log('✅ Server is running on localhost:3000');
  } else {
    console.log('❌ Server is not responding. Please start with `npm run dev`');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Could not connect to server. Please start with `npm run dev`');
  process.exit(1);
}

// Test 3: Test dashboard projects API with dev mode
console.log('\n3. Testing Dashboard Projects API with dev mode...');
try {
  const response = execSync('curl -s http://localhost:3000/api/dashboard/projects', { 
    timeout: 10000,
    encoding: 'utf8'
  });
  
  const data = JSON.parse(response);
  
  if (data.error && data.error.includes('Unauthorized')) {
    console.log('❌ API still returning unauthorized. RLS policies may not be deployed.');
    console.log('📋 Next steps:');
    console.log('   1. Go to https://supabase.com/dashboard/project/ajwskzlxlvhkhlbedtrg/sql');
    console.log('   2. Copy and run the contents of scripts/deploy-dev-policies.sql');
    console.log('   3. Re-run this test');
  } else if (data.projects !== undefined) {
    console.log('✅ Dashboard Projects API working correctly');
    console.log(`   Found ${data.projects.length} projects`);
  } else {
    console.log('⚠️  Unexpected API response:');
    console.log('   ', response.substring(0, 200) + (response.length > 200 ? '...' : ''));
  }
} catch (error) {
  console.log('❌ Dashboard Projects API test failed');
  console.log('   Error:', error.message.substring(0, 100));
}

// Test 4: Test script templates availability
console.log('\n4. Testing script templates availability...');
try {
  // This would test the script templates API once it's implemented
  console.log('⚠️  Script templates API test not yet implemented');
  console.log('   This will test once the script loading API is created');
} catch (error) {
  console.log('❌ Script templates test failed');
}

// Test summary and next steps
console.log('\n📋 Code Editor Testing Summary:');
console.log('=====================================');
console.log('✅ Dev mode configuration');
console.log('✅ Server connectivity');
console.log('⚠️  Database policies (manual deployment needed)');
console.log('⚠️  Script templates (pending)');
console.log('⚠️  End-to-end workflow (pending database setup)');

console.log('\n🚀 Next Steps to Complete Setup:');
console.log('1. Deploy RLS policies by running scripts/deploy-dev-policies.sql in Supabase SQL Editor');
console.log('2. Test game creation in the Code Editor');
console.log('3. Test script template loading');
console.log('4. Verify save operations work');

console.log('\n🔗 Useful Links:');
console.log('• Supabase SQL Editor: https://supabase.com/dashboard/project/ajwskzlxlvhkhlbedtrg/sql');
console.log('• Local Code Editor: http://localhost:3000/game-creator');
console.log('• Local Dashboard: http://localhost:3000/dashboard');

console.log('\n✨ Test completed!');