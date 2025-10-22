# 🔐 Phase 2: Database Setup Instructions

## Step-by-Step Guide to Enable Authentication

---

## 📋 Prerequisites

- Access to your Supabase Dashboard
- SQL Editor access in Supabase
- Existing Phase 1 database (conversations, knowledge_base tables)

---

## 1️⃣ Run Database Migration

### In Supabase Dashboard:

1. **Go to SQL Editor**
   - Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
   
2. **Create New Query**
   - Click "+ New query" button

3. **Copy and Paste Migration**
   - Open: `backend/database/phase2-auth-schema.sql`
   - Copy ALL contents
   - Paste into Supabase SQL Editor

4. **Execute Migration**
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for "Success. No rows returned"

5. **Verify Migration**
   - Run this verification query:
   ```sql
   -- Check if migration succeeded
   SELECT 
     (SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_name = 'conversations' AND column_name = 'user_id') as user_id_exists,
     (SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_name = 'user_profiles') as profiles_table_exists,
     (SELECT COUNT(*) FROM pg_policies 
      WHERE tablename = 'conversations') as conversation_policies,
     (SELECT COUNT(*) FROM pg_policies 
      WHERE tablename = 'user_profiles') as profile_policies;
   ```
   
   **Expected Result:**
   ```
   user_id_exists: 1
   profiles_table_exists: 1
   conversation_policies: 4
   profile_policies: 3
   ```

---

## 2️⃣ Enable Email Authentication

### In Supabase Dashboard:

1. **Go to Authentication Settings**
   - Navigate to: Authentication → Providers

2. **Enable Email Provider**
   - Find "Email" in the list
   - Toggle it ON
   - Settings to configure:
     - ✅ Enable email provider
     - ✅ Confirm email (recommended for production)
     - ✅ Secure email change
     - Set "Email Templates" (optional)

3. **Configure Email Settings**
   - Set "Site URL": `http://localhost:3000` (development)
   - Set "Redirect URLs": `http://localhost:3000/**` (allows all routes)

4. **Save Changes**

---

## 3️⃣ Configure OAuth Providers (Optional but Recommended)

### A. Google OAuth Setup

#### 1. Create Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: "Web application"
6. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://<your-supabase-project>.supabase.co
   ```
7. **Authorized redirect URIs:**
   ```
   https://<your-supabase-project>.supabase.co/auth/v1/callback
   ```
8. Copy **Client ID** and **Client Secret**

#### 2. Configure in Supabase
1. Go to: Authentication → Providers → Google
2. Toggle ON
3. Paste **Client ID**
4. Paste **Client Secret**
5. Save

### B. Microsoft OAuth Setup

#### 1. Create Microsoft Azure App
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Name: "NovaTech Onboarding Chatbot"
5. **Redirect URI:**
   ```
   https://<your-supabase-project>.supabase.co/auth/v1/callback
   ```
6. Register app
7. Go to "Certificates & secrets" → "New client secret"
8. Copy **Application (client) ID** and **Client secret value**

#### 2. Configure in Supabase
1. Go to: Authentication → Providers → Azure (Microsoft)
2. Toggle ON
3. Paste **Client ID** (Application ID)
4. Paste **Client Secret**
5. Save

---

## 4️⃣ Verify Setup

### Test RLS Policies

Run this test query in Supabase SQL Editor:

```sql
-- Test 1: Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('conversations', 'user_profiles', 'knowledge_base');

-- Expected: rowsecurity = true for all tables

-- Test 2: Check policies
SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename IN ('conversations', 'user_profiles', 'knowledge_base')
ORDER BY tablename, policyname;

-- Expected: See all policies listed
```

---

## 5️⃣ Update Environment Variables

### Backend (`.env`)

Add these to your `backend/.env`:

```env
# Existing variables...
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here

# Add JWT Secret (find in Supabase Dashboard → Settings → API)
SUPABASE_JWT_SECRET=your_jwt_secret_here

# OAuth (if using)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

**Where to find JWT Secret:**
1. Go to: Settings → API
2. Look for "JWT Settings" section
3. Copy "JWT Secret" value

### Frontend (`.env`)

Your frontend `.env` should have:

```env
REACT_APP_API_URL=http://localhost:8000

# Supabase (for auth)
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 6️⃣ Migrate Existing Data (Optional)

If you have existing conversations from Phase 1, assign them to a default user:

```sql
-- Option A: Create a test user first, then assign conversations
-- (Do this through the Supabase Auth UI or wait for Phase 2 code)

-- Option B: Delete existing test conversations
DELETE FROM conversations WHERE user_id IS NULL;

-- Option C: Assign to first registered user (after someone signs up)
UPDATE conversations 
SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
WHERE user_id IS NULL;
```

---

## 🧪 Test the Setup

### Create a Test User

1. **Go to**: Authentication → Users
2. **Click**: "Add user" → "Create new user"
3. **Fill**:
   - Email: `test@example.com`
   - Password: `Test123456!`
   - Auto Confirm User: ✅ ON
4. **Click**: "Create user"

### Verify User Profile Was Created

```sql
SELECT * FROM user_profiles;
-- Should show the test user's profile
```

### Test RLS (pretend you're the test user)

```sql
-- This should work (service role bypasses RLS)
SELECT * FROM conversations;

-- To test as a specific user, use Supabase Auth JWT
-- (Will be tested in the frontend code)
```

---

## ✅ Checklist

Before proceeding to backend code:

- [ ] Database migration executed successfully
- [ ] `user_id` column added to `conversations` table
- [ ] `user_profiles` table created
- [ ] RLS enabled on all tables
- [ ] RLS policies created (4 for conversations, 3 for profiles)
- [ ] Email authentication enabled in Supabase
- [ ] OAuth providers configured (optional)
- [ ] Environment variables updated (backend & frontend)
- [ ] Test user created
- [ ] JWT Secret added to backend `.env`

---

## 🆘 Troubleshooting

### Error: "relation auth.users does not exist"
- **Solution**: Make sure you're using Supabase (which has `auth.users` built-in)

### Error: "permission denied for table conversations"
- **Solution**: RLS is enabled but no policies exist. Re-run the migration SQL.

### Error: "function handle_new_user() does not exist"
- **Solution**: Re-run the function creation part of the migration

### Can't see other users' conversations
- **This is correct!** RLS is working as intended. Each user only sees their own data.

### Existing conversations disappeared
- **Solution**: They're filtered by RLS. Assign them to your user:
  ```sql
  UPDATE conversations 
  SET user_id = 'your-user-uuid-here'
  WHERE id = 'conversation-uuid-here';
  ```

---

## 📚 Next Steps

After completing this setup:

1. ✅ Database is ready for multi-user authentication
2. ➡️ Next: Implement backend authentication middleware
3. ➡️ Next: Create auth routes (login, signup, profile)
4. ➡️ Next: Update frontend with login/signup pages

**Continue to next step when ready!** 🚀

