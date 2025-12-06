# NovaTech AI Onboarding Assistant - Project Documentation

> **Version:** 1.1.0  
> **Last Updated:** December 6, 2025  
> **Author:** Marwan Zenhom  
> **Status:** Prototype (Local Development)  
> **Recent Update:** Hybrid Knowledge Base with SQL + Vector Search

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Features](#4-features)
5. [Project Structure](#5-project-structure)
6. [Backend Details](#6-backend-details)
7. [Frontend Details](#7-frontend-details)
8. [Database Schema](#8-database-schema)
9. [API Reference](#9-api-reference)
10. [Authentication & Security](#10-authentication--security)
11. [Testing Infrastructure](#11-testing-infrastructure)
12. [Configuration](#12-configuration)
13. [Refactoring History](#13-refactoring-history)
14. [Known Issues & Limitations](#14-known-issues--limitations)
15. [Future Improvements](#15-future-improvements)

---

## 1. Project Overview

### 1.1 Purpose

NovaTech AI Onboarding Assistant is an enterprise-grade agentic AI chatbot designed to help new employees navigate company policies, procedures, and resources. It combines conversational AI with real-world actions like calendar booking and email sending.

### 1.2 Key Capabilities

- **Conversational AI**: Natural language interaction powered by Google Gemini 2.0 Flash
- **Agentic Workflows**: Multi-step task execution with human-in-the-loop approval
- **RAG (Retrieval-Augmented Generation)**: Knowledge base search for accurate company information
- **Google Workspace Integration**: Calendar events and email capabilities
- **Conversation Management**: History, favorites, archives, and search

### 1.3 Use Case

A new employee can ask:
- "What are the company's vacation policies?"
- "Schedule a meeting with my supervisor for next Monday"
- "Send an email to HR about my onboarding documents"
- "Who are my team members?"

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Chat UI   │  │  Sidebar    │  │   Settings/Modals       │ │
│  │             │  │             │  │                         │ │
│  │ • Messages  │  │ • History   │  │ • Profile Settings      │ │
│  │ • Input     │  │ • Favorites │  │ • Google Connection     │ │
│  │ • Voice     │  │ • Search    │  │ • Action Approval       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Express.js)                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     Middleware Layer                        ││
│  │  • Authentication  • Validation  • Rate Limiting  • CORS   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Controller Layer                         ││
│  │  • chatController  • agentController  • authController     ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     Service Layer                           ││
│  │  • AIAgent         • ConversationService  • ToolExecutor   ││
│  │  • GeminiService   • KnowledgeBaseService                  ││
│  └─────────────────────────────────────────────────────────────┘│
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Supabase    │   │  Google APIs  │   │  Gemini AI    │
│               │   │               │   │               │
│ • Auth        │   │ • Calendar    │   │ • Chat        │
│ • Database    │   │ • Gmail       │   │ • Function    │
│ • Storage     │   │ • OAuth       │   │   Calling     │
└───────────────┘   └───────────────┘   └───────────────┘
```

### 2.2 Request Flow

```
User Message → Frontend → API Service → Backend
                                           │
                                           ▼
                               ┌─ Auth Middleware
                               │
                               ├─ Validation Middleware
                               │
                               ├─ Controller (route handler)
                               │
                               ├─ Service Layer (business logic)
                               │
                               └─ External Services (Gemini, Supabase, Google)
```

### 2.3 Agentic AI Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   User       │────▶│  AI Agent    │────▶│  Gemini API  │
│   Message    │     │  Process     │     │  + Tools     │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   Function Calls?       │
              └─────────────────────────┘
                     │           │
                    Yes          No
                     │           │
                     ▼           ▼
        ┌─────────────────┐  ┌─────────────────┐
        │ Requires        │  │ Return Text     │
        │ Approval?       │  │ Response        │
        └─────────────────┘  └─────────────────┘
              │       │
             Yes      No
              │       │
              ▼       ▼
        ┌─────────┐  ┌─────────────────┐
        │ Store   │  │ Execute Tool    │
        │ Pending │  │ Immediately     │
        │ Actions │  └─────────────────┘
        └─────────┘
              │
              ▼
        ┌─────────────────┐
        │ Wait for User   │
        │ Approval        │
        └─────────────────┘
              │
              ▼
        ┌─────────────────┐
        │ Execute on      │
        │ Approval        │
        └─────────────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.0 | UI framework |
| React Router | 7.9.4 | Client-side routing |
| Supabase JS | 2.50.1 | Auth & database client |
| Lucide React | 0.513.0 | Icons |
| React Markdown | 10.1.0 | Markdown rendering |
| Remark GFM | 4.0.1 | GitHub Flavored Markdown |

### 3.2 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | ≥18.0.0 | Runtime |
| Express | 4.18.2 | Web framework |
| Google Generative AI | 0.21.0 | Gemini API client |
| Supabase JS | 2.39.0 | Database client |
| Google APIs | 164.1.0 | Calendar/Gmail |
| Joi | 18.0.2 | Input validation |
| Helmet | 7.1.0 | Security headers |
| Winston | 3.18.3 | Logging |
| JWT | 9.0.2 | Token verification |

### 3.3 Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| Jest | 30.2.0 | Test runner (backend) |
| Supertest | 7.1.4 | HTTP assertions |
| Testing Library | 16.3.0 | React component testing |

### 3.4 Infrastructure

| Service | Purpose |
|---------|---------|
| Supabase | Auth, PostgreSQL database, storage |
| Google Cloud | OAuth, Calendar API, Gmail API, Gemini API |

---

## 4. Features

### 4.1 Core Features

| Feature | Status | Description |
|---------|--------|-------------|
| AI Chat | ✅ Complete | Natural language conversations with Gemini 2.0 Flash |
| Conversation History | ✅ Complete | Persistent storage with search and filters |
| Favorites & Archives | ✅ Complete | Organize conversations |
| Message Reactions | ✅ Complete | Like/dislike responses |
| Message Regeneration | ✅ Complete | Re-generate AI responses |
| Message Editing | ✅ Complete | Edit sent messages |
| Dark/Light Theme | ✅ Complete | System-respecting theme toggle |
| Voice Input | ✅ Complete | Speech-to-text support |

### 4.2 Agentic Features

| Feature | Status | Description |
|---------|--------|-------------|
| Knowledge Base Search | ✅ Complete | RAG-powered company info retrieval |
| Calendar Integration | ✅ Complete | View and book calendar events |
| Email Sending | ✅ Complete | Send emails via Gmail |
| Team Member Lookup | ✅ Complete | Find colleagues by dept/role |
| Supervisor Info | ✅ Complete | Get supervisor contact details |
| Action Approval | ✅ Complete | Human-in-the-loop for sensitive actions |
| Date/Time Awareness | ✅ Complete | Agent knows current date, handles "tomorrow", "next week" |
| All-Day Event Support | ✅ Complete | Vacation/leave auto-creates all-day calendar events |

### 4.3 Security Features

| Feature | Status | Description |
|---------|--------|-------------|
| Google OAuth Login | ✅ Complete | Secure authentication |
| JWT Verification | ✅ Complete | Token-based API auth |
| Row Level Security | ✅ Complete | Database-level isolation |
| Rate Limiting | ✅ Complete | API abuse prevention |
| Input Validation | ✅ Complete | Joi schema validation |
| CORS Protection | ✅ Complete | Origin restrictions |
| Helmet Headers | ✅ Complete | Security headers |

---

## 5. Project Structure

### 5.1 Root Directory

```
On-boarding-Ai-chatbot/
├── backend/                    # Express.js server
├── frontend/                   # React application
├── package.json               # Root package with scripts
├── README.md                  # Project overview
├── SETUP.md                   # Detailed setup guide
├── QUICKSTART.md              # Quick start guide
├── PROJECT_DOCUMENTATION.md   # This file
└── .gitignore                 # Git ignore rules
```

### 5.2 Backend Structure

```
backend/
├── config/
│   ├── database.js           # Supabase client initialization
│   └── logger.js             # Winston logger configuration
│
├── constants/
│   └── index.js              # Centralized constants
│                              # - AI_MODELS, RATE_LIMITS
│                              # - HTTP_STATUS, ERROR_CODES
│                              # - SUCCESS_MESSAGES
│
├── controllers/
│   ├── agentController.js    # Agentic AI endpoints
│   ├── authController.js     # Authentication endpoints
│   └── chatController.js     # Chat/conversation endpoints
│
├── middleware/
│   ├── authMiddleware.js     # JWT verification
│   └── validationMiddleware.js # Joi validation wrapper
│
├── routes/
│   ├── agentRoutes.js        # /api/agent/*
│   ├── authRoutes.js         # /api/auth/*
│   ├── chatRoutes.js         # /api/chat/*
│   └── googleAuthRoutes.js   # /api/google-auth/*
│
├── services/
│   ├── agentService.js       # AIAgent class
│   │                          # - Multi-step reasoning
│   │                          # - Tool execution
│   │                          # - Error classification
│   │
│   ├── conversationService.js # Conversation CRUD
│   │                          # - Message management
│   │                          # - User ownership checks
│   │
│   ├── geminiService.js      # Direct Gemini API calls
│   │
│   ├── knowledgeBaseService.js # Vector embeddings & semantic search
│   │
│   ├── knowledgeQueryService.js # SQL queries for structured data
│   │                            # - Employee lookups
│   │                            # - Task/FAQ filtering by role
│   │                            # - Manager relationships
│   │
│   └── tools/
│       ├── toolExecutor.js   # Tool execution engine
│       └── toolsRegistry.js  # Available tools registry
│
├── utils/
│   ├── apiResponse.js        # Standardized responses
│   ├── envValidator.js       # Environment validation
│   ├── gracefulShutdown.js   # Clean server shutdown
│   └── healthCheck.js        # Health check utilities
│
├── validators/
│   └── chatValidators.js     # Joi schemas for chat
│
├── tests/                    # Jest test suites
│   ├── setup.js              # Test configuration
│   ├── constants/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   └── validators/
│
├── database/                 # SQL migration scripts
│   ├── 00-initial-schema.sql # Main schema
│   ├── phase1-*.sql          # Feature migrations
│   └── fixes/                # Troubleshooting scripts
│
├── scripts/
│   ├── loadKnowledgeBase.js  # KB data loader
│   └── clearKnowledgeBase.js # KB data clearer
│
├── data/                     # Knowledge base CSV files
├── logs/                     # Winston log files
├── server.js                 # Application entry point
├── jest.config.js            # Jest configuration
├── package.json              # Dependencies
└── env.example               # Environment template
```

### 5.3 Frontend Structure

```
frontend/src/
├── components/
│   ├── chat/
│   │   ├── ChatContainer.jsx   # Main chat area orchestrator
│   │   ├── ChatInput.jsx       # Message input with voice
│   │   ├── ChatMessages.jsx    # Message list renderer
│   │   ├── MessageItem.jsx     # Single message component
│   │   └── WelcomeScreen.jsx   # Initial welcome UI
│   │
│   ├── sidebar/
│   │   ├── Sidebar.jsx         # Main sidebar component
│   │   └── UserMenu.jsx        # User profile dropdown
│   │
│   ├── auth/
│   │   └── ProtectedRoute.js   # Auth route guard
│   │
│   ├── __tests__/              # Component tests
│   │   ├── Toast.test.jsx
│   │   ├── ErrorBoundary.test.jsx
│   │   └── SkeletonLoader.test.jsx
│   │
│   ├── ActionApprovalModal.jsx # Action approval UI
│   ├── ArchivedConversationsModal.jsx
│   ├── ConversationDropdown.jsx
│   ├── ErrorBoundary.jsx       # Error boundary wrapper
│   ├── FileUpload.jsx          # File upload component
│   ├── GoogleConnectionSettings.jsx
│   ├── MessageActions.jsx      # Message action buttons
│   ├── ProfileSettingsModal.jsx
│   ├── SkeletonLoader.jsx      # Loading skeleton
│   └── Toast.jsx               # Toast notifications
│
├── contexts/
│   ├── AuthContext.js         # Authentication state
│   └── ThemeContext.js        # Theme state (dark/light)
│
├── hooks/
│   ├── __tests__/             # Hook tests
│   │   ├── useChat.test.js
│   │   └── useLocalStorage.test.js
│   │
│   ├── useChat.js             # Chat state & logic
│   ├── useConversations.js    # Conversation management
│   ├── useLocalStorage.js     # localStorage wrapper
│   ├── useSpeechRecognition.js # Voice input
│   └── useTypingEffect.js     # Typing animation
│
├── pages/
│   ├── ChatPage.js            # Main chat page
│   ├── LoginPage.js           # Login page
│   └── SignupPage.js          # Signup page
│
├── services/
│   └── apiService.js          # API client service
│
├── styles/                    # CSS modules
│   ├── variables.css          # CSS custom properties
│   ├── base.css               # Base styles
│   ├── layout.css             # Layout styles
│   ├── chat.css               # Chat-specific styles
│   ├── sidebar.css            # Sidebar styles
│   ├── modals.css             # Modal styles
│   ├── components.css         # Component styles
│   ├── input.css              # Input styles
│   ├── animations.css         # Animation keyframes
│   ├── responsive.css         # Responsive breakpoints
│   └── auth.css               # Auth page styles
│
├── __mocks__/
│   └── apiService.js          # Mock API for tests
│
├── App.js                     # Main app component
├── App.test.js                # App tests
├── AppRouter.js               # Route definitions
├── index.js                   # Entry point
├── index.css                  # Global styles
├── setupTests.js              # Test setup
└── supabaseClient.js          # Supabase client
```

---

## 6. Backend Details

### 6.1 Constants (`backend/constants/index.js`)

```javascript
// AI Models
export const AI_MODELS = {
  DEFAULT: 'gemini-2.0-flash',
  GEMINI_FLASH: 'gemini-2.0-flash'
};

// Rate Limits
export const RATE_LIMITS = {
  GENERAL: { WINDOW_MS: 60000, MAX_REQUESTS: 100 },
  AUTH: { WINDOW_MS: 900000, MAX_REQUESTS: 5 }
};

// Request Limits
export const REQUEST_LIMITS = {
  MAX_MESSAGE_LENGTH: 10000,
  MAX_FILES_PER_MESSAGE: 5,
  MAX_FILE_SIZE_MB: 10,
  MAX_CONVERSATION_HISTORY: 50
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200, CREATED: 201, BAD_REQUEST: 400,
  UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404,
  INTERNAL_ERROR: 500
};

// Error Codes (categorized)
export const ERROR_CODES = {
  // Authentication (AUTH_1xxx)
  INVALID_TOKEN: 'AUTH_1001',
  TOKEN_EXPIRED: 'AUTH_1002',
  
  // Validation (VAL_2xxx)
  VALIDATION_ERROR: 'VAL_2001',
  INVALID_INPUT: 'VAL_2002',
  
  // Resources (RES_3xxx)
  CONVERSATION_NOT_FOUND: 'RES_3001',
  MESSAGE_NOT_FOUND: 'RES_3002',
  RESOURCE_ACCESS_DENIED: 'RES_3003',
  
  // Database (DB_4xxx)
  DATABASE_ERROR: 'DB_4001',
  
  // AI (AI_5xxx)
  AI_GENERATION_FAILED: 'AI_5001',
  AI_SERVICE_UNAVAILABLE: 'AI_5002',
  
  // Rate Limiting (RATE_6xxx)
  RATE_LIMIT_EXCEEDED: 'RATE_6001'
};
```

### 6.2 API Response Utilities (`backend/utils/apiResponse.js`)

```javascript
// Success Response
export const successResponse = (res, data, message = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
};

// Error Response
export const errorResponse = (res, message, code, statusCode = 500, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && details && { details })
  });
};

// Convenience methods
export const validationError = (res, errors) => { ... };
export const unauthorizedError = (res, message, code) => { ... };
export const forbiddenError = (res, message) => { ... };
export const notFoundError = (res, message) => { ... };
export const internalError = (res, message, details) => { ... };
```

### 6.3 Service Layer Pattern

The backend follows a layered architecture:

```
Controller (request handling)
    ↓
Service (business logic)
    ↓
Database/External APIs (data access)
```

**Example: Conversation Service**

```javascript
// backend/services/conversationService.js

export class ServiceError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const createConversation = async (userId, title) => {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert([{ user_id: userId, title }])
    .select()
    .single();

  if (error) {
    throw new ServiceError(
      'Failed to create conversation',
      ERROR_CODES.DATABASE_ERROR,
      500
    );
  }
  return data;
};

export const getMessagesForRegeneration = async (conversationId, messageId, userId) => {
  // Verify user owns conversation first
  const { data: conversation, error: convError } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', userId)  // Security check
    .single();

  if (convError || !conversation) {
    throw new ServiceError(
      'Conversation not found or access denied',
      ERROR_CODES.RESOURCE_ACCESS_DENIED,
      403
    );
  }
  
  // ... continue with fetching messages
};
```

### 6.4 AIAgent Service (`backend/services/agentService.js`)

Key features:

**Date/Time Awareness:**
The agent is dynamically injected with current date/time information on each request:

```javascript
getSystemInstruction() {
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  const tomorrow = new Date(now.getTime() + 86400000);
  
  return `...
  **CURRENT DATE & TIME AWARENESS:**
  - Today is: ${currentDate}
  - ISO date: ${now.toISOString().split('T')[0]}
  
  When users mention relative dates, calculate actual dates:
  - "tomorrow" → ${tomorrow.toISOString().split('T')[0]}
  - "next week" → add 7 days
  - "in X days" → add X days to today
  ...`;
}
```

Key methods:

```javascript
class AIAgent {
  constructor(userId, conversationId) {
    this.userId = userId;
    this.conversationId = conversationId;
    this.toolExecutor = new ToolExecutor(userId);
    this.maxIterations = AGENT_CONFIG.MAX_ITERATIONS;
  }

  // Main processing loop
  async processRequest(userMessage, conversationHistory) {
    // 1. Check if agent features enabled
    // 2. Build chat context with current date/time
    // 3. Send to Gemini with tools
    // 4. Handle function calls or text response
    // 5. Execute tools or request approval
    // 6. Return structured response
  }

  // Error classification for user-friendly messages
  classifyError(error) {
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        isRecoverable: true,
        userMessage: '⏳ The AI service is experiencing high demand...'
      };
    }
    // ... more classifications
  }

  // Tool-specific error messages
  getToolErrorMessage(toolName, error) {
    const toolMessages = {
      'check_calendar': '📅 I couldn\'t access your calendar...',
      'send_email': '📧 There was a problem with email...',
      // ...
    };
    return toolMessages[toolName] || `❌ The ${toolName} action failed...`;
  }
}
```

### 6.5 Tools Registry (`backend/services/tools/toolsRegistry.js`)

Available tools:

| Tool | Description | Requires Approval |
|------|-------------|-------------------|
| `search_knowledge_base` | Search company knowledge | No |
| `check_calendar` | View calendar events | No |
| `book_calendar_event` | Create calendar event | **Yes** |
| `send_email` | Send email via Gmail | **Yes** |
| `get_team_members` | Find colleagues | No |
| `get_supervisor_info` | Get supervisor details | No |
| `get_vacation_policy` | Get vacation policies | No |

### 6.6 Input Validation (`backend/validators/chatValidators.js`)

```javascript
import Joi from 'joi';

export const sendMessageSchema = Joi.object({
  message: Joi.string()
    .trim()
    .min(1)
    .max(REQUEST_LIMITS.MAX_MESSAGE_LENGTH)
    .required()
    .messages({
      'string.empty': 'Message cannot be empty',
      'string.max': `Message cannot exceed ${REQUEST_LIMITS.MAX_MESSAGE_LENGTH} characters`
    }),
  conversationId: Joi.string().uuid().optional().allow(null),
  files: Joi.any().optional().allow(null)
});

export const regenerateSchema = Joi.object({
  conversationId: Joi.string().uuid().required(),
  messageId: Joi.string().uuid().required()
});
```

### 6.7 Health Checks (`backend/utils/healthCheck.js`)

```javascript
export const performHealthCheck = async (detailed = false) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };

  if (detailed) {
    health.services = {
      database: await checkDatabase(),
      gemini: await checkGeminiService()
    };
    health.memory = process.memoryUsage();
    health.nodeVersion = process.version;
  }

  return health;
};
```

---

## 7. Frontend Details

### 7.1 Component Architecture

The frontend follows a component-based architecture with:
- **Presentational components**: UI-only (Toast, SkeletonLoader)
- **Container components**: State + logic (ChatContainer, Sidebar)
- **HOCs/Wrappers**: Cross-cutting concerns (ErrorBoundary, ProtectedRoute)

### 7.2 Custom Hooks

#### `useChat` - Main Chat Logic

```javascript
// frontend/src/hooks/useChat.js
const useChat = ({ initialMessages, conversationId, showToast }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState([]);
  // ...

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading) return;
    // Add user message, call API, handle response
  };

  const handleRegenerate = async (messageId) => {
    // Regenerate AI response for specific message
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  };

  return {
    messages, inputValue, isLoading, pendingActions,
    setInputValue, handleSubmit, handleRegenerate,
    handleCopy, handleReact, handleEdit, ...
  };
};
```

#### `useLocalStorage` - Persistent State

```javascript
// frontend/src/hooks/useLocalStorage.js
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    setStoredValue(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue];
};
```

#### `useSpeechRecognition` - Voice Input

```javascript
// frontend/src/hooks/useSpeechRecognition.js
const useSpeechRecognition = ({ onResult, onError }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      onError('Speech recognition not supported');
      return;
    }
    // Start recognition
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return { isListening, startListening, stopListening };
};
```

### 7.3 Context Providers

#### ThemeContext

```javascript
// frontend/src/contexts/ThemeContext.js
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', true);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme', 
      isDarkMode ? 'dark' : 'light'
    );
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### 7.4 Error Boundary

```javascript
// frontend/src/components/ErrorBoundary.jsx
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <button onClick={this.handleRetry}>Try Again</button>
          <button onClick={() => window.location.reload()}>Refresh</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 7.5 Performance Optimizations

- **React.memo**: Applied to `MessageItem`, `ChatMessages`, `WelcomeScreen`
- **Lazy Loading**: Modals loaded on-demand:
  ```javascript
  const ActionApprovalModal = lazy(() => import('./components/ActionApprovalModal'));
  const ProfileSettingsModal = lazy(() => import('./components/ProfileSettingsModal'));
  ```
- **useCallback/useMemo**: Used for event handlers and computed values

---

## 8. Database Schema

### 8.1 Core Tables

```sql
-- User Profiles (synced from auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_favourite BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  model TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Actions (for approval workflow)
CREATE TABLE agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed')),
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

-- Knowledge Base (for RAG)
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  embedding VECTOR(384),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth Tokens (for Google integration)
CREATE TABLE user_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
```

### 8.2 Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only access their own data:

```sql
-- Example: Conversations RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);
```

### 8.3 Hybrid Knowledge Base Tables (Phase 6)

The knowledge base uses a **hybrid approach** combining SQL relational tables for structured queries with vector embeddings for semantic search.

#### Relational Tables

```sql
-- Employees with manager relationships
CREATE TABLE kb_employees (
  id TEXT PRIMARY KEY,              -- E001, E002...
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  role TEXT NOT NULL,
  manager_id TEXT REFERENCES kb_employees(id),
  hire_date DATE,
  work_location TEXT,
  access_level TEXT DEFAULT 'Standard',
  onboarding_status TEXT DEFAULT 'Not Started',
  required_tools TEXT[]
);

-- FAQs with department/role filtering
CREATE TABLE kb_faqs (
  id TEXT PRIMARY KEY,              -- F001, F002...
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty_level TEXT,
  context_tags TEXT[]
);

-- Junction tables for many-to-many relationships
CREATE TABLE kb_faq_departments (faq_id TEXT, department TEXT);
CREATE TABLE kb_faq_roles (faq_id TEXT, role TEXT);

-- Onboarding tasks by role/department
CREATE TABLE kb_onboarding_tasks (
  id TEXT PRIMARY KEY,              -- T001, T002...
  category TEXT NOT NULL,
  task_name TEXT NOT NULL,
  description TEXT,
  department TEXT,
  priority TEXT,
  deadline TEXT                     -- "Day 1", "Week 1", etc.
);

CREATE TABLE kb_task_roles (task_id TEXT, role TEXT);
```

#### SQL Functions for Personalized Queries

| Function | Description |
|----------|-------------|
| `get_employee_by_email(email)` | Get employee with manager details |
| `get_employee_by_id(id)` | Get employee by ID with manager |
| `get_tasks_for_employee(id)` | Get tasks filtered by role/department |
| `get_faqs_for_employee(id)` | Get FAQs relevant to employee |
| `get_team_by_department(dept)` | Get all team members in department |
| `get_direct_reports(manager_id)` | Get manager's direct reports |
| `search_employees_by_name(name)` | Fuzzy name search |

#### Hybrid Query Flow

```
User Query
    │
    ▼
┌─────────────────┐
│  Query Router   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌────────────┐
│  SQL  │ │  Semantic  │
│ Query │ │   Search   │
└───┬───┘ └─────┬──────┘
    │           │
    ▼           ▼
Fast lookup   Vector
(exact)      similarity
    │           │
    └─────┬─────┘
          ▼
    Combined Result
```

**SQL is used for:**
- "Who is my manager?"
- "Show me the AI team"
- "What are my onboarding tasks?"

**Semantic search is used for:**
- "How do I reset my password?"
- "Tell me about vacation policy"
- "What is the approval process for expenses?"

---

## 9. API Reference

### 9.1 Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/me` | GET | Get current user |
| `/api/google-auth/url` | GET | Get Google OAuth URL |
| `/api/google-auth/callback` | GET | OAuth callback |
| `/api/google-auth/status` | GET | Check connection status |
| `/api/google-auth/disconnect` | POST | Disconnect Google |

### 9.2 Chat

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/message` | POST | Send message to AI |
| `/api/chat/regenerate` | POST | Regenerate response |
| `/api/chat/conversations` | GET | List conversations |
| `/api/chat/conversations/:id` | PUT | Update conversation |
| `/api/chat/conversations/:id` | DELETE | Delete conversation |

**Send Message Request:**
```json
{
  "message": "What are the vacation policies?",
  "conversationId": "uuid-or-null",
  "files": null
}
```

**Send Message Response:**
```json
{
  "success": true,
  "conversationId": "abc-123",
  "content": "The company offers...",
  "model": "gemini-2.0-flash",
  "timestamp": "2025-12-06T10:00:00Z"
}
```

### 9.3 Agent

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent/message` | POST | Send message to agent |
| `/api/agent/actions/approve` | POST | Approve pending actions |
| `/api/agent/actions/reject` | POST | Reject pending actions |
| `/api/agent/actions` | GET | Get pending actions |
| `/api/agent/stats` | GET | Get agent statistics |
| `/api/agent/preferences` | GET/PUT | Agent preferences |

### 9.4 Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Detailed health check |
| `/api/health/live` | GET | Liveness check |
| `/api/health/ready` | GET | Readiness check |

---

## 10. Authentication & Security

### 10.1 Authentication Flow

```
1. User clicks "Sign in with Google"
2. Frontend redirects to Supabase OAuth
3. User authenticates with Google
4. Supabase creates/updates user
5. Frontend receives session with JWT
6. All API calls include JWT in Authorization header
7. Backend verifies JWT with Supabase
```

### 10.2 Security Measures

| Measure | Implementation |
|---------|----------------|
| Authentication | Supabase Auth + Google OAuth |
| Authorization | JWT verification middleware |
| Data Isolation | PostgreSQL RLS policies |
| Input Validation | Joi schemas on all endpoints |
| Rate Limiting | express-rate-limit (100 req/min) |
| Security Headers | Helmet.js |
| CORS | Restricted to frontend origin |
| Password Storage | Handled by Supabase (no plaintext) |

### 10.3 Security Fix: User Ownership Verification

A critical security fix was implemented for message regeneration:

```javascript
// BEFORE: No user verification (vulnerable to IDOR)
export const getMessagesForRegeneration = async (conversationId, messageId) => {
  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId);
  // Any user could access any conversation!
};

// AFTER: User ownership verified
export const getMessagesForRegeneration = async (conversationId, messageId, userId) => {
  // First verify user owns this conversation
  const { data: conversation } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', userId)  // Security check
    .single();

  if (!conversation) {
    throw new ServiceError('Access denied', 'RES_3003', 403);
  }
  // ...
};
```

---

## 11. Testing Infrastructure

### 11.1 Backend Tests

**Configuration:** `backend/jest.config.js`

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

**Test Suites:**

| Suite | Tests | Description |
|-------|-------|-------------|
| `constants/index.test.js` | 21 | Verifies all constants |
| `validators/chatValidators.test.js` | 26 | Input validation schemas |
| `middleware/validationMiddleware.test.js` | 9 | Validation middleware |
| `utils/apiResponse.test.js` | 14 | Response utilities |
| `utils/envValidator.test.js` | 13 | Environment validation |
| `utils/healthCheck.test.js` | 5 | Health check utilities |
| `utils/gracefulShutdown.test.js` | 3 | Shutdown handling |
| `services/agentService.test.js` | 12 | AI agent service |
| `services/toolExecutor.test.js` | 18 | Tool execution |
| `services/toolsRegistry.test.js` | 37 | Tools registry |

**Total: 158 tests**

### 11.2 Frontend Tests

**Configuration:** Uses React Scripts (CRA) Jest setup

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

**Test Files:**

| File | Description |
|------|-------------|
| `Toast.test.jsx` | Toast notification component |
| `ErrorBoundary.test.jsx` | Error boundary handling |
| `SkeletonLoader.test.jsx` | Loading skeleton |
| `useLocalStorage.test.js` | Local storage hook |
| `useChat.test.js` | Chat logic hook |

### 11.3 Test Mocking

**Backend (`backend/tests/setup.js`):**
```javascript
// Mock Supabase
jest.unstable_mockModule('../config/database.js', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      // ...
    }))
  }
}));
```

**Frontend (`frontend/src/setupTests.js`):**
```javascript
// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
});

// Mock clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: jest.fn().mockResolvedValue(undefined) }
});
```

---

## 12. Configuration

### 12.1 Backend Environment Variables

```env
# Server
NODE_ENV=development
PORT=8000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Google OAuth (for Calendar/Gmail)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/google-auth/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 12.2 Frontend Environment Variables

```env
# API
REACT_APP_API_URL=http://localhost:8000

# Supabase
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

### 12.3 Environment Validation

The backend validates all environment variables on startup:

```javascript
// backend/utils/envValidator.js
export const validateEnv = () => {
  const errors = [];
  const warnings = [];

  // Required variables
  if (!process.env.SUPABASE_URL) {
    errors.push('SUPABASE_URL is required');
  } else if (!process.env.SUPABASE_URL.includes('supabase')) {
    errors.push('SUPABASE_URL format is invalid');
  }

  // ...

  return { isValid: errors.length === 0, errors, warnings };
};
```

---

## 13. Refactoring History

### 13.1 Frontend Refactoring (Major)

**Before:** Single `App.js` file with 1922 lines
**After:** Modular structure with 466 lines in `App.js`

**Changes:**

| Component | Action | Lines |
|-----------|--------|-------|
| `WelcomeScreen.jsx` | Extracted | ~40 |
| `ChatInput.jsx` | Extracted | ~80 |
| `ChatMessages.jsx` | Extracted | ~60 |
| `MessageItem.jsx` | Extracted | ~100 |
| `Sidebar.jsx` | Extracted | ~200 |
| `UserMenu.jsx` | Extracted | ~80 |
| `useSpeechRecognition.js` | Extracted hook | ~110 |
| `useTypingEffect.js` | Extracted hook | ~30 |
| `useChat.js` | Extracted hook | ~300 |
| `ThemeContext.js` | New context | ~45 |
| `ErrorBoundary.jsx` | New component | ~60 |

**Reduction:** 76% (1922 → 466 lines)

### 13.2 Backend Refactoring

**Service Layer Introduction:**
- Created `conversationService.js` (302 lines)
- Extracted database operations from controllers
- Added `ServiceError` class for typed errors

**Standardization:**
- Created `constants/index.js` for all constants
- Created `utils/apiResponse.js` for response helpers
- Created `validators/chatValidators.js` for Joi schemas

**Infrastructure:**
- Added `envValidator.js` for startup validation
- Added `healthCheck.js` for monitoring
- Added `gracefulShutdown.js` for clean exits

### 13.3 Bug Fixes

| Issue | File | Fix |
|-------|------|-----|
| Chat error on empty response | `agentService.js` | Added fallback message |
| Invalid `files` column | `chatController.js` | Removed from insert |
| `redirect_uri_mismatch` | `.env` | Corrected URI |
| Dropdown text cutoff | `sidebar.css` | Increased min-width |
| `ServiceError` statusCode ignored | `chatController.js` | Use `error.statusCode` |
| Undefined `conversationId` in logs | `chatController.js` | Use `currentConversationId` |
| IDOR vulnerability | `conversationService.js` | Added user verification |

---

## 14. Known Issues & Limitations

### 14.1 Current Limitations

| Limitation | Description |
|------------|-------------|
| Local only | Not configured for production deployment |
| No file upload | File upload UI exists but backend not implemented |
| Single language | English only, no i18n |
| No offline support | Requires internet connection |
| Browser compatibility | Speech recognition requires Chrome/Edge |

### 14.2 Technical Debt

| Item | Priority | Description |
|------|----------|-------------|
| E2E tests | Medium | No Cypress/Playwright tests |
| API documentation | Low | No OpenAPI/Swagger docs |
| Caching | Low | No Redis/caching layer |
| Monitoring | Low | No APM (Datadog, etc.) |
| CI/CD | Medium | No automated pipelines |

---

## 15. Future Improvements

### 15.1 High Priority

| Improvement | Effort | Impact |
|-------------|--------|--------|
| File upload implementation | Medium | High |
| Streaming responses | Medium | High |
| WebSocket support | High | High |
| Production deployment guide | Low | High |

### 15.2 Medium Priority

| Improvement | Effort | Impact |
|-------------|--------|--------|
| Multi-language support (i18n) | Medium | Medium |
| Conversation export (PDF/JSON) | Low | Medium |
| Keyboard shortcuts | Low | Medium |
| Message search | Medium | Medium |
| Custom AI personalities | Low | Medium |

### 15.3 Low Priority

| Improvement | Effort | Impact |
|-------------|--------|--------|
| Mobile app (React Native) | High | Medium |
| Slack/Teams integration | Medium | Low |
| Analytics dashboard | Medium | Low |
| Custom embedding models | High | Low |
| Multi-tenant support | High | Low |

### 15.4 Recommended Next Steps

1. **Implement file upload** - Backend handling for documents
2. **Add streaming responses** - Better UX for long responses
3. **Create production deployment guide** - Vercel/Railway/Docker
4. **Add E2E tests** - Cypress for critical user flows
5. **Implement WebSockets** - Real-time action status updates

---

## Appendix A: Git Commit History (Session)

```
29e8c9f2 - security: add user ownership verification to getMessagesForRegeneration
[previous] - fix(logging): use currentConversationId in sendMessage error handler
[previous] - fix(api): respect ServiceError statusCode in chat controller
[previous] - test(backend): add comprehensive service integration tests
[previous] - test(frontend): add unit tests for hooks and components
[previous] - docs: update README, SETUP, QUICKSTART after improvements
[previous] - feat(backend): add health checks and graceful shutdown
[previous] - feat(backend): add unit tests and environment validation
[previous] - refactor(backend): add constants, validation, service layer
[previous] - refactor(frontend): extract components and hooks from App.js
[previous] - fix: correct Google OAuth redirect URI
```

---

## Appendix B: Quick Reference Commands

```bash
# Start development
npm run dev              # Start both frontend and backend

# Backend only
cd backend
npm run dev              # Start with hot reload
npm test                 # Run tests
npm run test:coverage    # Run with coverage

# Frontend only
cd frontend
npm start                # Start dev server
npm test                 # Run tests
npm run build            # Production build

# Database
cd backend
npm run load-kb          # Load knowledge base data

# Git
git status               # Check changes
git log --oneline -10    # Recent commits
```

---

## Appendix C: Troubleshooting

### Common Issues

**1. "Missing Supabase environment variables"**
```bash
# Copy example env and fill in values
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env.local
```

**2. "redirect_uri_mismatch"**
```
Ensure GOOGLE_REDIRECT_URI matches exactly what's configured in Google Cloud Console.
For local dev: http://localhost:8000/api/google-auth/callback
```

**3. "JWT verification failed"**
```
- Check SUPABASE_JWT_SECRET is correct
- Ensure token hasn't expired
- Try logging out and back in
```

**4. "Foreign key constraint fails"**
```sql
-- Run in Supabase SQL editor:
-- backend/database/fixes/fix-conversations-foreign-key.sql
```

**5. "Rate limit exceeded"**
```
Wait 1 minute and try again.
Or adjust RATE_LIMITS in backend/constants/index.js
```

---

*This documentation was generated on December 6, 2025, and reflects the state of the project after comprehensive refactoring and security improvements.*

