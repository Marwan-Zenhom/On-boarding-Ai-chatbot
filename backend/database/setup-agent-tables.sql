-- ============================================================================
-- Setup Agent Tables for Calendar/Email Functionality
-- ============================================================================
-- Run this in your Supabase SQL Editor to enable agent actions
-- ============================================================================

-- Step 1: Create agent_actions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'send_email', 'book_calendar_event', 'check_calendar', etc.
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'executing', 'executed', 'failed', 'cancelled')
  ),
  input_params JSONB NOT NULL,
  output_result JSONB,
  error_message TEXT,
  requires_approval BOOLEAN DEFAULT TRUE,
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  execution_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_actions_user_id ON agent_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_conversation_id ON agent_actions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON agent_actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_created_at ON agent_actions(created_at DESC);

-- Step 2: Create user_agent_preferences table
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

-- Step 3: Enable Row Level Security
-- ============================================================================
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_agent_preferences ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies
-- ============================================================================

-- Agent Actions Policies
DROP POLICY IF EXISTS "Users can view own actions" ON agent_actions;
CREATE POLICY "Users can view own actions"
ON agent_actions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own actions" ON agent_actions;
CREATE POLICY "Users can create own actions"
ON agent_actions FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own actions" ON agent_actions;
CREATE POLICY "Users can update own actions"
ON agent_actions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own actions" ON agent_actions;
CREATE POLICY "Users can delete own actions"
ON agent_actions FOR DELETE
USING (auth.uid() = user_id);

-- User Agent Preferences Policies
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_agent_preferences;
CREATE POLICY "Users can manage own preferences"
ON user_agent_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Step 5: Grant permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON agent_actions TO authenticated;
GRANT ALL ON agent_actions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON user_agent_preferences TO authenticated;
GRANT ALL ON user_agent_preferences TO service_role;

-- Step 6: Verify tables were created
-- ============================================================================
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_name IN ('agent_actions', 'user_agent_preferences')
ORDER BY table_name;

