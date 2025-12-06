-- ============================================================================
-- PHASE 6: HYBRID KNOWLEDGE BASE - RELATIONAL TABLES
-- ============================================================================
-- This script creates relational tables for structured employee, FAQ, and
-- onboarding task data alongside the existing vector embeddings.
-- Run this in Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE EMPLOYEES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS kb_employees (
  id TEXT PRIMARY KEY,  -- E001, E002...
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  role TEXT NOT NULL,
  manager_id TEXT,  -- Will add FK constraint after initial data load
  hire_date DATE,
  work_location TEXT,
  access_level TEXT DEFAULT 'Standard',
  preferred_language TEXT DEFAULT 'English',
  onboarding_status TEXT DEFAULT 'Not Started',
  required_tools TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add self-referential foreign key for manager
-- Note: We handle this carefully because managers must be inserted first
ALTER TABLE kb_employees 
  DROP CONSTRAINT IF EXISTS kb_employees_manager_id_fkey;

ALTER TABLE kb_employees 
  ADD CONSTRAINT kb_employees_manager_id_fkey 
  FOREIGN KEY (manager_id) REFERENCES kb_employees(id) 
  ON DELETE SET NULL;

-- ============================================================================
-- STEP 2: CREATE FAQS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS kb_faqs (
  id TEXT PRIMARY KEY,  -- F001, F002...
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty_level TEXT,
  context_tags TEXT[],
  last_updated DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for FAQ-Department relationship (many-to-many)
CREATE TABLE IF NOT EXISTS kb_faq_departments (
  faq_id TEXT NOT NULL REFERENCES kb_faqs(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  PRIMARY KEY (faq_id, department)
);

-- Junction table for FAQ-Role relationship (many-to-many)
CREATE TABLE IF NOT EXISTS kb_faq_roles (
  faq_id TEXT NOT NULL REFERENCES kb_faqs(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  PRIMARY KEY (faq_id, role)
);

-- ============================================================================
-- STEP 3: CREATE ONBOARDING TASKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS kb_onboarding_tasks (
  id TEXT PRIMARY KEY,  -- T001, T002...
  category TEXT NOT NULL,
  task_name TEXT NOT NULL,
  description TEXT,
  department TEXT,
  owner TEXT,
  priority TEXT,
  deadline TEXT,  -- "Day 1", "Week 1", etc.
  difficulty_level TEXT,
  status TEXT DEFAULT 'Not Started',
  last_updated DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for Task-Role relationship (many-to-many)
CREATE TABLE IF NOT EXISTS kb_task_roles (
  task_id TEXT NOT NULL REFERENCES kb_onboarding_tasks(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  PRIMARY KEY (task_id, role)
);

-- ============================================================================
-- STEP 4: CREATE INDEXES FOR FAST LOOKUPS
-- ============================================================================

-- Employees indexes
CREATE INDEX IF NOT EXISTS idx_kb_employees_email ON kb_employees(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_kb_employees_department ON kb_employees(department);
CREATE INDEX IF NOT EXISTS idx_kb_employees_role ON kb_employees(role);
CREATE INDEX IF NOT EXISTS idx_kb_employees_manager ON kb_employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_kb_employees_onboarding_status ON kb_employees(onboarding_status);

-- FAQs indexes
CREATE INDEX IF NOT EXISTS idx_kb_faqs_category ON kb_faqs(category);
CREATE INDEX IF NOT EXISTS idx_kb_faqs_difficulty ON kb_faqs(difficulty_level);

-- Junction table indexes
CREATE INDEX IF NOT EXISTS idx_kb_faq_departments_dept ON kb_faq_departments(department);
CREATE INDEX IF NOT EXISTS idx_kb_faq_roles_role ON kb_faq_roles(role);
CREATE INDEX IF NOT EXISTS idx_kb_task_roles_role ON kb_task_roles(role);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_kb_tasks_department ON kb_onboarding_tasks(department);
CREATE INDEX IF NOT EXISTS idx_kb_tasks_priority ON kb_onboarding_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_kb_tasks_deadline ON kb_onboarding_tasks(deadline);

-- ============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE kb_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_faq_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_faq_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_task_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read employees" ON kb_employees;
DROP POLICY IF EXISTS "Authenticated users can read faqs" ON kb_faqs;
DROP POLICY IF EXISTS "Authenticated users can read tasks" ON kb_onboarding_tasks;
DROP POLICY IF EXISTS "Authenticated users can read faq_departments" ON kb_faq_departments;
DROP POLICY IF EXISTS "Authenticated users can read faq_roles" ON kb_faq_roles;
DROP POLICY IF EXISTS "Authenticated users can read task_roles" ON kb_task_roles;
DROP POLICY IF EXISTS "Service role full access employees" ON kb_employees;
DROP POLICY IF EXISTS "Service role full access faqs" ON kb_faqs;
DROP POLICY IF EXISTS "Service role full access tasks" ON kb_onboarding_tasks;
DROP POLICY IF EXISTS "Service role full access faq_departments" ON kb_faq_departments;
DROP POLICY IF EXISTS "Service role full access faq_roles" ON kb_faq_roles;
DROP POLICY IF EXISTS "Service role full access task_roles" ON kb_task_roles;

-- Employees policies
CREATE POLICY "Authenticated users can read employees"
  ON kb_employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role full access employees"
  ON kb_employees FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- FAQs policies
CREATE POLICY "Authenticated users can read faqs"
  ON kb_faqs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role full access faqs"
  ON kb_faqs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Tasks policies
CREATE POLICY "Authenticated users can read tasks"
  ON kb_onboarding_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role full access tasks"
  ON kb_onboarding_tasks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Junction tables policies
CREATE POLICY "Authenticated users can read faq_departments"
  ON kb_faq_departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role full access faq_departments"
  ON kb_faq_departments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read faq_roles"
  ON kb_faq_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role full access faq_roles"
  ON kb_faq_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read task_roles"
  ON kb_task_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role full access task_roles"
  ON kb_task_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 7: CREATE SQL FUNCTIONS FOR PERSONALIZED QUERIES
-- ============================================================================

-- Function: Get employee with manager details by email
CREATE OR REPLACE FUNCTION get_employee_by_email(p_email TEXT)
RETURNS TABLE (
  employee JSON,
  manager JSON
) 
LANGUAGE sql 
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    row_to_json(e.*) as employee,
    row_to_json(m.*) as manager
  FROM kb_employees e
  LEFT JOIN kb_employees m ON e.manager_id = m.id
  WHERE LOWER(e.email) = LOWER(p_email);
$$;

-- Function: Get employee with manager details by ID
CREATE OR REPLACE FUNCTION get_employee_by_id(p_employee_id TEXT)
RETURNS TABLE (
  employee JSON,
  manager JSON
) 
LANGUAGE sql 
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    row_to_json(e.*) as employee,
    row_to_json(m.*) as manager
  FROM kb_employees e
  LEFT JOIN kb_employees m ON e.manager_id = m.id
  WHERE e.id = p_employee_id;
$$;

-- Function: Get FAQs relevant to an employee (by their department and role)
CREATE OR REPLACE FUNCTION get_faqs_for_employee(p_employee_id TEXT)
RETURNS SETOF kb_faqs
LANGUAGE sql 
STABLE
SECURITY DEFINER
AS $$
  SELECT DISTINCT f.*
  FROM kb_faqs f
  LEFT JOIN kb_faq_departments fd ON f.id = fd.faq_id
  LEFT JOIN kb_faq_roles fr ON f.id = fr.faq_id
  CROSS JOIN kb_employees e
  WHERE e.id = p_employee_id
    AND (
      fd.department = e.department
      OR fr.role = e.role
      OR fr.role = 'All'
      OR fd.department IS NULL  -- FAQs without department restriction
    );
$$;

-- Function: Get onboarding tasks relevant to an employee (by their department and role)
CREATE OR REPLACE FUNCTION get_tasks_for_employee(p_employee_id TEXT)
RETURNS SETOF kb_onboarding_tasks
LANGUAGE sql 
STABLE
SECURITY DEFINER
AS $$
  SELECT * FROM (
    SELECT DISTINCT t.*
    FROM kb_onboarding_tasks t
    LEFT JOIN kb_task_roles tr ON t.id = tr.task_id
    CROSS JOIN kb_employees e
    WHERE e.id = p_employee_id
      AND (
        t.department = e.department
        OR t.department = 'All'
        OR t.department IS NULL
        OR tr.role = e.role
        OR tr.role = 'All'
      )
  ) AS distinct_tasks
  ORDER BY 
    CASE priority
      WHEN 'High' THEN 1
      WHEN 'Medium' THEN 2
      WHEN 'Low' THEN 3
      ELSE 4
    END,
    CASE deadline
      WHEN 'Day 1' THEN 1
      WHEN 'Day 2' THEN 2
      WHEN 'Week 1' THEN 3
      WHEN 'Week 2' THEN 4
      ELSE 5
    END;
$$;

-- Function: Get team members by department
CREATE OR REPLACE FUNCTION get_team_by_department(p_department TEXT)
RETURNS SETOF kb_employees
LANGUAGE sql 
STABLE
SECURITY DEFINER
AS $$
  SELECT * 
  FROM kb_employees 
  WHERE department = p_department
  ORDER BY full_name;
$$;

-- Function: Get direct reports for a manager
CREATE OR REPLACE FUNCTION get_direct_reports(p_manager_id TEXT)
RETURNS SETOF kb_employees
LANGUAGE sql 
STABLE
SECURITY DEFINER
AS $$
  SELECT * 
  FROM kb_employees 
  WHERE manager_id = p_manager_id
  ORDER BY full_name;
$$;

-- Function: Search employees by name (fuzzy)
CREATE OR REPLACE FUNCTION search_employees_by_name(p_name TEXT)
RETURNS SETOF kb_employees
LANGUAGE sql 
STABLE
SECURITY DEFINER
AS $$
  SELECT * 
  FROM kb_employees 
  WHERE LOWER(full_name) LIKE '%' || LOWER(p_name) || '%'
     OR LOWER(first_name) LIKE '%' || LOWER(p_name) || '%'
     OR LOWER(last_name) LIKE '%' || LOWER(p_name) || '%'
  ORDER BY full_name;
$$;

-- ============================================================================
-- STEP 8: GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON kb_employees TO authenticated;
GRANT SELECT ON kb_faqs TO authenticated;
GRANT SELECT ON kb_onboarding_tasks TO authenticated;
GRANT SELECT ON kb_faq_departments TO authenticated;
GRANT SELECT ON kb_faq_roles TO authenticated;
GRANT SELECT ON kb_task_roles TO authenticated;

GRANT ALL ON kb_employees TO service_role;
GRANT ALL ON kb_faqs TO service_role;
GRANT ALL ON kb_onboarding_tasks TO service_role;
GRANT ALL ON kb_faq_departments TO service_role;
GRANT ALL ON kb_faq_roles TO service_role;
GRANT ALL ON kb_task_roles TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_employee_by_email TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_employee_by_id TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_faqs_for_employee TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_tasks_for_employee TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_team_by_department TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_direct_reports TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION search_employees_by_name TO authenticated, service_role;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check tables were created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name LIKE 'kb_%';

-- Check functions were created
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' AND routine_name LIKE 'get_%';

-- ============================================================================
-- PHASE 6 COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Run the loadKnowledgeBase.js script to populate both tables and embeddings
-- 2. Test the SQL functions with sample queries
-- ============================================================================

