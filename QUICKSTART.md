# ⚡ Quick Start Guide (5 Minutes)

Get your AI Onboarding Chatbot running in 3 simple steps.

## 1. Setup & Install
```bash
# Install all dependencies (Root, Backend, Frontend)
npm install
npm run setup
```

## 2. Configure Environment
**Backend:**
1.  `cd backend`
2.  `cp env.example .env`
3.  Add your keys:
    *   `GEMINI_API_KEY` (from Google AI Studio)
    *   `SUPABASE_URL` & `SUPABASE_KEY` (from Supabase)

**Frontend:**
1.  `cd frontend`
2.  `cp env.example .env.local`
3.  Add your keys (same as backend).

## 3. Run It!
Return to the root directory and start everything:
```bash
npm run dev
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend:** [http://localhost:8000](http://localhost:8000)

---
*For detailed troubleshooting and deployment, see [SETUP.md](./SETUP.md).*
