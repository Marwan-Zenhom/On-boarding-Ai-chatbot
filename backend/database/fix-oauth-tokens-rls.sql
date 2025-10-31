-- ============================================================
-- FIX OAUTH TOKENS RLS POLICIES
-- Allow users to manage their own OAuth tokens
-- ============================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert their own tokens" ON user_oauth_tokens;
DROP POLICY IF EXISTS "Users can view their own tokens" ON user_oauth_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON user_oauth_tokens;
DROP POLICY IF EXISTS "Users can delete their own tokens" ON user_oauth_tokens;

-- Allow users to insert their own OAuth tokens
CREATE POLICY "Allow users to insert their own OAuth tokens"
ON user_oauth_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own OAuth tokens
CREATE POLICY "Allow users to view their own OAuth tokens"
ON user_oauth_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own OAuth tokens
CREATE POLICY "Allow users to update their own OAuth tokens"
ON user_oauth_tokens
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own OAuth tokens
CREATE POLICY "Allow users to delete their own OAuth tokens"
ON user_oauth_tokens
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Verify RLS is enabled
ALTER TABLE user_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'user_oauth_tokens';







