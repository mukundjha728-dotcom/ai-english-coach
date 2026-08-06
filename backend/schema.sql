-- AI English Coach — Database Schema (Phase 0 + Phase 1)
-- Run this in your Supabase SQL editor to create the required tables.

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  proficiency_level TEXT DEFAULT 'beginner',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID, -- References documents(id), added below due to ordering
  session_type TEXT NOT NULL DEFAULT 'conversation',
  summary TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- Scorecards table
CREATE TABLE IF NOT EXISTS scorecards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  grammar_score INTEGER NOT NULL,
  vocabulary_score INTEGER NOT NULL,
  fluency_score INTEGER NOT NULL,
  strengths JSONB NOT NULL,
  areas_for_improvement JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow service role full access (backend uses service role key)
-- Users can only read their own data via the frontend Supabase client
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = auth_id);

CREATE POLICY "Sessions belong to user"
  ON sessions FOR ALL
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()::text));

CREATE POLICY "Messages belong to user sessions"
  ON messages FOR ALL
  USING (session_id IN (
    SELECT s.id FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE u.auth_id = auth.uid()::text
  ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key to sessions now that documents table exists
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_documents FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;

-- Document chunks table (for RAG vector search)
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(768) -- Gemini embeddings are 768 dimensions
);

-- Create a function to search for document chunks
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_document_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    document_chunks.id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE document_chunks.document_id = p_document_id
    AND 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;
