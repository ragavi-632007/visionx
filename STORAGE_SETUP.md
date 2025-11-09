# 📦 Supabase Storage Setup Guide

Since you've created the tables, now you need to set up the storage bucket for document uploads.

## Step 1: Create Storage Bucket

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Storage**
   - Click **"Storage"** in the left sidebar
   - Click **"New bucket"** button

3. **Configure Bucket**
   - **Name:** `documents` (must be exactly this name)
   - **Make it public:** ✅ **CHECK THIS BOX** (Important!)
   - **File size limit:** Leave default or set as needed (e.g., 50 MB)
   - **Allowed MIME types:** Leave empty for all types, or specify:
     ```
     application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp
     ```
   - Click **"Create bucket"**

## Step 2: Set Storage Policies (CRITICAL!)

After creating the bucket, you MUST set up policies so users can only access their own files.

### Option A: Using SQL Editor (Recommended)

1. Go to **SQL Editor**
2. Click **"New query"**
3. Copy and paste the following SQL:

```sql
-- Policy: Users can upload their own files
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
```

4. Click **"Run"**

### Option B: Using Policy Editor

1. Go to **Storage** → Click on **"documents"** bucket
2. Click **"Policies"** tab
3. Click **"New Policy"**
4. For each policy, select:
   - **Operation:** INSERT, SELECT, DELETE (create 3 separate policies)
   - **Policy name:** "Users can upload/view/delete own files"
   - **Policy definition:** 
     ```sql
     bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
     ```

## Step 3: Verify Setup

1. Go to **Storage** → **documents** bucket
2. You should see the bucket is **public** (green indicator)
3. Check **Policies** tab - you should see 3 policies enabled

## How It Works

- Files are stored in: `documents/{userId}/{timestamp}.{ext}`
- Each user's files are in their own folder (their user ID)
- Policies ensure users can only access files in their own folder
- Files are publicly accessible via URL (required for document viewing)

## Troubleshooting

### Error: "new row violates row-level security policy"
- **Solution:** Make sure storage policies are created correctly
- Check that the policy uses `auth.uid()::text = (storage.foldername(name))[1]`

### Error: "Bucket not found"
- **Solution:** Verify bucket name is exactly `documents` (case-sensitive)

### Files upload but can't be accessed
- **Solution:** Make sure bucket is set to **public**
- Check the file URL in the database - it should be accessible

### Policy errors when running SQL
- **Solution:** If policies already exist, use:
  ```sql
  DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
  -- Then recreate
  ```

## ✅ After Setup

Once storage is configured:
1. ✅ Users can upload documents
2. ✅ Documents are stored securely
3. ✅ Documents can be viewed/downloaded
4. ✅ Documents can be deleted

Your storage setup is complete! 🎉

