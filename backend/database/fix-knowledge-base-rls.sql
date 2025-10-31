-- ============================================================
-- FIX KNOWLEDGE BASE RLS POLICIES
-- Allow everyone to READ the knowledge base (it's public info)
-- ============================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON knowledge_base;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON knowledge_base;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON knowledge_base;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON knowledge_base;

-- Allow EVERYONE to read the knowledge base (it's public onboarding info)
CREATE POLICY "Allow public read access to knowledge base"
ON knowledge_base
FOR SELECT
TO public
USING (true);

-- Only allow admin operations (inserts) with service role
-- (This is handled at the application level with supabaseAdmin client)
-- No need for INSERT/UPDATE/DELETE policies since we use service role

-- Verify RLS is enabled
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;







