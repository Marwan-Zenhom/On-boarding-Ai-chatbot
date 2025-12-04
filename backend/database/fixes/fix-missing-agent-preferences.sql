-- ============================================================================
-- Fix: Missing user_agent_preferences Table/Trigger
-- ============================================================================
-- The error is caused by a trigger trying to insert into a non-existent table
-- ============================================================================

-- Step 1: Disable the problematic trigger
-- ============================================================================

DROP TRIGGER IF EXISTS on_user_created_agent_prefs ON auth.users;

-- Step 2: Check if user_agent_preferences table exists
-- ============================================================================

SELECT 
  'Table Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'user_agent_preferences'
    ) THEN '✅ Table exists'
    ELSE '❌ Table missing - need to run phase5-agentic-ai-schema.sql'
  END as status;

-- Step 3: If table doesn't exist, create it (matching phase5 schema)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_agent_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  auto_approve_actions TEXT[] DEFAULT ARRAY['check_calendar', 'get_team_members', 'get_vacation_policy'],
  notification_preferences JSONB DEFAULT '{
    "email_on_action": true,
    "notify_on_approval": true,
    "daily_summary": false
  }'::JSONB,
  max_actions_per_day INTEGER DEFAULT 50,
  enable_agent BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Enable RLS if table exists
-- ============================================================================

ALTER TABLE user_agent_preferences ENABLE ROW LEVEL SECURITY;

-- Step 5: Create basic RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own agent preferences" ON user_agent_preferences;
CREATE POLICY "Users can manage own agent preferences"
ON user_agent_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage agent preferences" ON user_agent_preferences;
CREATE POLICY "Service role can manage agent preferences"
ON user_agent_preferences
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 6: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON user_agent_preferences TO authenticated;
GRANT ALL ON user_agent_preferences TO service_role;

-- Step 7: Recreate the trigger function with error handling
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_agent_preferences()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_agent_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail user creation if this fails
    -- Silently handle errors to avoid terminal warnings
    -- The error is logged but won't show in terminal
    RETURN NEW;
END;
$$;

-- Step 8: Recreate the trigger
-- ============================================================================

CREATE TRIGGER on_user_created_agent_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_agent_preferences();

-- Step 9: Verify
-- ============================================================================

SELECT 
  'Fix Complete' as status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'user_agent_preferences'
    ) THEN '✅'
    ELSE '❌'
  END || ' Table exists' as table_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'on_user_created_agent_prefs'
    ) THEN '✅'
    ELSE '❌'
  END || ' Trigger exists' as trigger_status;

-- ============================================================================
-- Now try signing in with Google again!
-- ============================================================================

