# Avatar Storage Setup Guide

This guide will help you set up Supabase Storage for user profile pictures.

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard: https://orzsxzebzdxyyslizcpz.supabase.co
2. Click on **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `avatars`
   - **Public bucket**: Toggle **ON** (this allows public read access)
   - Click **Create bucket**

## Step 2: Set Up Storage Policies (Optional - Manual Method)

If you want to set up policies manually through the UI:

1. Click on the **avatars** bucket
2. Go to the **Policies** tab
3. Click **New policy**

### Policy 1: Users can upload their own avatar
- **Policy name**: `Users can upload their own avatar`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **USING expression**: Leave empty
- **WITH CHECK expression**:
```sql
bucket_id = 'avatars'
```

### Policy 2: Anyone can view avatars
- **Policy name**: `Anyone can view avatars`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **USING expression**:
```sql
bucket_id = 'avatars'
```

### Policy 3: Users can update their own avatar
- **Policy name**: `Users can update their own avatar`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'avatars'
```

### Policy 4: Users can delete their own avatar
- **Policy name**: `Users can delete their own avatar`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'avatars'
```

## Step 3: Test Avatar Upload

1. Sign in to your application
2. Click on your profile in the sidebar
3. Click **Profile Settings**
4. Click on the profile picture area
5. Select an image (max 5MB)
6. Click **Save Changes**
7. Your profile picture should now be displayed!

## Troubleshooting

### Images not uploading
- Check that the bucket is public
- Verify that you're authenticated
- Check browser console for errors
- Ensure image size is under 5MB

### Images not displaying
- Check that the bucket is public
- Verify the image URL in the browser
- Check CORS settings in Supabase Storage

### Permission denied errors
- Verify storage policies are set up correctly
- Check that you're signed in
- Try recreating the bucket with public access

## Storage URL Format

Your avatars will be stored at:
```
https://orzsxzebzdxyyslizcpz.supabase.co/storage/v1/object/public/avatars/[user-id]-[timestamp].[extension]
```

## Notes

- Profile pictures are stored in Supabase Storage
- The avatar URL is saved in the user's metadata as `avatar_url`
- Old avatars are overwritten when you upload a new one (using `upsert: true`)
- Maximum file size: 5MB
- Supported formats: All image formats (jpg, png, gif, webp, etc.)

