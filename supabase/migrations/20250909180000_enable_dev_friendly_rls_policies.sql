-- Enable Development-Friendly RLS Policies for Code Editor Testing
-- This migration creates temporary RLS policies that allow dev mode operations
-- WARNING: This should only be applied in development environments

-- Create dev-friendly policy for games table
DROP POLICY IF EXISTS "Users can manage their own games" ON games;
CREATE POLICY "Enable all operations for development" ON games
FOR ALL
USING (
  -- Allow dev user ID specifically (from dev-mode.ts)
  auth.uid()::text = '00000000-0000-4000-8000-000000000001'
  OR
  -- Allow normal user operations
  auth.uid() = creator_id
  OR
  -- Allow if no auth context (for debugging)
  auth.uid() IS NULL
);

-- Create dev-friendly policy for profiles table
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile or dev mode" ON profiles
FOR ALL
USING (
  auth.uid() = id 
  OR 
  auth.uid()::text = '00000000-0000-4000-8000-000000000001'
  OR
  id::text = '00000000-0000-4000-8000-000000000001'
);

-- Create dev-friendly policy for game_scripts table
DROP POLICY IF EXISTS "Users can modify own scripts" ON game_scripts;
CREATE POLICY "Users can modify own scripts or dev mode" ON game_scripts
FOR ALL
USING (
  auth.uid() = creator_id
  OR
  auth.uid()::text = '00000000-0000-4000-8000-000000000001'
  OR
  creator_id::text = '00000000-0000-4000-8000-000000000001'
);

-- Create dev-friendly policy for game_assets table
DROP POLICY IF EXISTS "Users can modify own assets" ON game_assets;
CREATE POLICY "Users can modify own assets or dev mode" ON game_assets
FOR ALL
USING (
  auth.uid() = creator_id
  OR
  auth.uid()::text = '00000000-0000-4000-8000-000000000001'
  OR
  creator_id::text = '00000000-0000-4000-8000-000000000001'
);

-- Ensure the dev user profile exists
INSERT INTO profiles (
  id,
  username,
  display_name,
  bio,
  subscription_tier,
  subscription_status,
  credits_remaining,
  is_verified,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-4000-8000-000000000001',
  'dev_creator',
  'GameGen Developer',
  'Development user for testing GameGen platform features',
  'max',
  'active',
  999999,
  true,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_status = EXCLUDED.subscription_status,
  credits_remaining = EXCLUDED.credits_remaining,
  is_verified = EXCLUDED.is_verified,
  updated_at = now();

-- Add helpful comment explaining these policies
COMMENT ON POLICY "Enable all operations for development" ON games 
IS 'Development-friendly policy that allows dev mode user and debugging. Remove in production.';

COMMENT ON POLICY "Users can update own profile or dev mode" ON profiles 
IS 'Development-friendly policy that allows dev mode user operations. Remove in production.';

COMMENT ON POLICY "Users can modify own scripts or dev mode" ON game_scripts 
IS 'Development-friendly policy that allows dev mode user operations. Remove in production.';

COMMENT ON POLICY "Users can modify own assets or dev mode" ON game_assets 
IS 'Development-friendly policy that allows dev mode user operations. Remove in production.';