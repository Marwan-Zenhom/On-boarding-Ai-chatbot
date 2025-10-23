# Fix Avatar Upload Error (400 Bad Request)

## The Problem
You're getting a 400 error when trying to upload profile pictures. This means the storage bucket exists but has permission/configuration issues.

## Solution: Run This SQL Script

### Step 1: Open Supabase SQL Editor
1. Go to: https://orzsxzebzdxyyslizcpz.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Click **New query**

### Step 2: Copy and Run This SQL

```sql
-- Delete and recreate the avatars bucket with proper configuration
DELETE FROM storage.buckets WHERE id = 'avatars';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

-- Remove any existing restrictive policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete avatars" ON storage.objects;

-- Create simple, permissive policies
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can update avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars');
```

### Step 3: Click "Run" or Press F5

You should see: "Success. No rows returned"

### Step 4: Verify the Bucket
Go to **Storage** and verify:
- ✅ `avatars` bucket exists
- ✅ Has "Public" badge

### Step 5: Test Upload
1. **Refresh your browser** (F5)
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. Try uploading a profile picture again
4. Check browser console (F12) for detailed logs

## What This Does

1. **Deletes** the old bucket (if it had wrong settings)
2. **Creates** a new public bucket with:
   - 5MB file size limit
   - Allowed image types only
   - Public read access
3. **Removes** any restrictive old policies
4. **Adds** simple policies that allow:
   - ✅ Authenticated users to upload/update/delete
   - ✅ Everyone to view (public access)

## Alternative: Manual Setup via UI

If you prefer not to use SQL:

1. Go to **Storage** → Delete `avatars` bucket
2. Click **New bucket**
3. Name: `avatars`
4. **Toggle "Public bucket" ON**
5. Click **Create**

That's it! No policies needed for a public bucket.

## Troubleshooting

### Still Getting 400 Error?

1. **Check Authentication**:
   - Make sure you're logged in
   - Try logging out and back in

2. **Check File**:
   - File must be under 5MB
   - Must be an image (jpg, png, gif, webp)

3. **Check Browser Console**:
   - Press F12
   - Look for detailed error messages
   - Share them if problem persists

4. **Check Supabase Service Status**:
   - Sometimes Supabase has outages
   - Check: https://status.supabase.com

### Getting CORS Errors?

If you see CORS errors:
1. Go to **Storage** → **avatars** → **Configuration**
2. Add CORS policy for `http://localhost:3000`

## Why This Happens

- Complex RLS policies can block uploads
- Bucket needs to be **PUBLIC** for profile pictures
- Old policies from testing might be too restrictive
- Fresh bucket with simple policies = works!

## After It Works

Once upload works:
- ✅ Display name updates immediately
- ✅ Profile picture appears everywhere
- ✅ Changes persist across sessions
- ✅ Picture shows in sidebar, dropdown, and settings

Your avatar URL will be:
```
https://orzsxzebzdxyyslizcpz.supabase.co/storage/v1/object/public/avatars/[user-id]-[timestamp].jpg
```

