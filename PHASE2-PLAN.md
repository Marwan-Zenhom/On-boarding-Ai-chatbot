# 🔐 Phase 2: Multi-User Authentication

## Overview
Add authentication system to support multiple users, each with isolated chat histories.

---

## 🎯 Goals

### Core Features
1. **User Authentication**
   - Supabase Auth (Email/Password + OAuth)
   - Google OAuth 2.0 integration
   - Microsoft OAuth 2.0 integration

2. **Multi-User Support**
   - User-specific chat conversations
   - Isolated chat histories
   - User profiles

3. **Access Control**
   - Protected API endpoints
   - JWT token validation
   - User session management

---

## 📋 Implementation Plan

### 1. Database Changes
- [ ] Create `users` table (if not using Supabase Auth users table)
- [ ] Modify `conversations` table to include `user_id` foreign key
- [ ] Modify `messages` table to include `user_id` foreign key
- [ ] Add RLS (Row Level Security) policies in Supabase

### 2. Backend Changes
- [ ] Install authentication packages (`@supabase/auth-helpers-node`, `jsonwebtoken`)
- [ ] Create authentication middleware
- [ ] Update all chat endpoints to require authentication
- [ ] Filter conversations and messages by `user_id`
- [ ] Create user profile endpoints

### 3. Frontend Changes
- [ ] Install authentication packages (`@supabase/auth-helpers-react`)
- [ ] Create Login/Signup pages
- [ ] Create OAuth provider buttons (Google, Microsoft)
- [ ] Add authentication context/provider
- [ ] Add protected routes
- [ ] Update API calls to include auth tokens
- [ ] Add user profile dropdown/menu
- [ ] Add logout functionality

### 4. Features
- [ ] Email/Password registration
- [ ] Email/Password login
- [ ] Google OAuth login
- [ ] Microsoft OAuth login
- [ ] Remember me functionality
- [ ] Password reset flow
- [ ] Email verification
- [ ] User profile page
- [ ] Logout

---

## 🗂️ New Files to Create

### Backend
```
backend/
├── middleware/
│   └── authMiddleware.js           # JWT validation, user extraction
├── controllers/
│   └── authController.js           # Login, signup, profile endpoints
├── routes/
│   └── authRoutes.js              # Authentication routes
└── database/
    └── phase2-auth-schema.sql     # Users table, RLS policies
```

### Frontend
```
frontend/src/
├── contexts/
│   └── AuthContext.js             # Authentication state management
├── pages/
│   ├── Login.js                   # Login page
│   ├── Signup.js                  # Signup page
│   └── Profile.js                 # User profile page
├── components/
│   ├── ProtectedRoute.js          # Route guard component
│   └── OAuthButton.js             # OAuth provider buttons
└── hooks/
    └── useAuth.js                 # Custom auth hook
```

---

## 🔄 Modified Files

### Backend
- `server.js` - Add auth middleware to protected routes
- `controllers/chatController.js` - Filter by `user_id`
- `config/database.js` - Export Supabase auth client

### Frontend
- `App.js` - Wrap with AuthProvider, add routing
- `services/apiService.js` - Add auth token to requests

---

## 📊 Database Schema Updates

### conversations table
```sql
ALTER TABLE conversations ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
```

### messages table (if needed)
```sql
ALTER TABLE messages ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
```

### Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create conversations for themselves
CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Similar policies for messages
```

---

##Authentication Flow

### Registration
```
User → Signup Form → Supabase Auth → Create User → Redirect to Chat
```

### Login (Email/Password)
```
User → Login Form → Supabase Auth → Verify Credentials → Get JWT → Store Token → Redirect to Chat
```

### Login (OAuth)
```
User → OAuth Button → Redirect to Provider → User Approves → Callback → Supabase Auth → Get JWT → Redirect to Chat
```

### API Requests
```
Frontend → Add JWT to Headers → Backend Middleware → Validate JWT → Extract user_id → Process Request
```

---

## 🔐 Security Considerations

1. **JWT Tokens**
   - Store in httpOnly cookies (secure)
   - Or localStorage with XSS protection

2. **Password Security**
   - Handled by Supabase (bcrypt hashing)
   - Minimum 8 characters
   - Password strength validation

3. **OAuth Security**
   - Use PKCE flow for OAuth 2.0
   - Validate state parameter
   - Handle OAuth errors gracefully

4. **API Security**
   - All chat endpoints protected
   - Validate user_id from JWT (don't trust client)
   - Rate limiting on auth endpoints

---

## 📝 Environment Variables

### Add to `backend/.env`:
```env
# Supabase (already have URL and KEY)
SUPABASE_JWT_SECRET=your_jwt_secret_here

# OAuth (if using custom providers)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

### Add to `frontend/.env`:
```env
# Supabase Auth
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🧪 Testing Checklist

### Authentication
- [ ] User can register with email/password
- [ ] User can login with email/password
- [ ] User can login with Google
- [ ] User can login with Microsoft
- [ ] User can logout
- [ ] Invalid credentials show error
- [ ] JWT tokens are validated
- [ ] Expired tokens redirect to login

### Chat Isolation
- [ ] User A cannot see User B's conversations
- [ ] New conversations are assigned to correct user
- [ ] Switching users shows different conversation lists
- [ ] Knowledge base searches work for all users

### Security
- [ ] Protected routes redirect to login
- [ ] Invalid JWT returns 401
- [ ] SQL injection attempts blocked (RLS)
- [ ] XSS attempts sanitized

---

## 📈 Success Metrics

- [ ] Multiple users can register and login
- [ ] Each user has isolated chat history
- [ ] OAuth login works for Google and Microsoft
- [ ] No cross-user data leakage
- [ ] Session management works correctly
- [ ] Password reset flow functional
- [ ] All tests passing

---

## 🚀 Deployment Notes

### Supabase Setup
1. Enable Email Auth in Supabase Dashboard
2. Configure OAuth providers (Google, Microsoft)
3. Set up redirect URLs
4. Apply RLS policies
5. Test authentication flows

### Environment Setup
1. Add all OAuth credentials
2. Configure frontend redirect URLs
3. Test in development
4. Deploy and test in production

---

## 📚 Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft OAuth Setup](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Phase 2 Branch:** `feature/authentication`  
**Target Completion:** TBD  
**Dependencies:** Phase 1 (Complete ✅)


