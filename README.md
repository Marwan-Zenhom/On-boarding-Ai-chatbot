# 🤖 Onboarding Chat - AI-Powered Employee Assistant

A full-stack onboarding chat application that helps new employees get familiar with company policies, procedures, and resources using **Google's Gemini AI**.

![Architecture](https://img.shields.io/badge/Architecture-Backend%20%2B%20Frontend-blue)
![AI](https://img.shields.io/badge/AI-Google%20Gemini%201.5%20Flash-green)
![Database](https://img.shields.io/badge/Database-Supabase-purple)
![Frontend](https://img.shields.io/badge/Frontend-React%2018-cyan)

## ⚡ **NEW: Real AI Integration!**

This project now features **real generative AI responses** using Google's Gemini AI model, replacing the previous mock responses with intelligent, context-aware assistance.

## 🏗️ Architecture

**Full-Stack Separation:**
```
backend/     → Express.js API + Gemini AI integration
frontend/    → React application
shared/      → Common types and utilities
```

## ✨ Key Features

### 🤖 **Real AI Responses**
- **Google Gemini 1.5 Flash** integration
- Context-aware conversation history
- Specialized onboarding assistant persona
- Intelligent fallback responses

### 💬 **Advanced Chat Interface**
- Dynamic input states (mic → send → stop)
- Real-time character-by-character typing
- Message regeneration with AI
- File upload support
- Message reactions and editing

### 💾 **Persistent Storage**
- Supabase database integration
- Conversation history and favorites
- Archive functionality
- Cross-device synchronization

### 🎨 **Modern UI/UX**
- Responsive design (mobile-first)
- Dark/light theme toggle
- Smooth animations and transitions
- Keyboard shortcuts ready

## 🚀 Quick Start

**For detailed setup instructions, see [SETUP.md](SETUP.md)**

### Fast Setup (3 minutes)

```bash
# 1. Install all dependencies
npm run setup

# 2. Configure environment variables
# Copy backend/env.example to backend/.env (add your API keys)
# Copy frontend/env.example to frontend/.env.local (add your API keys)

# 3. Run both servers
npm run dev
```

### Get Your API Keys

- **Gemini AI**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Supabase**: [Supabase Dashboard](https://supabase.com) > Settings > API

### Database Setup
Run the SQL from [SETUP.md](SETUP.md) in your Supabase SQL Editor.

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🛠️ Tech Stack

### Backend
- **Express.js** - REST API server
- **Google Generative AI** - Gemini 1.5 Flash model
- **Supabase** - Database and real-time updates
- **CORS, Helmet, Morgan** - Security and logging

### Frontend
- **React 18** - UI framework with hooks
- **Lucide React** - Icon library
- **CSS Modules** - Styled components
- **Fetch API** - Backend communication

### Database
- **PostgreSQL** (via Supabase)
- **Real-time subscriptions**
- **Row Level Security**

## 🔧 Development Scripts

```bash
# Root level management
npm run dev              # Start both backend and frontend
npm run setup            # Install all dependencies

# Backend development
npm run dev:backend      # Start backend with auto-reload
npm run start:backend    # Production backend start

# Frontend development  
npm run dev:frontend     # Start React development server
npm run build:frontend   # Create production build
```

## 📚 API Endpoints

### Chat API (`/api/chat/`)
- `POST /message` - Send message and get AI response
- `POST /regenerate` - Regenerate last AI response
- `GET /conversations` - Get all conversations

### System API
- `GET /api/health` - Health check

## 🎯 Use Cases

Perfect for organizations wanting to improve their onboarding experience:

- **HR Departments** - Automate common onboarding questions
- **IT Teams** - Provide instant setup guidance
- **Remote Teams** - Centralized onboarding assistance
- **Training Programs** - Interactive learning companion

## 🚀 Deployment

### Development
```bash
npm run dev  # Local development with hot reload
```

### Production
- **Backend**: Deploy to Railway, Render, or Heroku
- **Frontend**: Deploy to Vercel, Netlify, or Cloudflare Pages
- **Database**: Supabase (fully managed)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🔒 Environment Variables

**Required for Backend:**
- `GEMINI_API_KEY` - Google AI Studio API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon key

**Required for Frontend:**
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_SUPABASE_URL` - Supabase project URL (optional)
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anon key (optional)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 **Detailed Setup**: [SETUP.md](SETUP.md)
- 🐛 **Issues**: [GitHub Issues](../../issues)
- 💬 **Discussions**: [GitHub Discussions](../../discussions)

---

Built with ❤️ by [Marwan Zenhom](https://github.com/Marwan-Zenhom)
