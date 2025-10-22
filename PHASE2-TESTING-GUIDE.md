# Phase 2: Multi-User Authentication - Testing Guide

## 🎉 What's Been Implemented

### Backend ✅
- Authentication middleware for JWT verification
- Auth controller with signup, signin, profile endpoints
- Protected chat endpoints (require authentication)
- User-specific data filtering (RLS policies)
- Database migration with user_id and profiles

### Frontend ✅
- Authentication context and provider
- Login/Signup pages with beautiful UI
- OAuth buttons (Google, Microsoft)
- Protected routes
- Token-based API requests
- Auto-redirect on session expiry

---

## 🚀 How to Test Phase 2

### Step 1: Add JWT Secret to Backend .env

1. Go to your **Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. Navigate to **Settings > API**

3. Scroll to **JWT Settings** and copy the **JWT Secret**

4. Add to `backend/.env`:
   ```env
   SUPABASE_JWT_SECRET=your_jwt_secret_here
   ```

### Step 2: Restart Backend Server

```bash
cd backend
node server.js
```

### Step 3: Restart Frontend Server

```bash
cd frontend
npm start
```

### Step 4: Test Authentication Flow

#### A. Test Signup
1. Go to http://localhost:3000
2. You should be redirected to `/login`
3. Click "Sign Up"
4. Fill in:
   - Display Name: "Test User"
   - Email: "test@company.com"
   - Password: "test123"
   - Confirm Password: "test123"
5. Click "Sign Up"
6. ✅ You should see a success message
7. Check your email for verification (if required by Supabase)

#### B. Test Login
1. Go to http://localhost:3000/login
2. Enter:
   - Email: "test@company.com"
   - Password: "test123"
3. Click "Sign In"
4. ✅ You should be redirected to the chat interface

#### C. Test Protected Routes
1. Open a new incognito window
2. Try to go to http://localhost:3000
3. ✅ You should be redirected to `/login`

#### D. Test Multi-User Isolation
1. **User 1**: Sign up as "user1@company.com"
2. **User 1**: Create 2-3 conversations
3. Sign out
4. **User 2**: Sign up as "user2@company.com"
5. **User 2**: Create 2-3 different conversations
6. ✅ User 2 should NOT see User 1's conversations
7. Sign out and sign in as User 1 again
8. ✅ User 1 should ONLY see their own conversations

#### E. Test OAuth (Optional)
1. Go to Supabase Dashboard > **Authentication > Providers**
2. Enable Google OAuth:
   - Add your Google OAuth credentials
   - Save
3. Go to http://localhost:3000/login
4. Click "Google" button
5. ✅ Should redirect to Google login
6. ✅ After Google auth, should redirect back to chat

---

## 🔍 What to Verify

### Database Level
1. Go to Supabase Dashboard > **Table Editor > conversations**
2. ✅ Each conversation should have a `user_id`
3. ✅ User IDs should match the Supabase `auth.users` table

### API Level
1. Open Browser DevTools > Network tab
2. Send a message
3. Check the request headers:
   - ✅ Should have `Authorization: Bearer <token>`
4. Try removing the token and sending a request:
   - ✅ Should get 401 Unauthorized

### Frontend Level
1. ✅ Login page should be accessible when not authenticated
2. ✅ Chat interface should require authentication
3. ✅ Conversations should be user-specific
4. ✅ Sign out should clear session and redirect to login

---

## 🐛 Troubleshooting

### Problem: "401 Unauthorized" on all requests
**Solution**: Make sure `SUPABASE_JWT_SECRET` is correctly set in `backend/.env`

### Problem: "Column user_id does not exist"
**Solution**: Make sure you ran the Phase 2 database migration script

### Problem: All users see all conversations
**Solution**: Check that RLS policies are enabled in Supabase Dashboard

### Problem: Can't sign up
**Solution**: 
- Check Supabase Dashboard > Authentication > Email Templates
- Make sure email confirmation is not required (or check your email)

### Problem: OAuth doesn't work
**Solution**:
- Make sure OAuth providers are configured in Supabase Dashboard
- Add redirect URLs to your OAuth app settings

---

## 📊 Expected Results

After testing, you should have:
- ✅ Multiple users can sign up independently
- ✅ Each user only sees their own conversations
- ✅ Users cannot access other users' data
- ✅ Authentication is required for all chat operations
- ✅ Sessions persist across page refreshes
- ✅ Sessions expire after Supabase's configured timeout

---

## 🎯 Next Steps

Once testing is complete and everything works:

1. **Merge to main branch**:
   ```bash
   git checkout main
   git merge feature/authentication
   ```

2. **Deploy to production**:
   - Update environment variables on your production server
   - Run database migration on production Supabase
   - Deploy frontend and backend

3. **Optional enhancements**:
   - Add password reset functionality
   - Add email verification UI
   - Add user profile page
   - Add admin dashboard
   - Add rate limiting
   - Add activity logging

---

## 💡 Tips

- Use **incognito windows** to test multiple users simultaneously
- Check the **browser console** for any errors
- Check the **backend logs** for authentication issues
- Use **Supabase Dashboard > Authentication > Users** to manage test users
- You can delete test users from Supabase Dashboard if needed

---

## 🔒 Security Notes

- JWT secrets should NEVER be committed to Git
- Passwords are hashed by Supabase automatically
- RLS policies prevent unauthorized data access
- Always use HTTPS in production
- Consider implementing rate limiting for signup/login
- Monitor authentication logs for suspicious activity

---

## ✅ Testing Checklist

- [ ] JWT secret added to backend .env
- [ ] Backend server restarted
- [ ] Frontend server restarted
- [ ] Can sign up new users
- [ ] Can sign in with email/password
- [ ] Protected routes require authentication
- [ ] Each user only sees their own conversations
- [ ] Sign out works correctly
- [ ] Session persists across refreshes
- [ ] OAuth login works (if configured)
- [ ] No console errors
- [ ] No backend errors

---

**🎉 Congratulations! If all tests pass, Phase 2 is complete!**


