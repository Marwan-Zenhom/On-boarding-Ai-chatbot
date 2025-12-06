# 🚀 Setup Guide - NovaTech AI Onboarding Assistant

This guide will help you set up the full-stack onboarding chat application with AI responses, Agentic capabilities, and Google integration.

## 📋 Prerequisites

- **Node.js** 18+ (LTS recommended)
- **Google AI Studio** account (for Gemini API)
- **Google Cloud Console** account (for OAuth - Calendar/Gmail)
- **Supabase** account and project
- **Hugging Face** account (for embeddings - free)

---

## 🏗️ Project Structure

```
onboarding-chat/
├── backend/                 # Express.js API server
│   ├── config/             # Database & logger configurations
│   ├── constants/          # Centralized configuration values
│   ├── controllers/        # API route handlers
│   ├── middleware/         # Auth & validation middleware
│   ├── routes/             # Route definitions
│   ├── services/           # Business logic layer
│   ├── utils/              # Utility functions
│   ├── validators/         # Joi validation schemas
│   ├── database/           # SQL migration files
│   └── server.js           # Main server file
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # UI components (chat/, sidebar/)
│   │   ├── contexts/       # React Context (Auth, Theme)
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API service layer
│   │   └── styles/         # CSS stylesheets
│   └── public/             # Static assets
└── package.json            # Root package.json for scripts
```

---

## ⚡ Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
npm run setup:backend

# Install frontend dependencies
npm run setup:frontend
```

### 2. Setup Environment Variables

#### Backend Environment (`backend/.env`)

```bash
cd backend
cp env.example .env
```

Edit `backend/.env` with your keys:

```env
# ============================================================================
# Server Configuration
# ============================================================================
PORT=8000
NODE_ENV=development

# ============================================================================
# Supabase Configuration
# ============================================================================
# Get from: https://supabase.com/dashboard/project/_/settings/api
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# ============================================================================
# AI Services
# ============================================================================
# Gemini: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Hugging Face: https://huggingface.co/settings/tokens
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# ============================================================================
# Google OAuth (for Calendar & Gmail integration)
# ============================================================================
# Create at: Google Cloud Console > APIs & Services > Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/google-auth/callback

# ============================================================================
# App Configuration
# ============================================================================
FRONTEND_URL=http://localhost:3000
```

#### Frontend Environment (`frontend/.env.local`)

```bash
cd frontend
cp env.example .env.local
```

Edit `frontend/.env.local`:

```env
# Backend API
REACT_APP_API_URL=http://localhost:8000

# Supabase (same values as backend)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 🔑 Getting API Keys

### 1. Supabase Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Go to **Settings > API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)
   - **JWT Secret** → `SUPABASE_JWT_SECRET`

### 2. Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key → `GEMINI_API_KEY`

### 3. Hugging Face Token

1. Go to [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. Create a new token with "Read" access
3. Copy the token → `HUGGINGFACE_API_KEY`

### 4. Google OAuth (for Calendar/Gmail)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable APIs:
   - Google Calendar API
   - Gmail API
4. Go to **APIs & Services > Credentials**
5. Click **Create Credentials > OAuth client ID**
6. Select "Web application"
7. Add Authorized redirect URI:
   ```
   http://localhost:8000/api/google-auth/callback
   ```
8. Copy:
   - **Client ID** → `GOOGLE_CLIENT_ID`
   - **Client Secret** → `GOOGLE_CLIENT_SECRET`

> ⚠️ **Important:** The redirect URI must match EXACTLY:
> - In Google Cloud Console: `http://localhost:8000/api/google-auth/callback`
> - In `.env`: `GOOGLE_REDIRECT_URI=http://localhost:8000/api/google-auth/callback`

---

## 🗄️ Database Setup

Run the SQL scripts in your **Supabase SQL Editor** in this order:

### Essential Scripts (Run in order)

| Order | Script | Purpose |
|-------|--------|---------|
| 1 | `00-initial-schema.sql` | Base tables (conversations, messages, knowledge_base) |
| 2 | `phase2-auth-schema.sql` | Auth support, user_id, RLS policies |
| 3 | `phase1-huggingface-schema.sql` | Vector search (384 dimensions) |
| 4 | `phase5-agentic-ai-schema.sql` | Agent tables (actions, OAuth tokens) |
| 5 | `create-avatar-storage.sql` | Avatar storage bucket |
| 6 | `setup-messages-rls.sql` | Messages RLS policies |

### Fix Scripts (Run if needed)

Located in `backend/database/fixes/`:

| Script | When to Use |
|--------|-------------|
| `fix-user-profile-final.sql` | Profile update/creation fails |
| `fix-conversations-foreign-key.sql` | "Foreign key violation" errors |
| `fix-knowledge-base-rls.sql` | Knowledge base access issues |
| `fix-oauth-tokens-rls.sql` | Google OAuth token storage fails |
| `fix-avatar-storage.sql` | Avatar upload fails |
| `fix-missing-agent-preferences.sql` | Agent preferences missing |

---

## 📚 Load Knowledge Base

Populate the vector database with company data:

```bash
# From the root directory
npm run load-kb
```

---

## 🚀 Start Development Servers

### Option A: Run Both Together (Recommended)

```bash
npm run dev
```

This starts both backend (port 8000) and frontend (port 3000).

### Option B: Run Separately

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/api/health

---

## 🔧 Available Scripts

### Root Level

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both servers |
| `npm run setup` | Install all dependencies |
| `npm run setup:backend` | Install backend deps |
| `npm run setup:frontend` | Install frontend deps |
| `npm run load-kb` | Load knowledge base |

### Backend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with nodemon |
| `npm start` | Production start |
| `npm test` | Run all unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

---

## 🧪 Testing

The backend includes 90+ unit tests covering validators, middleware, utilities, and constants.

```bash
# Run all tests
cd backend && npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Structure

```
backend/tests/
├── constants/
│   └── index.test.js          # Constants validation
├── middleware/
│   └── validationMiddleware.test.js  # Middleware tests
├── utils/
│   ├── apiResponse.test.js    # Response utility tests
│   ├── envValidator.test.js   # Environment validation tests
│   ├── gracefulShutdown.test.js  # Shutdown handler tests
│   └── healthCheck.test.js    # Health check tests
├── validators/
│   └── chatValidators.test.js # Joi schema tests
└── setup.js                   # Test configuration
```

---

## 🏥 Health Checks

The backend provides multiple health check endpoints for monitoring and orchestration:

| Endpoint | Purpose | Use Case |
|----------|---------|----------|
| `GET /api/health` | Quick status | Load balancer health check |
| `GET /api/health?detailed=true` | Full diagnostics | Debugging & monitoring |
| `GET /api/health/live` | Liveness probe | Kubernetes liveness |
| `GET /api/health/ready` | Readiness probe | Kubernetes readiness |

### Example Detailed Response

```json
{
  "success": true,
  "status": "healthy",
  "version": "1.0.0",
  "environment": "development",
  "uptime": "2h 15m 30s",
  "timestamp": "2025-12-04T02:00:00.000Z",
  "services": {
    "database": { "status": "healthy", "latency": "45ms" },
    "gemini": { "status": "configured" },
    "googleOAuth": { "status": "configured" },
    "huggingFace": { "status": "configured" }
  },
  "memory": {
    "heapUsed": "45MB",
    "heapTotal": "65MB"
  },
  "nodeVersion": "v18.17.0"
}
```

---

## ✅ Environment Validation

The backend validates all required environment variables on startup. If any are missing or invalid, it exits with clear error messages.

### Validated Variables

| Variable | Required | Validation |
|----------|----------|------------|
| `SUPABASE_URL` | ✅ | Must be valid Supabase URL |
| `SUPABASE_ANON_KEY` | ✅ | Must be valid key format |
| `SUPABASE_JWT_SECRET` | ✅ | Must be at least 32 characters |
| `GEMINI_API_KEY` | ✅ | Must be valid API key |
| `GOOGLE_CLIENT_ID` | ❌ | Required if using Google OAuth |
| `GOOGLE_CLIENT_SECRET` | ❌ | Required if `GOOGLE_CLIENT_ID` is set |
| `GOOGLE_REDIRECT_URI` | ❌ | Must contain `/api/google-auth/callback` |

### Error Output Example

```
❌ Environment validation failed:
   • SUPABASE_URL: Missing required environment variable
   • GEMINI_API_KEY: Appears to be invalid
Please check your .env file and ensure all required variables are set.
```

---

## 🛑 Graceful Shutdown

The backend handles shutdown signals gracefully:

- **SIGTERM/SIGINT**: Initiates graceful shutdown
- **Active Requests**: Waits up to 30 seconds for completion
- **New Requests**: Returns 503 during shutdown
- **Cleanup**: Closes database connections properly

### Shutdown Output

```
==================================================
🛑 Graceful shutdown initiated (SIGTERM)
==================================================
Active connections: 3
✅ Server stopped accepting new connections
✅ All connections closed
✅ Database connections cleaned up
==================================================
👋 Shutdown complete. Goodbye!
==================================================
```

---

## 📡 API Documentation

### Chat Endpoints

#### POST `/api/chat/message`
Send a message and get AI response.

**Request:**
```json
{
  "message": "What is the remote work policy?",
  "conversationId": "uuid (optional)",
  "files": null
}
```

**Response:**
```json
{
  "success": true,
  "conversationId": "uuid",
  "userMessage": { "role": "user", "content": "...", "timestamp": "..." },
  "aiResponse": { "role": "assistant", "content": "...", "timestamp": "..." },
  "executedActions": []
}
```

#### POST `/api/chat/regenerate`
Regenerate the last AI response.

**Request:**
```json
{
  "conversationId": "uuid",
  "messageId": "uuid"
}
```

#### GET `/api/chat/conversations`
Get all conversations for the authenticated user.

#### PUT `/api/chat/conversations/:id`
Update conversation (title, favourite, archived).

#### DELETE `/api/chat/conversations/:id`
Delete a conversation and all its messages.

### Agent Endpoints

#### POST `/api/agent/actions/approve`
Approve pending agent actions.

**Request:**
```json
{
  "actionIds": ["uuid-1", "uuid-2"]
}
```

#### POST `/api/agent/actions/reject`
Reject pending agent actions.

#### GET `/api/agent/actions`
Get pending actions for the user.

### Error Response Format

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Error code categories:
- `AUTH_1xxx` - Authentication errors
- `VAL_2xxx` - Validation errors
- `RES_3xxx` - Resource errors
- `DB_4xxx` - Database errors
- `AI_5xxx` - AI/Agent errors
- `RATE_6xxx` - Rate limiting
- `SRV_9xxx` - Server errors

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "GEMINI_API_KEY is missing"
- Create key at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Add to `backend/.env`

#### 2. "redirect_uri_mismatch" on Google Connect
- Ensure `GOOGLE_REDIRECT_URI` in `.env` matches Google Cloud Console exactly
- Correct URI: `http://localhost:8000/api/google-auth/callback`

#### 3. "401 Unauthorized" errors
- Check `SUPABASE_JWT_SECRET` is correct
- Ensure user is logged in
- Try logging out and back in

#### 4. "new row violates row-level security policy"
- Run the appropriate fix script from `database/fixes/`
- Most common: `fix-user-profile-final.sql`

#### 5. Supabase connection failed
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Ensure all SQL migrations have been run

#### 6. Port already in use

**Windows:**
```powershell
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -ti:8000 | xargs kill -9
```

#### 7. Chat messages not saving
- Run `setup-messages-rls.sql`
- Ensure conversations table has proper RLS

---

## 🆘 Support

For issues:
1. Check this troubleshooting guide
2. Verify all environment variables
3. Ensure all SQL migrations have been run
4. Check browser console and backend logs for errors
