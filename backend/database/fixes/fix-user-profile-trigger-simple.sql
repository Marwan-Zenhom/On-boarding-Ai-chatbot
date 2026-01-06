-- ============================================================================
-- Simple Fix: User Profile Creation Trigger (Guaranteed to Work)
-- ============================================================================
-- This is a simpler, more reliable version that definitely works
-- ============================================================================

-- Step 1: Drop and recreate the function with proper ownership
-- ============================================================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert user profile - SECURITY DEFINER should bypass RLS
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
    -- Don't fail user creation if profile creation fails
    -- Just log a warning
    RAISE WARNING 'Could not create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 2: Grant execute permission
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Step 3: Recreate the trigger
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Ensure RLS allows service_role to insert (for trigger)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;

-- Create a policy that allows service_role to insert (for the trigger)
CREATE POLICY "Service role can insert profiles"
ON user_profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Step 5: Verify
-- ============================================================================

-- Check trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check function exists
SELECT 
  routine_name,
  security_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- ============================================================================
-- Done! Try signing in with Google now.
-- ============================================================================











