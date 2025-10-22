# 🤖 AI-Powered Onboarding Chatbot

An intelligent chatbot designed to help new employees navigate their onboarding journey at NovaTech. Built with React, Express, and Google Gemini AI, featuring semantic search over a custom knowledge base.

---

## ✨ Features

### 🧠 Intelligent AI Assistant
- **Semantic Search:** Finds relevant information using vector embeddings (Hugging Face)
- **Context-Aware:** Remembers conversation history and understands follow-up questions
- **Natural Language:** Friendly, conversational responses with proper formatting
- **Knowledge Base:** Pre-loaded with employee data, FAQs, and onboarding tasks

### 💬 Modern Chat Interface
- **Real-time Messaging:** Instant responses with typing indicators
- **Rich Formatting:** Markdown rendering with bold text, lists, and proper spacing
- **Multi-Conversation:** Create and manage multiple chat sessions
- **Dark/Light Theme:** Toggle between themes
- **Voice Input:** Speech-to-text support
- **Message Actions:** Copy, edit, regenerate, and react to messages

### 🔒 Secure & Scalable
- **Backend API:** Express.js REST API with proper error handling
- **Database:** PostgreSQL (Supabase) with vector search capabilities
- **Environment Variables:** Secure credential management
- **Retry Logic:** Handles API overload gracefully

---

## 🏗️ Architecture

```
┌─────────────┐
│   React     │ ← Frontend (Port 3000)
│  Frontend   │   - Modern UI with Lucide icons
└──────┬──────┘   - Markdown rendering
       │          - State management
       ↓
┌─────────────┐
│   Express   │ ← Backend API (Port 8000)
│   Backend   │   - RESTful endpoints
└──────┬──────┘   - Business logic
       │
       ├─→ Google Gemini AI (Text generation)
       ├─→ Hugging Face (Vector embeddings)
       └─→ Supabase (PostgreSQL + pgvector)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- Supabase account (free tier)
- Google Gemini API key (free)
- Hugging Face token (free)

### Installation

1. **Clone and setup:**
   ```bash
   cd On-boarding-Ai-chatbot
   ```

2. **Follow the Quick Start Guide:**
   See `QUICKSTART.md` for step-by-step instructions (5 minutes)

3. **Or follow detailed setup:**
   See `SETUP.md` for comprehensive documentation

---

## 📁 Project Structure

```
On-boarding-Ai-chatbot/
├── backend/                # Express.js API server
│   ├── config/            # Database configuration
│   ├── controllers/       # Request handlers
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   │   ├── geminiService.js         # AI response generation
│   │   ├── knowledgeBaseService.js  # Vector embeddings & search
│   │   └── keywordSearchService.js  # Fallback keyword search
│   ├── scripts/          # Utility scripts
│   │   ├── loadKnowledgeBase.js    # CSV loader
│   │   └── clearKnowledgeBase.js   # Data cleanup
│   ├── database/         # SQL schemas
│   └── data/             # CSV knowledge base files
│
├── frontend/              # React application
│   ├── src/
│   │   ├── App.js        # Main component
│   │   ├── services/     # API client
│   │   └── styles/       # CSS modules
│   └── public/           # Static assets
│
├── QUICKSTART.md         # 5-minute setup guide
├── SETUP.md             # Detailed documentation
└── README.md            # This file
```

---

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **Lucide React** - Icon library
- **React Markdown** - Formatted message rendering
- **Remark GFM** - GitHub Flavored Markdown

### Backend
- **Express.js** - Web framework
- **Google Gemini AI** - Text generation (gemini-2.0-flash)
- **Hugging Face** - Vector embeddings (all-MiniLM-L6-v2)
- **Supabase** - PostgreSQL database with pgvector extension
- **Node.js 18+** - Runtime environment

---

## 🔑 API Endpoints

### Chat Endpoints
- `POST /api/chat/message` - Send a message
- `POST /api/chat/regenerate/:messageId` - Regenerate response
- `GET /api/chat/conversations` - Get all conversations
- `PUT /api/chat/conversations/:id` - Update conversation
- `DELETE /api/chat/conversations/:id` - Delete conversation

### Health Check
- `GET /api/health` - Server status

---

## 🎯 How It Works

### 1. **User asks a question**
   → Frontend sends message to backend

### 2. **Semantic Search**
   → Generate embedding for user query (Hugging Face)
   → Search knowledge base using vector similarity (Supabase)
   → Retrieve top 3 most relevant documents

### 3. **AI Response Generation**
   → Build context with retrieved documents + conversation history
   → Send to Google Gemini with formatting instructions
   → Return formatted response with markdown

### 4. **Frontend Rendering**
   → Parse markdown (bold, lists, line breaks)
   → Display beautifully formatted response

---

## 🧪 Example Queries

Try asking:
- **Employee Info:** "Who is Milan Nguyen? What's his email?"
- **Department Search:** "Who works in Software Development?"
- **Company Policies:** "How many vacation days do I have?"
- **Onboarding Tasks:** "What are the onboarding tasks for HR?"
- **Follow-up Questions:** "What's his role?" (after asking about someone)

---

## 📊 Knowledge Base

The system uses 3 CSV files:

1. **Employees** (30 records)
   - Names, ages, departments, roles, emails, supervisors

2. **FAQs** (Company Policies)
   - Vacation days, sick leave, health insurance, etc.

3. **Onboarding Tasks** (By Department)
   - Preboarding, Day 1, Week 1, Month 1 tasks

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
HUGGINGFACE_API_KEY=your_huggingface_token
PORT=8000
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:8000
```

---

## 🚦 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Access at: http://localhost:3000

---

## 🐛 Troubleshooting

### Common Issues

**1. Port already in use**
```bash
taskkill /F /IM node.exe  # Windows
```

**2. Gemini API overloaded (503)**
- System automatically retries 3 times with exponential backoff
- Wait a few seconds and try again

**3. No search results**
- Check if knowledge base is loaded: `backend/data/` should have 3 CSV files
- Reload: `node scripts/loadKnowledgeBase.js`

**4. Frontend warnings (ESLint)**
- Warnings are normal and don't affect functionality
- React markdown components intentionally use dynamic content

---

## 📈 Future Enhancements (Phase 2)

- [ ] User authentication (OAuth 2.0)
- [ ] Multi-user support with isolated chat histories
- [ ] Role-based access control
- [ ] Admin dashboard for knowledge base management
- [ ] Analytics and usage tracking
- [ ] Multi-language support
- [ ] File upload and processing

---

## 📝 License

This project is part of a thesis prototype.

---

## 🤝 Support

For issues or questions:
1. Check `SETUP.md` for detailed documentation
2. Review `QUICKSTART.md` for common setup issues
3. Ensure all environment variables are correctly set
4. Verify API keys are valid and have sufficient quota

---

## 🎓 Thesis Project

**Project:** AI-Powered Onboarding Chat Assistant  
**Institution:** [Your University]  
**Year:** 2025  
**Purpose:** Prototype demonstrating RAG (Retrieval Augmented Generation) for enterprise onboarding

---

**Built with ❤️ using React, Express, Google Gemini, and Hugging Face**
