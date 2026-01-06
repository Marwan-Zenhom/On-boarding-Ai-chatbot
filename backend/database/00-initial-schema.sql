-- ============================================================================
-- INITIAL SCHEMA: Base Tables Creation
-- ============================================================================
-- This script creates the base tables required for the application
-- Run this FIRST before any other phase scripts
-- ============================================================================

-- Enable pgvector extension for vector similarity search
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 1: Create conversations table
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  is_favourite BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_is_archived ON conversations(is_archived);
CREATE INDEX IF NOT EXISTS idx_conversations_is_favourite ON conversations(is_favourite);

-- Step 2: Create messages table
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp ASC);

-- Step 3: Create knowledge_base table
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding vector(384), -- Will be set by phase1-huggingface-schema.sql
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);

-- Note: The embedding index will be created by phase1-huggingface-schema.sql
-- after the vector extension and column are properly configured

-- ============================================================================
-- Verification Queries (Run these to verify tables were created)
-- ============================================================================

-- Check if tables exist
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('conversations', 'messages', 'knowledge_base')
-- ORDER BY table_name;

-- Check if pgvector extension is enabled
-- SELECT * FROM pg_extension WHERE extname = 'vector';

-- ============================================================================
-- Initial Schema Complete!
-- ============================================================================
-- Next steps:
-- 1. Run phase2-auth-schema.sql (adds authentication support)
-- 2. Run phase1-huggingface-schema.sql (configures vector search)
-- 3. Run phase5-agentic-ai-schema.sql (adds agent functionality)
-- 4. Run create-avatar-storage.sql (creates storage bucket)
-- 5. Run setup-messages-rls.sql (sets up messages RLS)
-- ============================================================================











