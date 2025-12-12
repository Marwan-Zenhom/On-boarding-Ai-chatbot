-- ============================================================================
-- TEMPORARY FIX: Disable Trigger to Test
-- ============================================================================
-- Run this to temporarily disable the trigger and see if user creation works
-- If users can sign in after this, the trigger is the problem
-- ============================================================================

-- Disable the trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Verify it's gone
SELECT 
  'Trigger Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created'
    ) THEN '❌ Still exists'
    ELSE '✅ Disabled'
  END as status;

-- ============================================================================
-- After running this:
-- 1. Try signing in with Google
-- 2. If it works, the trigger was the problem
-- 3. If it still fails, the issue is elsewhere (Supabase Auth config)
-- ============================================================================




