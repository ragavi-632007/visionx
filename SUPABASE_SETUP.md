# Supabase Setup Instructions

Follow these steps to set up your Supabase database and storage for LexiGem:

## 1. Database Schema Setup

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database-schema.sql` into the SQL Editor
4. Click **Run** to execute the SQL

This will create:
- `documents` table for storing document metadata and analysis
- `chat_history` table for storing individual chat messages
- `chat_sessions` table for storing chat session metadata
- Row Level Security (RLS) policies to ensure users can only access their own data
- Indexes for better query performance
- Triggers to automatically update timestamps and message counts

## 2. Storage Bucket Setup

1. In your Supabase dashboard, go to **Storage**
2. Click **New bucket**
3. Name: `documents`
4. **Make it public**: Check this box (so users can access their uploaded documents)
5. Click **Create bucket**

### Set Storage Policies

After creating the bucket, go to **Storage** → **Policies** for the `documents` bucket and add:

**Policy Name: Users can upload own files**
```sql
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Policy Name: Users can view own files**
```sql
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Policy Name: Users can delete own files**
```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

Or use the Supabase dashboard Policy Editor to create these policies with the same conditions.

Alternatively, you can run `storage-policies.sql` in the SQL Editor for automated setup.

## 3. Authentication Setup (Optional)

By default, Supabase Auth is already configured. However, you can customize:

1. Go to **Authentication** → **Settings**
2. Configure email templates, OAuth providers, etc. as needed
3. Make sure email confirmation is set up as you prefer

## 4. Verify Setup

After completing the above steps, your application should be able to:
- ✅ Register and authenticate users
- ✅ Upload documents to Supabase Storage
- ✅ Save document analysis to the database
- ✅ Retrieve user's document history
- ✅ Delete documents
- ✅ Save chat conversations to the database
- ✅ Retrieve chat history by session
- ✅ View and manage chat sessions

## Troubleshooting

If you encounter issues:

1. **Storage upload fails**: Ensure the `documents` bucket exists and policies are set correctly
2. **Database insert fails**: Verify the `documents` table exists and RLS policies are active
3. **Authentication fails**: Check that Supabase Auth is enabled and email confirmation settings are configured correctly
4. **Chat history not loading**: Verify `chat_history` and `chat_sessions` tables are created

