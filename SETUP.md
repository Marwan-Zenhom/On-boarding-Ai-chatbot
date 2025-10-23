# 🚀 Setup Guide - Onboarding Chat with Gemini AI

This guide will help you set up the full-stack onboarding chat application with real AI responses.

## 📋 Prerequisites

- Node.js 18+
- Google AI Studio account (for Gemini API)
- Supabase account and project

## 🏗️ Project Structure

```
onboarding-chat/
├── backend/                 # Express.js API server
│   ├── config/             # Database configurations
│   ├── controllers/        # API route handlers
│   ├── routes/             # Route definitions
│   ├── services/           # Gemini AI integration
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

#### Backend Environment (.env)
```bash
cd backend
cp env.example .env
```

Edit `backend/.env`:
```env
PORT=8000
NODE_ENV=development

# Get these from Supabase Dashboard > Settings > API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Get this from Google AI Studio
GEMINI_API_KEY=your_gemini_api_key_here

FRONTEND_URL=http://localhost:3000
FIXED_USER_ID=550e8400-e29b-41d4-a716-446655440000
```

#### Frontend Environment (.env.local)
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

### 3. Get Your API Keys

#### Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the API key to your backend `.env` file

#### Supabase Configuration
1. Create a new project at [Supabase](https://supabase.com)
2. Go to Settings > API
3. Copy your Project URL and anon/public key
4. Add them to both backend and frontend environment files

### 4. Setup Database

Execute this SQL in your Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_favourite BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reaction TEXT,
  is_edited BOOLEAN DEFAULT FALSE,
  files JSONB
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for single-user mode
CREATE POLICY "Allow all for single user" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for single user" ON conversations FOR ALL USING (true);
CREATE POLICY "Allow all for single user" ON messages FOR ALL USING (true);
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
```

### Backend Scripts
```bash
cd backend
npm run dev              # Development with auto-reload
npm start                # Production start
```

### Frontend Scripts
```bash
cd frontend
npm start                # Development server
npm run build            # Production build
npm test                 # Run tests
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "GEMINI_API_KEY is missing"
- Make sure you've created a Gemini API key at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Add it to `backend/.env` as `GEMINI_API_KEY=your_key_here`

#### 2. "Supabase connection failed"
- Check your Supabase project URL and anon key
- Make sure they're correct in both backend and frontend env files
- Run the database setup SQL in Supabase SQL Editor

#### 3. "Failed to get AI response"
- Check that backend server is running on port 8000
- Verify `REACT_APP_API_URL=http://localhost:8000` in frontend env
- Check browser console for CORS errors

#### 4. Port already in use
```bash
# Find and kill process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9

# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Logs and Debugging

#### Backend Logs
```bash
cd backend
npm run dev
# Check console output for errors
```

#### Frontend Logs
- Open browser Developer Tools (F12)
- Check Console tab for errors
- Check Network tab for API request failures

## 🚀 Production Deployment

### Backend Deployment (Railway/Render/Heroku)
1. Deploy backend folder to your hosting platform
2. Set environment variables in hosting dashboard
3. Update `FRONTEND_URL` to your frontend domain

### Frontend Deployment (Vercel/Netlify)
1. Build frontend: `cd frontend && npm run build`
2. Deploy `build` folder to static hosting
3. Update `REACT_APP_API_URL` to your backend URL

## 📚 API Documentation

### Endpoints

#### POST `/api/chat/message`
Send a message and get AI response
```json
{
  "message": "What are the vacation policies?",
  "conversationId": "optional-uuid",
  "files": []
}
```

#### POST `/api/chat/regenerate`
Regenerate the last AI response
```json
{
  "conversationId": "uuid",
  "messageId": "uuid"
}
```

#### GET `/api/chat/conversations`
Get all conversations

#### GET `/api/health`
Health check endpoint

## 🆘 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Verify all environment variables are set correctly
3. Check browser console and terminal logs
4. Ensure all services (Supabase, Gemini API) are properly configured

For additional help, create an issue on GitHub with:
- Error messages
- Environment details
- Steps to reproduce

---

🎉 **You're all set!** Start chatting with your AI-powered onboarding assistant! 