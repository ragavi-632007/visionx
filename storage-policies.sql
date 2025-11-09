-- Supabase Storage Policies for Documents Bucket
-- Run this in Supabase SQL Editor after creating the 'documents' bucket

-- First, ensure the bucket exists (create it in Storage dashboard if not exists)
-- Then run these policies:

-- Policy: Users can upload their own files
CREATE POLICY IF NOT EXISTS "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own files
CREATE POLICY IF NOT EXISTS "Users can view own files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own files
CREATE POLICY IF NOT EXISTS "Users can delete own files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Note: The bucket must be created first in Storage dashboard:
-- 1. Go to Storage → New bucket
-- 2. Name: documents
-- 3. Make it public: YES
-- 4. Then run this SQL

