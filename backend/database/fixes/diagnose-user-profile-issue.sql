-- ============================================================================
-- Diagnostic: Check User Profile Trigger Status
-- ============================================================================
-- Run this first to see what's wrong
-- ============================================================================

-- 1. Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check if function exists
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- 3. Check RLS status on user_profiles
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'user_profiles';

-- 4. Check RLS policies on user_profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles';

-- 5. Check if table exists and structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;











