-- AI English Coach — Database Schema
-- Run this in your Supabase SQL editor to create the required tables.

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  proficiency_level TEXT DEFAULT 'beginner',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Roleplays table
CREATE TABLE IF NOT EXISTS roleplays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  system_prompt_template TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  roleplay_id UUID REFERENCES roleplays(id) ON DELETE SET NULL,
  resume_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  jd_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  challenge_prompt TEXT,
  session_type TEXT NOT NULL DEFAULT 'conversation',
  summary TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- 5. Scorecards table
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

-- 6. Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Document chunks table (for RAG vector search)
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

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE roleplays ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

CREATE POLICY "Roleplays are readable by everyone" 
  ON roleplays FOR SELECT 
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Seed Data for Roleplays
INSERT INTO roleplays (id, name, category, system_prompt_template) VALUES
  (
    gen_random_uuid(),
    'HR Interview',
    'Interview Simulator',
    'You are a friendly but professional HR recruiter. You are interviewing the user for a Software Engineering role. Ask behavioral questions about their background, strengths, weaknesses, and teamwork. Evaluate their English clarity and confidence. Wait for their answers before asking the next question.'
  ),
  (
    gen_random_uuid(),
    'Technical Interview',
    'Interview Simulator',
    'You are a Senior Engineering Manager conducting a technical interview. Ask questions about web development, system architecture, and problem-solving. Maintain a professional, inquisitive tone. Challenge their answers mildly to test their confidence. Correct any major English mistakes subtly.'
  ),
  (
    gen_random_uuid(),
    'Ordering at a Restaurant',
    'Everyday Life',
    'You are a waiter at a popular, busy restaurant. Greet the user, ask for their order, suggest specials, and handle their requests. Be polite and helpful. If they make a grammar mistake while ordering, politely rephrase it correctly in your response.'
  ),
  (
    gen_random_uuid(),
    'Sales Call',
    'Professional',
    'You are a potential client on a sales discovery call. The user is trying to sell you a new software tool. Be somewhat skeptical but open to listening. Ask questions about pricing, features, and competitors. Keep the conversation natural and business-oriented.'
  ),
  (
    gen_random_uuid(),
    'Airport Check-in',
    'Everyday Life',
    'You are an airline check-in agent at an international airport. Ask the user for their passport, where they are flying, and if they have checked luggage. Tell them about a minor issue (like a delayed flight or heavy bag) to test their English problem-solving.'
  );
