# 🚀 Complete Storage Setup Guide

Follow these steps to set up Supabase Storage for document uploads.

## Step 1: Create Storage Bucket

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Storage**
   - Click **"Storage"** in the left sidebar
   - Click **"New bucket"** button

3. **Configure Bucket**
   - **Name:** `documents` (must be exactly this - case sensitive)
   - **Public bucket:** ✅ **CHECK THIS BOX** (Very important!)
   - **File size limit:** 50 MB (or your preference)
   - **Allowed MIME types:** Leave empty (allows all types)
   - Click **"Create bucket"**

## Step 2: Create Storage Policies

After creating the bucket, you need to set up security policies.

### Option A: Using SQL Editor (Recommended)

1. Go to **SQL Editor** → Click **"New query"**
2. Open the file: `storage-policies.sql`
3. Copy ALL content and paste into SQL Editor
4. Click **"Run"**

### Option B: Manual Setup via Policy Editor

1. Go to **Storage** → Click on **"documents"** bucket
2. Click **"Policies"** tab
3. Create 3 policies:

   **Policy 1: Upload**
   - Name: "Users can upload own files"
   - Operation: INSERT
   - Policy definition:
     ```sql
     bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
     ```

   **Policy 2: View**
   - Name: "Users can view own files"
   - Operation: SELECT
   - Policy definition:
     ```sql
     bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
     ```

   **Policy 3: Delete**
   - Name: "Users can delete own files"
   - Operation: DELETE
   - Policy definition:
     ```sql
     bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
     ```

## Step 3: Verify Setup

1. Go to **Storage** → **documents** bucket
2. Check:
   - ✅ Bucket shows **"Public"** status (green indicator)
   - ✅ **Policies** tab shows 3 active policies
   - ✅ Policies are enabled (toggle should be ON)

## How Storage Works

- **File path structure:** `documents/{userId}/{timestamp}.{ext}`
  - Example: `documents/abc-123-user-id/1704067200000.pdf`
- **Security:** Each user can only access files in their own folder (based on their user ID)
- **Public access:** Files are publicly accessible via URL (required for viewing documents)
- **Automatic cleanup:** When a document is deleted, the file is removed from storage

## ✅ Testing Storage

After setup, test by:
1. Upload a document in your app
2. Check Storage → documents bucket → you should see a folder with your user ID
3. File should be accessible via the URL stored in database

## ❌ Troubleshooting

### Error: "Bucket not found"
- **Solution:** Verify bucket name is exactly `documents` (lowercase)
- Check it exists in Storage dashboard

### Error: "new row violates row-level security policy"
- **Solution:** Make sure all 3 policies are created and enabled
- Verify policy definitions are correct (use SQL from storage-policies.sql)

### Files upload but URLs don't work
- **Solution:** Make sure bucket is set to **Public**
- Check the URL in database - it should be a public URL

### Can't see files in bucket
- **Solution:** Files are organized by user ID in folders
- Expand the folder with your user ID to see files

---

**Files needed:**
- `storage-policies.sql` - SQL to create policies
- Storage bucket must be created manually in dashboard first

