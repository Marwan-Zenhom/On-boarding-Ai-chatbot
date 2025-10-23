# Quick Fix for Avatar Upload Error

The error "new row violates row-level security policy" occurs because the Supabase Storage bucket doesn't exist yet or doesn't have proper policies.

## Quick Fix (Do this NOW):

### Option 1: Create Bucket via Supabase Dashboard (RECOMMENDED)

1. Go to: https://orzsxzebzdxyyslizcpz.supabase.co
2. Click **Storage** in the left sidebar
3. Click **New bucket** (green button)
4. Fill in:
   - **Name**: `avatars`
   - **Public bucket**: **Toggle ON** ✅ (IMPORTANT!)
5. Click **Create bucket**

That's it! The bucket will automatically have public read access.

### Option 2: Run SQL Command

If you prefer SQL, go to the SQL Editor in Supabase and run:

```sql
-- Create the avatars bucket as a public bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;
```

## After Creating the Bucket:

1. **Refresh your browser**
2. Try uploading your profile picture again
3. It should work now! ✅

## Why This Happens

- Supabase Storage requires buckets to be created before files can be uploaded
- We're using a **public bucket** which means:
  - ✅ Anyone can view/read the avatars (needed for profile pictures)
  - ✅ Only authenticated users can upload (handled by our code)
  - ✅ No complex RLS policies needed

## Troubleshooting

If it still doesn't work:

### Check 1: Verify Bucket Exists
1. Go to Storage in Supabase
2. You should see an `avatars` bucket listed

### Check 2: Verify Bucket is Public
1. Click on the `avatars` bucket
2. Look for "Public" badge or toggle

### Check 3: Check Browser Console
1. Press F12 in your browser
2. Look for detailed error messages
3. Share them if the problem persists

### Check 4: Try Disabling All Storage Policies
If you created any custom storage policies, try disabling them:
1. Go to Storage > avatars > Policies
2. Disable or delete all custom policies
3. A public bucket doesn't need additional policies

## What We're Using

Our app stores profile data in **Supabase Auth's user metadata**, not in database tables:
- ✅ Display Name → `user.user_metadata.display_name`
- ✅ Avatar URL → `user.user_metadata.avatar_url`
- ✅ No RLS issues with auth metadata!

The only RLS that affects us is **Storage RLS**, which is automatically handled when you create a public bucket.

