-- ============================================================================
-- Phase 5: Agentic AI System Schema
-- ============================================================================
-- This migration adds support for AI agent actions, tool execution,
-- and Google API integration
-- ============================================================================

-- Step 1: Create OAuth tokens table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'github')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  scope TEXT[], -- Array of granted scopes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_provider 
ON user_oauth_tokens(user_id, provider);

-- Step 2: Create agent actions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'send_email', 'book_calendar', 'check_calendar', etc.
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'executing', 'executed', 'failed', 'cancelled')
  ),
  input_params JSONB NOT NULL, -- Input parameters for the action
  output_result JSONB, -- Result of execution
  error_message TEXT,
  requires_approval BOOLEAN DEFAULT TRUE,
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  execution_duration_ms INTEGER, -- Time taken to execute (milliseconds)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_actions_user_id ON agent_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_conversation_id ON agent_actions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON agent_actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_created_at ON agent_actions(created_at DESC);

-- Step 3: Create user agent preferences table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_agent_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  auto_approve_actions TEXT[] DEFAULT ARRAY['check_calendar', 'get_team_members', 'get_vacation_policy'], -- Actions that don't need approval
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

-- Step 4: Create action templates table (for common workflows)
-- ============================================================================

CREATE TABLE IF NOT EXISTS action_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  workflow JSONB NOT NULL, -- Array of actions to execute
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example template for vacation request
INSERT INTO action_templates (name, description, workflow, is_public) VALUES (
  'vacation_request',
  'Complete workflow for requesting vacation: check team calendar, book event, email supervisor',
  '[
    {
      "step": 1,
      "action": "check_calendar",
      "description": "Check team calendar for conflicts",
      "required": true
    },
    {
      "step": 2,
      "action": "book_calendar_event",
      "description": "Book vacation on personal calendar",
      "required": true,
      "requires_approval": true
    },
    {
      "step": 3,
      "action": "send_email",
      "description": "Email supervisor for approval",
      "required": true,
      "requires_approval": true
    }
  ]'::JSONB,
  TRUE
);

-- Step 5: Enable Row Level Security
-- ============================================================================

ALTER TABLE user_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_agent_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_templates ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS Policies
-- ============================================================================

-- OAuth Tokens: Users can only access their own tokens
CREATE POLICY "Users can manage own oauth tokens"
ON user_oauth_tokens FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Agent Actions: Users can view and manage their own actions
CREATE POLICY "Users can view own actions"
ON agent_actions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own actions"
ON agent_actions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own actions"
ON agent_actions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own actions"
ON agent_actions FOR DELETE
USING (auth.uid() = user_id);

-- Agent Preferences: Users can manage their own preferences
CREATE POLICY "Users can manage own preferences"
ON user_agent_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Action Templates: Public templates visible to all, private to owner
CREATE POLICY "Users can view public templates"
ON action_templates FOR SELECT
USING (is_public = TRUE OR created_by = auth.uid());

CREATE POLICY "Users can create own templates"
ON action_templates FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own templates"
ON action_templates FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Step 7: Create helper functions
-- ============================================================================

-- Function to get user's pending actions
CREATE OR REPLACE FUNCTION get_user_pending_actions(user_uuid UUID)
RETURNS SETOF agent_actions AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM agent_actions
  WHERE user_id = user_uuid
    AND status = 'pending'
    AND requires_approval = TRUE
  ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get action statistics
CREATE OR REPLACE FUNCTION get_user_action_stats(user_uuid UUID)
RETURNS TABLE(
  total_actions BIGINT,
  pending_actions BIGINT,
  executed_actions BIGINT,
  failed_actions BIGINT,
  avg_execution_time_ms NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_actions,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_actions,
    COUNT(*) FILTER (WHERE status = 'executed') as executed_actions,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_actions,
    AVG(execution_duration_ms) as avg_execution_time_ms
  FROM agent_actions
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old actions (>90 days)
CREATE OR REPLACE FUNCTION cleanup_old_actions(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM agent_actions
  WHERE user_id = auth.uid()
    AND created_at < NOW() - (days_old || ' days')::INTERVAL
    AND status IN ('executed', 'cancelled', 'failed');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create triggers
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
DROP TRIGGER IF EXISTS update_oauth_tokens_updated_at ON user_oauth_tokens;
CREATE TRIGGER update_oauth_tokens_updated_at
  BEFORE UPDATE ON user_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_preferences_updated_at ON user_agent_preferences;
CREATE TRIGGER update_agent_preferences_updated_at
  BEFORE UPDATE ON user_agent_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-create agent preferences on user signup
CREATE OR REPLACE FUNCTION create_default_agent_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_agent_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_agent_prefs ON auth.users;
CREATE TRIGGER on_user_created_agent_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_agent_preferences();

-- Step 9: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON user_oauth_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agent_actions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_agent_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON action_templates TO authenticated;

GRANT ALL ON user_oauth_tokens TO service_role;
GRANT ALL ON agent_actions TO service_role;
GRANT ALL ON user_agent_preferences TO service_role;
GRANT ALL ON action_templates TO service_role;

-- Step 10: Create views for easier querying
-- ============================================================================

-- View for recent actions with user details
CREATE OR REPLACE VIEW user_actions_summary AS
SELECT 
  aa.id,
  aa.user_id,
  aa.conversation_id,
  aa.action_type,
  aa.status,
  aa.requires_approval,
  aa.created_at,
  aa.executed_at,
  aa.execution_duration_ms,
  up.display_name as user_name,
  c.title as conversation_title
FROM agent_actions aa
LEFT JOIN user_profiles up ON aa.user_id = up.id
LEFT JOIN conversations c ON aa.conversation_id = c.id;

-- Grant view access
GRANT SELECT ON user_actions_summary TO authenticated;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check if tables were created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name IN ('user_oauth_tokens', 'agent_actions', 'user_agent_preferences', 'action_templates');

-- Check RLS policies
-- SELECT tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE tablename IN ('user_oauth_tokens', 'agent_actions', 'user_agent_preferences');

-- Check triggers
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE event_object_table IN ('user_oauth_tokens', 'agent_actions');

-- ============================================================================
-- Migration Complete!
-- ============================================================================
-- Next steps:
-- 1. Install googleapis package: npm install googleapis
-- 2. Set up Google Cloud Project and OAuth credentials
-- 3. Implement tool executor service
-- 4. Implement agent service with function calling
-- 5. Add frontend UI for action approvals
-- ============================================================================







