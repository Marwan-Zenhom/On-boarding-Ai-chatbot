# 🔐 Google OAuth Setup Guide

Follow these steps to enable Google Sign-In for your application.

---

## 📋 Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- Your Supabase project URL

---

## 🚀 Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `Onboarding Chat App` (or your preferred name)
4. Click **"Create"**
5. Wait for the project to be created and select it

### 2. Enable Google+ API

1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and click **"Enable"**

### 3. Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (unless you have a Google Workspace)
3. Click **"Create"**

**Fill in the required fields:**
- **App name**: `Onboarding Chat` (or your app name)
- **User support email**: Your email address
- **App logo**: (Optional) Upload your app logo
- **Application home page**: `http://localhost:3000` (for development)
- **Authorized domains**: Leave empty for now (add your production domain later)
- **Developer contact information**: Your email address

4. Click **"Save and Continue"**
5. **Scopes**: Click **"Save and Continue"** (no need to add scopes)
6. **Test users**: Click **"Save and Continue"** (no need to add test users for now)
7. Click **"Back to Dashboard"**

### 4. Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. **Application type**: Select **"Web application"**
4. **Name**: `Onboarding Chat Web Client`

**Configure Authorized URLs:**

5. **Authorized JavaScript origins**:
   - Click **"+ Add URI"**
   - Add: `http://localhost:3000` (for development)
   - Add: `https://orzsxzebzdxyyslizcpz.supabase.co` (your Supabase URL)

6. **Authorized redirect URIs**:
   - Click **"+ Add URI"**
   - Add: `https://orzsxzebzdxyyslizcpz.supabase.co/auth/v1/callback`
   
   **Format**: `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`

7. Click **"Create"**

8. **Copy your credentials:**
   - **Client ID**: `xxxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxx`
   
   ⚠️ **Keep these safe! You'll need them in the next step.**

---

## 🔧 Configure Supabase

### 1. Add Google OAuth to Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** and toggle it **ON**

5. **Enter your Google credentials:**
   - **Client ID**: Paste the Client ID from Google Cloud Console
   - **Client Secret**: Paste the Client Secret from Google Cloud Console

6. Click **"Save"**

### 2. Verify the Callback URL

Make sure the **Redirect URL** in Supabase matches what you added in Google Cloud Console:

```
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

---

## ✅ Test Google Sign-In

1. **Restart your frontend** (if it's running):
   ```bash
   cd frontend
   npm start
   ```

2. Go to `http://localhost:3000/login`

3. Click the **"Google"** button

4. You should be redirected to Google's login page

5. Sign in with your Google account

6. **Grant permissions** to the app

7. You should be redirected back to your app and logged in! 🎉

---

## 🌐 Production Setup

When deploying to production:

### 1. Update Google Cloud Console

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click on your OAuth 2.0 Client ID
3. **Add production URLs:**
   - **Authorized JavaScript origins**: `https://yourdomain.com`
   - **Authorized redirect URIs**: `https://orzsxzebzdxyyslizcpz.supabase.co/auth/v1/callback`
4. Click **"Save"**

### 2. Update OAuth Consent Screen

1. Go to **"OAuth consent screen"**
2. Click **"Publish App"** to make it available to all users
3. Add your **production domain** to **Authorized domains**

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"

**Solution**: Make sure the redirect URI in Google Cloud Console exactly matches:
```
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

### Error: "Access blocked: This app's request is invalid"

**Solution**: 
1. Make sure you've enabled the Google+ API
2. Verify the OAuth consent screen is properly configured
3. Check that all required fields are filled in

### Error: "This app isn't verified"

**Solution**: 
- For development: Click **"Advanced"** → **"Go to [App Name] (unsafe)"**
- For production: Submit your app for Google verification (takes 1-2 weeks)

### Users can't sign in

**Solution**:
1. Check that Google OAuth is enabled in Supabase
2. Verify Client ID and Secret are correct
3. Make sure the callback URL matches exactly
4. Check browser console for errors

---

## 📝 Important Notes

- **Free tier**: Google OAuth is free for up to 100,000 users
- **Verification**: Apps in "Testing" mode can have up to 100 test users
- **Production**: Publish your app to allow unlimited users
- **Security**: Never commit your Client Secret to Git
- **Display name**: Users signing in with Google will use their Google name automatically

---

## 🎯 Summary

✅ **What you've accomplished:**
- Created a Google Cloud project
- Configured OAuth consent screen
- Generated OAuth 2.0 credentials
- Integrated Google Sign-In with Supabase
- Enabled Google authentication in your app

**Your users can now sign in with Google in one click!** 🚀

---

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google Cloud Console](https://console.cloud.google.com/)

