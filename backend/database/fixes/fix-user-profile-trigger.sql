-- ============================================================================
-- Fix: User Profile Creation Trigger
-- ============================================================================
-- This script fixes the "Database error saving new user" issue
-- that occurs when signing in with OAuth providers
-- ============================================================================

-- Step 1: Ensure user_profiles table exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Fix the trigger function with better error handling
-- ============================================================================

-- First, grant the function owner permission to bypass RLS
-- This ensures SECURITY DEFINER works properly
ALTER TABLE user_profiles OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY DEFINER runs as the function owner (postgres/supabase_admin)
  -- This should bypass RLS, but we'll use explicit schema qualification
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email,
      'User'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    display_name = COALESCE(
      EXCLUDED.display_name,
      user_profiles.display_name
    ),
    avatar_url = COALESCE(
      EXCLUDED.avatar_url,
      user_profiles.avatar_url
    ),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    -- This allows users to sign in even if profile creation fails
    RAISE WARNING 'Error creating user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Step 3: Recreate the trigger
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Ensure RLS policies allow the trigger to work
-- ============================================================================

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can manage user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Bypass RLS for trigger" ON user_profiles;

-- IMPORTANT: Policy that allows the trigger function to insert
-- This policy allows inserts when the function is called (SECURITY DEFINER)
CREATE POLICY "Bypass RLS for trigger"
ON user_profiles
FOR INSERT
TO postgres, service_role
WITH CHECK (true);

-- Policy: Users can view only their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update only their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile (for manual inserts)
CREATE POLICY "Users can create own profile"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Service role can manage all profiles
CREATE POLICY "Service role can manage user profiles"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 5: Grant necessary permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- Step 6: Verify the trigger exists
-- ============================================================================

-- Run this query to verify:
-- SELECT trigger_name, event_manipulation, event_object_table, action_statement
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';

-- ============================================================================
-- Fix Complete!
-- ============================================================================
-- After running this script:
-- 1. Try signing in with Google OAuth again
-- 2. The user profile should be created automatically
-- 3. Check the user_profiles table to verify: SELECT * FROM user_profiles;
-- ============================================================================

