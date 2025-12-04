# Database Setup Scripts

This directory contains SQL scripts to set up the database schema for the Onboarding Chat application.

## Setup Order

Run these scripts in **Supabase SQL Editor** in the exact order listed:

### 1. `00-initial-schema.sql` ⭐ **START HERE**
Creates the base tables:
- `conversations` - Chat conversations
- `messages` - Chat messages
- `knowledge_base` - Company knowledge base with vector embeddings

### 2. `phase2-auth-schema.sql`
Adds authentication support:
- Adds `user_id` to conversations
- Creates `user_profiles` table
- Sets up Row Level Security (RLS) policies
- Creates helper functions

### 3. `phase1-huggingface-schema.sql`
Configures vector search:
- Sets up 384-dimensional vector embeddings
- Creates vector similarity search function
- Creates indexes for fast semantic search

### 4. `phase5-agentic-ai-schema.sql`
Adds AI agent functionality:
- Creates `agent_actions` table
- Creates `user_oauth_tokens` table
- Creates `user_agent_preferences` table
- Creates `action_templates` table
- Sets up RLS policies for agent features

### 5. `create-avatar-storage.sql`
Creates storage bucket:
- Creates `avatars` public storage bucket
- Sets up storage policies for avatar uploads

### 6. `setup-messages-rls.sql`
Sets up messages security:
- Enables RLS on messages table
- Creates policies so users can only access their own messages

## Troubleshooting

If you encounter errors, check the `fixes/` folder for troubleshooting scripts.

## File Structure

```
backend/database/
├── 00-initial-schema.sql          # Base tables (run first)
├── phase2-auth-schema.sql         # Authentication
├── phase1-huggingface-schema.sql  # Vector search
├── phase5-agentic-ai-schema.sql   # AI agent features
├── create-avatar-storage.sql      # Storage bucket
├── setup-messages-rls.sql         # Messages RLS
├── fixes/                         # Troubleshooting scripts
│   ├── README.md
│   ├── fix-conversations-foreign-key.sql
│   ├── fix-knowledge-base-rls.sql
│   ├── fix-oauth-tokens-rls.sql
│   └── fix-avatar-storage.sql
└── README.md                      # This file
```

## Verification

After running all scripts, verify the setup:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'conversations', 
    'messages', 
    'knowledge_base',
    'user_profiles',
    'agent_actions',
    'user_oauth_tokens',
    'user_agent_preferences'
  )
ORDER BY table_name;

-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('conversations', 'messages', 'knowledge_base');
```

