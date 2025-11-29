-- ============================================================================
-- Setup Messages Table RLS for User Data Isolation
-- ============================================================================
-- This ensures users can only access messages from their own conversations
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Enable Row Level Security on messages table
-- ============================================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can create own messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
DROP POLICY IF EXISTS "Allow all for single user" ON messages;

-- Step 3: Create RLS Policies for messages
-- ============================================================================

-- Policy: Users can view messages only from their own conversations
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);

-- Policy: Users can insert messages only to their own conversations
CREATE POLICY "Users can create own messages"
ON messages FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);

-- Policy: Users can update messages only from their own conversations
CREATE POLICY "Users can update own messages"
ON messages FOR UPDATE
USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);

-- Policy: Users can delete messages only from their own conversations
CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);

-- Step 4: Grant permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;
GRANT ALL ON messages TO service_role;

-- Step 5: Verify RLS is enabled and policies exist
-- ============================================================================
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
WHERE tablename = 'messages'
ORDER BY policyname;

-- Step 6: Verify conversations RLS policies exist
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'conversations'
ORDER BY policyname;

