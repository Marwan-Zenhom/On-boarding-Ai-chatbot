# 🚀 Quick Start Guide

Get your AI onboarding chatbot running in 5 minutes!

## Prerequisites

- Node.js v18+ installed
- Supabase account (free tier)
- Google Gemini API key (free tier)
- Hugging Face API key (free)

---

## 1️⃣ Database Setup (5 min)

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key

### Run SQL Schema
In Supabase SQL Editor, run:
```sql
-- Copy and paste content from: backend/database/phase1-huggingface-schema.sql
```

---

## 2️⃣ Get API Keys (2 min)

### Google Gemini API Key
1. Visit [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your key

### Hugging Face API Key
1. Visit [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Click "New token" → Select "Read" access
3. Copy your token

---

## 3️⃣ Environment Setup (2 min)

### Backend `.env`
Create `backend/.env`:
```env
# Database
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here

# AI
GEMINI_API_KEY=your_gemini_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_token_here

# Server
PORT=8000
NODE_ENV=development
```

### Frontend `.env`
Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:8000
```

---

## 4️⃣ Install & Load Knowledge Base (3 min)

```powershell
# Install backend dependencies
cd backend
npm install

# Load your CSV data into the knowledge base
node scripts/loadKnowledgeBase.js
# This takes 1-2 minutes - wait for "Setup complete!"
```

**Note:** Place your 3 CSV files in `backend/data/`:
- `NovaTech_Employees__30_.csv`
- `NovaTech_FAQs__Company_.csv`
- `NovaTech_Detailed_Onboarding_Tasks.csv`

---

## 5️⃣ Install Frontend Dependencies (1 min)

```powershell
cd ../frontend
npm install
```

---

## 6️⃣ Run the Application

### Terminal 1 - Backend:
```powershell
cd backend
node server.js
```

### Terminal 2 - Frontend:
```powershell
cd frontend
npm start
```

---

## ✅ Access Your App

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000

---

## 🧪 Test It!

Ask the chatbot:
1. "Who works in Software Development?"
2. "What is Milan's email?"
3. "How many vacation days do I have?"
4. "What are the onboarding tasks for HR?"

You should see **formatted responses** with bold text and bullet lists!

---

## 🆘 Troubleshooting

### Port Already in Use
```powershell
# Kill existing processes
taskkill /F /IM node.exe
```

### Knowledge Base Issues
```powershell
# Clear and reload
cd backend
node scripts/clearKnowledgeBase.js
node scripts/loadKnowledgeBase.js
```

### API Quota Exceeded
- **Gemini:** Free tier = 1500 requests/day (resets daily)
- **Hugging Face:** Free tier = unlimited (with rate limits)

---

## 📚 Next Steps

- Read full documentation: `SETUP.md`
- Customize AI persona: `backend/services/geminiService.js`
- Modify UI styles: `frontend/src/styles/`

---

**Need help?** Check `SETUP.md` for detailed instructions!


