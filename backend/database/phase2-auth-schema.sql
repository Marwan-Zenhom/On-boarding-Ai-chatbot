-- ============================================================================
-- Phase 2: Multi-User Authentication Schema
-- ============================================================================
-- This migration adds user authentication support using Supabase Auth
-- and implements Row Level Security (RLS) for data isolation
-- ============================================================================

-- Step 1: Add user_id and updated_at to conversations table
-- ============================================================================

-- Add user_id column
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add updated_at column if it doesn't exist
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- Set default user_id for existing conversations (temporary, will be updated)
-- This allows migration without breaking existing data
UPDATE conversations 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Make user_id required for new conversations
ALTER TABLE conversations 
ALTER COLUMN user_id SET NOT NULL;

-- Step 2: Enable Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on knowledge_base table (already isolated, but adding for consistency)
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies for conversations
-- ============================================================================

-- Policy: Users can view only their own conversations
CREATE POLICY "Users can view own conversations"
ON conversations
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert conversations for themselves only
CREATE POLICY "Users can create own conversations"
ON conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update only their own conversations
CREATE POLICY "Users can update own conversations"
ON conversations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete only their own conversations
CREATE POLICY "Users can delete own conversations"
ON conversations
FOR DELETE
USING (auth.uid() = user_id);

-- Step 4: Knowledge Base Access (all users can read, no write)
-- ============================================================================

-- Policy: All authenticated users can read knowledge base
CREATE POLICY "Authenticated users can read knowledge base"
ON knowledge_base
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only service role can insert/update knowledge base
CREATE POLICY "Service role can manage knowledge base"
ON knowledge_base
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 5: Create user profiles table (optional, for additional user data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

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

-- Policy: Users can insert their own profile
CREATE POLICY "Users can create own profile"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Step 6: Create function to automatically create user profile on signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Create helper functions
-- ============================================================================

-- Function to get current user's conversation count
CREATE OR REPLACE FUNCTION get_user_conversation_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM conversations
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old conversations (optional)
-- Only works if updated_at column exists
CREATE OR REPLACE FUNCTION cleanup_old_conversations(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
  has_updated_at BOOLEAN;
BEGIN
  -- Check if updated_at column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'updated_at'
  ) INTO has_updated_at;
  
  IF has_updated_at THEN
    DELETE FROM conversations
    WHERE user_id = auth.uid()
      AND updated_at < NOW() - (days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
  ELSE
    -- If no updated_at, delete based on created_at
    DELETE FROM conversations
    WHERE user_id = auth.uid()
      AND created_at < NOW() - (days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Grant necessary permissions
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated;
GRANT SELECT ON knowledge_base TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;

-- Grant access to service role (for admin operations)
GRANT ALL ON conversations TO service_role;
GRANT ALL ON knowledge_base TO service_role;
GRANT ALL ON user_profiles TO service_role;

-- Step 9: Create indexes for performance
-- ============================================================================

-- Index on user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);

-- Composite index for conversations filtering and sorting
-- Only create if updated_at column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'updated_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_user_updated 
    ON conversations(user_id, updated_at DESC);
  END IF;
END $$;

-- Step 10: Add updated_at trigger for user_profiles
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Verification Queries (Run these to verify the migration)
-- ============================================================================

-- Check if user_id column exists
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'conversations' AND column_name = 'user_id';

-- Check RLS policies
-- SELECT tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('conversations', 'knowledge_base', 'user_profiles');

-- Check if user_profiles table exists
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_name = 'user_profiles';

-- ============================================================================
-- Rollback Script (if needed)
-- ============================================================================

-- To rollback this migration (use with caution):
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
-- DROP FUNCTION IF EXISTS handle_new_user();
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP FUNCTION IF EXISTS get_user_conversation_count();
-- DROP FUNCTION IF EXISTS cleanup_old_conversations(INTEGER);
-- DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
-- DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
-- DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
-- DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
-- DROP POLICY IF EXISTS "Authenticated users can read knowledge base" ON knowledge_base;
-- DROP POLICY IF EXISTS "Service role can manage knowledge base" ON knowledge_base;
-- DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
-- DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
-- DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
-- DROP TABLE IF EXISTS user_profiles;
-- ALTER TABLE conversations DROP COLUMN IF EXISTS user_id;
-- ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE knowledge_base DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Migration Complete!
-- ============================================================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Enable Email Auth in Supabase Dashboard (Authentication > Providers)
-- 3. Configure OAuth providers (Google, Microsoft) in Supabase
-- 4. Update backend code to use user_id from JWT
-- 5. Update frontend to add authentication
-- ============================================================================

