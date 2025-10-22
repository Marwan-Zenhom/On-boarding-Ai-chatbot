# How to Get Your Supabase JWT Secret

You need to add the `SUPABASE_JWT_SECRET` to your `.env` file. Here's how to find it:

## Steps:

1. **Go to your Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Navigate to Project Settings**
   - Click the **Settings** icon (gear icon) in the left sidebar
   - Click on **API** in the settings menu

3. **Find JWT Secret**
   - Scroll down to the **JWT Settings** section
   - You'll see **JWT Secret**
   - Click the **Show** button or copy icon to reveal and copy it

4. **Add to your `.env` file**
   ```env
   SUPABASE_JWT_SECRET=your_secret_here
   ```

## Important Notes:

- **Keep this secret SECURE!** Never commit it to Git.
- The JWT secret is used to verify authentication tokens.
- It should be a long string starting with something like `your-super-secret-jwt-token-with...`
- This is different from your `SUPABASE_ANON_KEY` (which is public).

## What if I can't find it?

If you're using Supabase locally or self-hosting:
- Check your Supabase configuration files
- It might be in your `docker-compose.yml` or `.env` file in your Supabase setup

If you're using Supabase Cloud:
- It's always available in **Settings > API > JWT Settings**

