-- ============================================
-- Fix Common Supabase SQL Errors
-- ============================================
-- Run these queries in Supabase SQL Editor if you encounter errors
-- Copy and paste each section as needed based on your specific error
-- ============================================

-- ============================================
-- 1. FIX POLICY CONFLICTS (if policies already exist)
-- ============================================
-- Use this if you get "policy already exists" errors

-- Drop existing policies for documents table
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

-- Drop existing policies for chat_history table
DROP POLICY IF EXISTS "Users can view own chat history" ON chat_history;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON chat_history;
DROP POLICY IF EXISTS "Users can update own chat messages" ON chat_history;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON chat_history;

-- Drop existing policies for chat_sessions table
DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can insert own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can delete own chat sessions" ON chat_sessions;

-- Recreate policies for documents table
CREATE POLICY "Users can view own documents"
    ON documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
    ON documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
    ON documents FOR DELETE
    USING (auth.uid() = user_id);

-- Recreate policies for chat_history table
CREATE POLICY "Users can view own chat history"
    ON chat_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
    ON chat_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat messages"
    ON chat_history FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
    ON chat_history FOR DELETE
    USING (auth.uid() = user_id);

-- Recreate policies for chat_sessions table
CREATE POLICY "Users can view own chat sessions"
    ON chat_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
    ON chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
    ON chat_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
    ON chat_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 2. FIX TRIGGER CONFLICTS (if triggers already exist)
-- ============================================
-- Use this if you get "trigger already exists" errors

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
DROP TRIGGER IF EXISTS update_chat_session_count_after_insert ON chat_history;
DROP TRIGGER IF EXISTS update_chat_session_count_after_delete ON chat_history;

-- Recreate triggers
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at 
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_session_count_after_insert
    AFTER INSERT ON chat_history
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_session_count();

CREATE TRIGGER update_chat_session_count_after_delete
    AFTER DELETE ON chat_history
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_session_count();

-- ============================================
-- 3. FIX FUNCTION CONFLICTS (if functions already exist)
-- ============================================
-- Functions will be replaced with CREATE OR REPLACE, but here's explicit cleanup if needed

-- Functions use CREATE OR REPLACE so no need to drop, but here's the cleanup if needed:
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
-- DROP FUNCTION IF EXISTS update_chat_session_count() CASCADE;

-- ============================================
-- 4. FIX STORAGE POLICY ERRORS (for documents bucket)
-- ============================================
-- Use this if you get storage policy errors

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Recreate storage policies
CREATE POLICY "Users can upload own files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- 5. FIX TABLE CREATION ERRORS
-- ============================================
-- If tables don't exist, create them (this is safe to run multiple times)
-- Note: This preserves existing data

-- Ensure documents table exists with all columns
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_url TEXT,
    summary TEXT NOT NULL,
    pros JSONB DEFAULT '[]'::jsonb,
    cons JSONB DEFAULT '[]'::jsonb,
    potential_loopholes JSONB DEFAULT '[]'::jsonb,
    potential_challenges JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Ensure chat_history table exists
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID DEFAULT gen_random_uuid() NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'model')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Ensure chat_sessions table exists
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID UNIQUE NOT NULL,
    title TEXT,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- 6. CREATE ALL INDEXES (safe to run multiple times)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_session ON chat_history(user_id, session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);

-- ============================================
-- 7. ENABLE RLS (if not already enabled)
-- ============================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. VERIFY SETUP (check if everything is working)
-- ============================================

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('documents', 'chat_history', 'chat_sessions');

-- Check if policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('documents', 'chat_history', 'chat_sessions');

-- Check if triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table IN ('documents', 'chat_history', 'chat_sessions');

