# 🤖 NovaTech AI Onboarding Assistant

<div align="center">

![NovaTech AI](https://img.shields.io/badge/AI-Agentic-blue?style=for-the-badge&logo=google-gemini)
![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=for-the-badge&logo=react)
![Express](https://img.shields.io/badge/Backend-Express.js-000000?style=for-the-badge&logo=express)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase)

**An enterprise-grade Agentic AI chatbot designed to streamline employee onboarding.**  
*Powered by Google Gemini 2.0 Flash, RAG, and Autonomous Tool Use.*

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Tech Stack](#-technology-stack)

</div>

---

## ✨ Features

### 🧠 Advanced Agentic AI ("Nova")
- **Multi-Step Workflows:** Capable of executing complex tasks like *"Check my calendar for next week and book a meeting with John."*
- **Autonomous Tool Use:** Intelligently utilizes a suite of tools:
  - 📅 **Calendar:** Check availability and book events
  - 📧 **Email:** Draft and send emails to colleagues
  - 👥 **Directory:** Look up employee details and team structures
- **Human-in-the-Loop:** Built-in **Approval Workflow** ensures no critical action (like sending emails) happens without your explicit confirmation via a secure UI.

### 🔍 Intelligent Search & Context
- **Hybrid RAG Engine:** Combines **Semantic Search** (Hugging Face embeddings) with **Context-Aware Keyword Search** for maximum accuracy.
- **Smart Context:** Analyzes the last 20 messages to understand pronouns and implicit references (e.g., *"What is **his** email?"*).
- **Smart Greeting System:** Bypasses expensive vector searches for natural, instant greetings.

### 🎨 Modern Frontend Experience
- **Human-in-the-Loop UI:** Dedicated `ActionApprovalModal` for reviewing and approving agent actions.
- **Profile Management:** Complete avatar upload system and user profile settings.
- **Design System:** Modular, responsive UI with native Dark/Light mode switching.
- **Rich Interactions:** Markdown rendering, typing indicators, and message actions (copy, edit, regenerate).

### 🛡️ Enterprise-Grade Resilience
- **Audit Logging:** Every agent action is tracked with execution time and status for full observability.
- **Action Templates:** Pre-defined workflows (e.g., "Vacation Request") for consistent process execution.
- **Robust Error Handling:** Exponential backoff retry logic for all AI API calls ensures stability under load.
- **Security:** Row Level Security (RLS) and secure Google OAuth 2.0 authentication.

---

## �️ Architecture

The system follows a modular **Agentic RAG Architecture**:

```mermaid
graph TD
    User[👤 User] <--> Frontend[⚛️ React Frontend]
    Frontend <--> API[🚀 Express Backend]
    
    subgraph "Backend Services"
        API <--> Auth[🔐 Supabase Auth]
        API <--> Agent[🤖 Agent Service]
        
        Agent <--> Router{🧠 Intent Router}
        
        Router -- "Greeting" --> Direct[💬 Instant Response]
        Router -- "Query" --> RAG[📚 RAG Engine]
        Router -- "Action" --> Tools[🛠️ Tool Executor]
        
        RAG <--> VectorDB[(🗄️ Supabase Vector)]
        RAG <--> Embed[🤗 Hugging Face]
        
        Tools -- "Requires Approval" --> Approval[⚠️ Approval System]
        Approval -- "Approved" --> External[🌐 External APIs]
        
        External <--> Google[📅 Google Workspace]
    end
    
    Agent <--> Gemini[✨ Google Gemini 2.0]
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **Supabase** account (free tier)
- **Google Cloud** project (for OAuth & Gemini)
- **Hugging Face** token

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/On-boarding-Ai-chatbot.git
   cd On-boarding-Ai-chatbot
   ```

2. **Fast Setup:**
   Follow our **[5-Minute Quick Start Guide](QUICKSTART.md)** to get up and running immediately.

3. **Detailed Configuration:**
   For production setup and environment variables, see **[SETUP.md](SETUP.md)**.

---

## 📁 Project Structure

```
On-boarding-Ai-chatbot/
├── backend/                        # Express.js API Server
│   ├── config/                     # Database & App Config
│   ├── controllers/                # Request Handlers
│   ├── database/                   # SQL Schemas & Migrations
│   │   └── phase5-agentic-ai.sql   # Agent System Schema
│   ├── routes/                     # API Endpoints
│   │   ├── agentRoutes.js          # Agent & Approval Routes
│   │   └── googleAuthRoutes.js     # OAuth Integration
│   ├── services/                   # Business Logic
│   │   ├── agentService.js         # Core Agent Logic
│   │   ├── tools/                  # Tool Definitions
│   │   ├── geminiService.js        # LLM Integration
│   │   └── knowledgeBaseService.js # RAG Implementation
│   └── scripts/                    # Maintenance Scripts
│
├── frontend/                       # React 19 Application
│   ├── src/
│   │   ├── components/             # Reusable UI Components
│   │   │   └── ActionApprovalModal # Human-in-the-Loop UI
│   │   ├── contexts/               # State Management (Auth)
│   │   ├── styles/                 # CSS Design System
│   │   └── App.js                  # Main Application
│   └── public/
│
├── QUICKSTART.md                   # Fast Setup Guide
├── SETUP.md                        # Comprehensive Documentation
└── README.md                       # Project Overview
```

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework:** React 19
- **Routing:** React Router DOM
- **Styling:** CSS Modules with Design Tokens (Variables)
- **Icons:** Lucide React
- **Markdown:** React Markdown + Remark GFM

### **Backend**
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Security:** Helmet, CORS, Express Rate Limit
- **Logging:** Winston, Morgan

### **AI & Data**
- **LLM:** Google Gemini 2.0 Flash (`gemini-2.0-flash-exp`)
- **Embeddings:** Hugging Face (`BAAI/bge-small-en-v1.5`)
- **Database:** Supabase (PostgreSQL 15 + `pgvector`)
- **Storage:** Supabase Storage (Avatars)
- **Auth:** Supabase Auth + Google OAuth 2.0

---

## 🎯 How It Works

1.  **Intent Recognition:** The Agent analyzes your message to decide if it's a greeting, a knowledge query, or a task.
2.  **RAG (Retrieval Augmented Generation):**
    *   If it's a query, it converts your question into a vector.
    *   It searches the Knowledge Base for relevant policies or employee info.
    *   It combines this context with your conversation history.
3.  **Tool Execution (Agentic):**
    *   If you ask to "Book a meeting", the Agent identifies the `book_calendar_event` tool.
    *   It extracts the necessary parameters (date, time, attendees).
    *   **Safety Check:** It pauses and requests your approval via the UI.
    *   Once approved, it executes the API call to Google Calendar.

---

## 🧪 Example Queries

Try these to see the Agent in action:

*   **Complex Action:** *"Check my calendar for tomorrow afternoon. If I'm free, book a sync with Milan at 2 PM."*
*   **Contextual Query:** *"Who is the head of Engineering? What is **her** email?"*
*   **Policy Search:** *"What is the policy for remote work?"*
*   **Onboarding:** *"What are my tasks for the first week?"*

---

## 📝 License

This project is a thesis prototype designed for educational and demonstration purposes.

---

<div align="center">
  <sub>Built with ❤️ by [Your Name]</sub>
</div>
