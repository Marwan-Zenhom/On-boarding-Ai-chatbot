# 🚀 Setup Guide - Onboarding Chat with Gemini AI

This guide will help you set up the full-stack onboarding chat application with real AI responses, Agentic capabilities, and Google integration.

## 📋 Prerequisites

- **Node.js** 18+
- **Google AI Studio** account (for Gemini API)
- **Google Cloud Console** account (for OAuth)
- **Supabase** account and project

## 🏗️ Project Structure

```
onboarding-chat/
├── backend/                 # Express.js API server
│   ├── config/             # Database configurations
│   ├── controllers/        # API route handlers
│   ├── routes/             # Route definitions
│   ├── services/           # Gemini AI & Agent services
│   ├── database/           # SQL migration files
│   └── server.js           # Main server file
├── frontend/               # React application
│   ├── src/                # React source code
│   └── public/             # Static assets
└── package.json            # Root package.json for scripts
```

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
PORT=8000
NODE_ENV=development

# Supabase Configuration (Dashboard > Settings > API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Google AI (Gemini)
GEMINI_API_KEY=your_gemini_api_key_here

# Google OAuth (Required for Agentic Tools & Sign-in)
# Create credentials in Google Cloud Console > APIs & Services > Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# App Config
FRONTEND_URL=http://localhost:3000
FIXED_USER_ID=550e8400-e29b-41d4-a716-446655440000
```

#### Frontend Environment (`frontend/.env.local`)
```bash
cd frontend
cp env.example .env.local
```

Edit `frontend/.env.local`:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Database Setup

Run the SQL scripts located in `backend/database/` in your **Supabase SQL Editor** in the following order to set up tables, RLS policies, and vector search:

1.  `phase1-huggingface-schema.sql` (Vector search setup)
2.  `phase2-auth-schema.sql` (Auth & Chat tables)
3.  `phase5-agentic-ai-schema.sql` (Agentic AI system)
4.  `create-avatar-storage.sql` (Avatar storage bucket)

### 4. Load Knowledge Base

Populate the vector database with the provided company data:

```bash
# From the root directory
npm run load-kb
```

### 5. Start Development Servers

#### Option A: Run Both Together (Recommended)
```bash
npm run dev
```
This will start both backend (port 8000) and frontend (port 3000) simultaneously.

#### Option B: Run Separately
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/api/health

## 🔧 Available Scripts

### Root Level Scripts
```bash
npm run dev              # Start both backend and frontend
npm run setup            # Install all dependencies
npm run setup:backend    # Install backend dependencies only
npm run setup:frontend   # Install frontend dependencies only
npm run load-kb          # Load knowledge base data
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "GEMINI_API_KEY is missing"
- Make sure you've created a Gemini API key at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Add it to `backend/.env`

#### 2. "Google OAuth Error"
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct.
- Add `http://localhost:8000/api/auth/google/callback` to "Authorized redirect URIs" in Google Cloud Console.

#### 3. "Supabase connection failed"
- Check your Supabase project URL and anon key.
- Run the database setup SQL scripts in Supabase.

#### 4. Port already in use
```bash
# Find and kill process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9   # Linux/Mac
taskkill /F /IM node.exe        # Windows
```

## 📚 API Documentation

### Endpoints

#### POST `/api/chat/message`
Send a message and get AI response
```json
{
  "message": "Book a meeting with John",
  "conversationId": "optional-uuid",
  "files": []
}
```

#### POST `/api/agent/actions/approve`
Approve a pending agent action
```json
{
  "actionIds": ["uuid-1", "uuid-2"]
}
```

## 🆘 Support

For issues or questions:
1. Check this troubleshooting guide
2. Verify all environment variables are set correctly
3. Ensure all SQL migrations have been run