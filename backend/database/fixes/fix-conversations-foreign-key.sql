-- ============================================================================
-- Fix conversations table foreign key constraint
-- ============================================================================
-- This fixes the foreign key constraint to point to auth.users instead of public.users
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Check for orphaned conversations (conversations with user_id not in auth.users)
-- ============================================================================
SELECT 
    c.id,
    c.user_id,
    c.title,
    c.created_at
FROM conversations c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE u.id IS NULL;

-- Step 2: Option A - Delete orphaned conversations (RECOMMENDED if you don't need old data)
-- ============================================================================
-- This will delete all conversations whose user_id doesn't exist in auth.users
DELETE FROM conversations
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 2: Option B - Update orphaned conversations to point to your current user (if you want to keep them)
-- ============================================================================
-- Uncomment and replace 'YOUR_CURRENT_USER_ID' with your actual auth.users id
-- UPDATE conversations
-- SET user_id = 'YOUR_CURRENT_USER_ID'::uuid
-- WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 3: Drop the old foreign key constraint (if it exists)
-- ============================================================================
ALTER TABLE conversations 
DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;

-- Step 4: Create the correct foreign key constraint pointing to auth.users
-- ============================================================================
ALTER TABLE conversations 
ADD CONSTRAINT conversations_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Step 4: Verify the constraint was created correctly
-- ============================================================================
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'conversations'
  AND kcu.column_name = 'user_id';

-- Expected result: foreign_table_name should be 'users' and foreign_column_name should be 'id'
-- The schema should be 'auth' (you can check with: SELECT table_schema FROM information_schema.tables WHERE table_name = 'users')

