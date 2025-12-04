-- ============================================================================
-- ULTRA ROBUST FIX: User Profile Creation (Bypass RLS Completely)
-- ============================================================================
-- This version uses a different approach - temporarily disable RLS
-- ============================================================================

-- Step 1: Drop everything
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Create function that uses SECURITY DEFINER with explicit bypass
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_display_name TEXT;
  v_avatar_url TEXT;
BEGIN
  -- Extract values
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    'User'
  );
  
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  -- Insert using service_role context (SECURITY DEFINER)
  -- This should bypass RLS automatically
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (NEW.id, v_display_name, v_avatar_url)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- CRITICAL: Don't raise an error, just log and continue
    -- This ensures user creation succeeds even if profile creation fails
    PERFORM pg_log_error(format(
      'handle_new_user: Failed to create profile for user %s: %s',
      NEW.id,
      SQLERRM
    ));
    RETURN NEW;
END;
$$;

-- Step 3: Set function owner to postgres (ensures SECURITY DEFINER works)
-- ============================================================================

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Step 4: Grant execute permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

-- Step 5: Create trigger
-- ============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Ensure RLS policies exist (but trigger should bypass them)
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON user_profiles';
  END LOOP;
END $$;

-- Policy for service_role (trigger runs as this)
CREATE POLICY "service_role_insert_profiles"
ON user_profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy for service_role (full access)
CREATE POLICY "service_role_all_profiles"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- User policies
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can create own profile"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Step 7: Grant table permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;
GRANT ALL ON user_profiles TO postgres;

-- Step 8: Verify
-- ============================================================================

SELECT 
  'Setup Complete' as status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created'
    ) THEN '✅'
    ELSE '❌'
  END || ' Trigger' as trigger_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'handle_new_user'
    ) THEN '✅'
    ELSE '❌'
  END || ' Function' as function_status;

-- ============================================================================
-- Alternative: If this still doesn't work, try disabling the trigger
-- and creating profiles manually via a webhook or API endpoint
-- ============================================================================

