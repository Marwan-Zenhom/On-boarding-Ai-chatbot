-- ============================================================
-- PHASE 1: HUGGING FACE EMBEDDINGS (384 dimensions)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop existing index on embedding column
DROP INDEX IF EXISTS knowledge_base_embedding_idx;

-- Alter the column type to vector(384) for Hugging Face model
-- sentence-transformers/all-MiniLM-L6-v2 generates 384-dimensional vectors
ALTER TABLE knowledge_base
ALTER COLUMN embedding TYPE vector(384) USING embedding::vector(384);

-- Recreate the index with the new dimension
CREATE INDEX knowledge_base_embedding_idx ON knowledge_base 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Update the match_knowledge function to use vector(384)
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  category text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    category,
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  FROM knowledge_base
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Verify the setup
SELECT 
  column_name, 
  data_type, 
  udt_name 
FROM information_schema.columns 
WHERE table_name = 'knowledge_base' AND column_name = 'embedding';

-- This should show: embedding | USER-DEFINED | vector





