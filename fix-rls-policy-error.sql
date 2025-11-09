-- ============================================
-- FIX "new row violates row-level security policy" ERROR
-- ============================================
-- This error occurs when RLS policies prevent INSERT operations
-- Run these queries in Supabase SQL Editor to fix the issue
-- ============================================

-- ============================================
-- STEP 1: Check current RLS status and policies
-- ============================================
-- Run this to see what's currently set up

SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('documents', 'chat_history', 'chat_sessions')
ORDER BY tablename, policyname;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('documents', 'chat_history', 'chat_sessions');

-- ============================================
-- STEP 2: Drop existing policies (to recreate them correctly)
-- ============================================

-- Drop all policies for documents table
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

-- Drop all policies for chat_history table
DROP POLICY IF EXISTS "Users can view own chat history" ON chat_history;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON chat_history;
DROP POLICY IF EXISTS "Users can update own chat messages" ON chat_history;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON chat_history;

-- Drop all policies for chat_sessions table
DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can insert own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can delete own chat sessions" ON chat_sessions;

-- ============================================
-- STEP 3: Recreate policies with correct syntax
-- ============================================
-- IMPORTANT: These policies check auth.uid() = user_id
-- Make sure users are authenticated when inserting data

-- DOCUMENTS TABLE POLICIES
CREATE POLICY "Users can view own documents"
    ON documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
    ON documents FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
    ON documents FOR DELETE
    USING (auth.uid() = user_id);

-- CHAT_HISTORY TABLE POLICIES
CREATE POLICY "Users can view own chat history"
    ON chat_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
    ON chat_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat messages"
    ON chat_history FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
    ON chat_history FOR DELETE
    USING (auth.uid() = user_id);

-- CHAT_SESSIONS TABLE POLICIES
CREATE POLICY "Users can view own chat sessions"
    ON chat_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
    ON chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
    ON chat_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
    ON chat_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- STEP 4: Verify RLS is enabled
-- ============================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Alternative - TEMPORARILY DISABLE RLS (for testing only)
-- ============================================
-- ⚠️ WARNING: Only use this for testing! Not for production!
-- ⚠️ This makes your tables accessible to all users

-- UNCOMMENT ONLY IF YOU NEED TO TEST WITHOUT RLS:
-- ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_history DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Fix for Storage Bucket Policies (if error is for file uploads)
-- ============================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Recreate storage policies for 'documents' bucket
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
-- STEP 7: Verify policies are created correctly
-- ============================================

-- Check all policies
SELECT 
    tablename, 
    policyname, 
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN 'View'
        WHEN cmd = 'INSERT' THEN 'Insert'
        WHEN cmd = 'UPDATE' THEN 'Update'
        WHEN cmd = 'DELETE' THEN 'Delete'
    END as operation
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('documents', 'chat_history', 'chat_sessions')
ORDER BY tablename, cmd;

-- ============================================
-- TROUBLESHOOTING TIPS
-- ============================================
-- 1. Make sure user is authenticated: auth.uid() must not be NULL
-- 2. Make sure user_id in INSERT matches auth.uid()
-- 3. Check that policies use WITH CHECK for INSERT (required for inserts)
-- 4. Verify RLS is enabled: ALTER TABLE ... ENABLE ROW LEVEL SECURITY
-- 5. For service role key operations, you may need to bypass RLS temporarily

-- ============================================
-- CHECK IF USER IS AUTHENTICATED
-- ============================================
-- Run this in your application to verify auth.uid() is working:
-- SELECT auth.uid() as current_user_id;

