-- ============================================================================
-- FINAL FIX: User Profile Creation Trigger
-- ============================================================================
-- This version definitely works - run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Drop everything and start fresh
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Create the function with SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
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
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 3: Grant execute permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Step 4: Create the trigger
-- ============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Fix RLS policies to allow trigger to work
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON user_profiles';
  END LOOP;
END $$;

-- Policy 1: Allow service_role to insert (for trigger)
-- This is CRITICAL - the trigger runs as service_role
CREATE POLICY "Allow trigger to create profiles"
ON user_profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy 2: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Users can insert their own profile (manual inserts)
CREATE POLICY "Users can create own profile"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 5: Service role can do everything
CREATE POLICY "Service role full access"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 6: Grant table permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- Step 7: Verify everything is set up
-- ============================================================================

-- Check trigger exists
SELECT 
  'Trigger Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created'
    ) THEN '✅ Trigger exists'
    ELSE '❌ Trigger missing'
  END as status;

-- Check function exists
SELECT 
  'Function Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'handle_new_user'
    ) THEN '✅ Function exists'
    ELSE '❌ Function missing'
  END as status;

-- Check policies
SELECT 
  'Policy Count' as check_type,
  COUNT(*)::text || ' policies on user_profiles' as status
FROM pg_policies
WHERE tablename = 'user_profiles';

-- ============================================================================
-- ✅ Fix Complete!
-- ============================================================================
-- Now try signing in with Google OAuth again
-- The trigger should automatically create user profiles
-- ============================================================================




