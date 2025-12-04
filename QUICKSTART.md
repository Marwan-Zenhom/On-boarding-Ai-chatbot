# ⚡ Quick Start Guide (5 Minutes)

Get your NovaTech AI Onboarding Assistant running in 4 simple steps.

## Prerequisites

- **Node.js** 18+ installed
- **Supabase** account (free tier: [supabase.com](https://supabase.com))
- **Gemini API Key** (free: [Google AI Studio](https://makersuite.google.com/app/apikey))

---

## 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/On-boarding-Ai-chatbot.git
cd On-boarding-Ai-chatbot

# Install all dependencies
npm install
npm run setup
```

---

## 2. Configure Backend

```bash
cd backend
cp env.example .env
```

Edit `backend/.env` with your keys:

```env
PORT=8000
NODE_ENV=development

# Supabase (from Dashboard > Settings > API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# AI (from Google AI Studio)
GEMINI_API_KEY=your_gemini_key

# Hugging Face (optional but recommended)
HUGGINGFACE_API_KEY=your_hf_token

# Google OAuth (optional - for Calendar/Gmail)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/google-auth/callback

FRONTEND_URL=http://localhost:3000
```

---

## 3. Configure Frontend

```bash
cd ../frontend
cp env.example .env.local
```

Edit `frontend/.env.local`:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

---

## 4. Setup Database & Run

### Run SQL Migrations

In **Supabase SQL Editor**, run these scripts from `backend/database/` in order:

1. `00-initial-schema.sql`
2. `phase2-auth-schema.sql`
3. `phase1-huggingface-schema.sql`
4. `phase5-agentic-ai-schema.sql`
5. `create-avatar-storage.sql`
6. `setup-messages-rls.sql`

### Start the App

```bash
# From root directory
cd ..
npm run dev
```

---

## 🎉 You're Done!

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **Detailed Health:** [http://localhost:8000/api/health?detailed=true](http://localhost:8000/api/health?detailed=true)

---

## 🧪 Run Tests (Optional)

```bash
cd backend && npm test
```

90+ tests covering validators, middleware, and utilities.

---

## Having Issues?

| Problem | Solution |
|---------|----------|
| 401 Unauthorized | Check `SUPABASE_JWT_SECRET` |
| Database errors | Run fix scripts from `database/fixes/` |
| Google OAuth fails | Verify `GOOGLE_REDIRECT_URI` matches Cloud Console |
| Env validation fails | Check startup logs for missing variables |

For detailed troubleshooting, see **[SETUP.md](./SETUP.md)**.
